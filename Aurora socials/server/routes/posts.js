import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { createNotification } from './notifications.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper function to extract hashtags from content
function extractHashtags(content) {
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex);
  if (!matches) return [];
  return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
}

// Helper function to create/link hashtags to a post
async function linkHashtagsToPost(postId, hashtags) {
  for (const tagName of hashtags) {
    // Find or create the hashtag
    let hashtag = await prisma.hashtag.findUnique({ where: { name: tagName } });
    if (!hashtag) {
      hashtag = await prisma.hashtag.create({ data: { name: tagName } });
    }
    // Link hashtag to post
    await prisma.postHashtag.upsert({
      where: { postId_hashtagId: { postId, hashtagId: hashtag.id } },
      update: {},
      create: { postId, hashtagId: hashtag.id }
    });
  }
}

// Get posts for feed
router.get('/', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: { select: { id: true, username: true, profilePicture: true } },
        likes: true,
        reactions: {
          include: {
            user: { select: { id: true, username: true } }
          }
        },
        comments: {
          include: { 
            author: { select: { id: true, username: true, profilePicture: true } },
            likes: true,
            replies: {
              include: {
                author: { select: { id: true, username: true, profilePicture: true } },
                likes: true
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          where: { parentId: null },
          orderBy: { createdAt: 'asc' }
        },
        savedBy: true,
        hashtags: {
          include: { hashtag: true }
        },
        poll: {
          include: {
            options: {
              include: {
                votes: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get trending hashtags
router.get('/trending/hashtags', async (req, res) => {
  try {
    // Get hashtags with most posts in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const trending = await prisma.hashtag.findMany({
      include: {
        posts: {
          where: {
            createdAt: { gte: sevenDaysAgo }
          },
          include: {
            post: true
          }
        }
      }
    });
    
    // Sort by post count and format response
    const formattedTrending = trending
      .map(tag => ({
        id: tag.id,
        name: tag.name,
        postCount: tag.posts.length,
        recentPosts: tag.posts.length
      }))
      .filter(tag => tag.postCount > 0)
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 10);
    
    res.json(formattedTrending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trending hashtags' });
  }
});

// Search posts by content or hashtag
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json([]);
  }
  
  try {
    const searchTerm = q.trim().toLowerCase();
    
    // Search in post content
    const posts = await prisma.post.findMany({
      where: {
        content: {
          contains: searchTerm
        }
      },
      include: {
        author: { select: { id: true, username: true, profilePicture: true } },
        likes: true,
        comments: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get posts by hashtag
router.get('/hashtag/:tag', async (req, res) => {
  const { tag } = req.params;
  try {
    const hashtag = await prisma.hashtag.findUnique({
      where: { name: tag.toLowerCase() },
      include: {
        posts: {
          include: {
            post: {
              include: {
                author: { select: { id: true, username: true, profilePicture: true } },
                likes: true,
                reactions: {
                  include: {
                    user: { select: { id: true, username: true } }
                  }
                },
                comments: {
                  include: { 
                    author: { select: { id: true, username: true, profilePicture: true } },
                    likes: true
                  },
                  where: { parentId: null }
                },
                savedBy: true,
                hashtags: {
                  include: { hashtag: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!hashtag) {
      return res.json({ tag, posts: [] });
    }
    
    const posts = hashtag.posts.map(ph => ph.post);
    res.json({ tag: hashtag.name, postCount: posts.length, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts for hashtag' });
  }
});

// Get single post by ID
router.get('/:id', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, username: true, profilePicture: true } },
        likes: true,
        reactions: {
          include: {
            user: { select: { id: true, username: true } }
          }
        },
        comments: {
          include: { 
            author: { select: { id: true, username: true, profilePicture: true } },
            likes: true,
            replies: {
              include: {
                author: { select: { id: true, username: true, profilePicture: true } },
                likes: true
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          where: { parentId: null },
          orderBy: { createdAt: 'asc' }
        },
        savedBy: true
      }
    });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create a new post
router.post('/', authenticateToken, async (req, res) => {
  const { content, mediaUrl, pollOptions, pollQuestion } = req.body;
  const userId = req.user.userId; // Get userId from JWT token, not request body
  if (!content) {
    return res.status(400).json({ success: false, message: 'Content required.' });
  }
  try {
    const post = await prisma.post.create({
      data: {
        authorId: userId,
        content,
        mediaUrl: mediaUrl || null
      }
    });
    
    // Extract and link hashtags
    const hashtags = extractHashtags(content);
    if (hashtags.length > 0) {
      await linkHashtagsToPost(post.id, hashtags);
    }
    
    // Create poll if options provided
    if (pollOptions && pollOptions.length >= 2) {
      await prisma.poll.create({
        data: {
          postId: post.id,
          question: pollQuestion || 'What do you think?',
          options: {
            create: pollOptions.map(text => ({ text }))
          }
        }
      });
    }
    
    // Fetch the complete post with all relations
    const fullPost = await prisma.post.findUnique({
      where: { id: post.id },
      include: {
        author: { select: { id: true, username: true, profilePicture: true } },
        likes: true,
        comments: true,
        savedBy: true,
        hashtags: { include: { hashtag: true } },
        poll: {
          include: {
            options: { include: { votes: true } }
          }
        }
      }
    });
    
    return res.json({ success: true, post: fullPost });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Like/unlike a post (toggle)
router.post('/:id/like', authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const userId = req.user.userId; // Get userId from JWT token
  try {
    const existingLike = await prisma.like.findFirst({ where: { postId, userId } });
    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return res.json({ success: true, liked: false });
    } else {
      await prisma.like.create({ data: { postId, userId } });

      // Notify post author
      const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
      if (post && post.authorId !== userId) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        await createNotification({
          userId: post.authorId,
          fromUserId: userId,
          type: 'like',
          message: `${user?.username || 'Someone'} liked your post`,
          postId
        });
      }

      return res.json({ success: true, liked: true });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Delete a post (only by author)
router.delete('/:id', authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const userId = req.user.userId; // Get userId from JWT token
  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }
    if (post.authorId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post.' });
    }
    // Delete related records first
    await prisma.comment.deleteMany({ where: { postId } });
    await prisma.like.deleteMany({ where: { postId } });
    await prisma.savedPost.deleteMany({ where: { postId } });
    await prisma.reaction.deleteMany({ where: { postId } });
    await prisma.post.delete({ where: { id: postId } });
    return res.json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Add reaction to a post
router.post('/:id/react', authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const userId = req.user.userId; // Get userId from JWT token
  const { emoji, label, category } = req.body;
  if (!emoji || !label || !category) {
    return res.status(400).json({ success: false, message: 'Emoji, label, and category required.' });
  }
  try {
    // Check if user already reacted with this emoji
    const existingReaction = await prisma.reaction.findUnique({
      where: { userId_postId_emoji: { userId, postId, emoji } }
    });
    if (existingReaction) {
      // Remove reaction if it already exists (toggle off)
      await prisma.reaction.delete({
        where: { id: existingReaction.id }
      });
      return res.json({ success: true, action: 'removed' });
    } else {
      // Add new reaction
      await prisma.reaction.create({
        data: { userId, postId, emoji, label, category }
      });
      
      // Get post author to send notification
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true }
      });
      
      if (post && post.authorId !== userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true }
        });
        await createNotification({
          userId: post.authorId,
          fromUserId: userId,
          type: 'reaction',
          message: `${user?.username || 'Someone'} reacted ${emoji} to your post`,
          postId
        });
      }
      
      return res.json({ success: true, action: 'added' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Remove all reactions from a user on a post (clear all)
router.delete('/:id/reactions', authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const userId = req.user.userId; // Get userId from JWT token
  try {
    await prisma.reaction.deleteMany({
      where: { userId, postId }
    });
    return res.json({ success: true, message: 'All reactions removed.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
