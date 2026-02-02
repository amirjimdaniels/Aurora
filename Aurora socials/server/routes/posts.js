import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const router = express.Router();

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
        savedBy: true
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
router.post('/', async (req, res) => {
  const { userId, content, mediaUrl } = req.body;
  if (!userId || !content) {
    return res.status(400).json({ success: false, message: 'User ID and content required.' });
  }
  try {
    const post = await prisma.post.create({
      data: {
        authorId: userId,
        content,
        mediaUrl: mediaUrl || null
      }
    });
    return res.json({ success: true, post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Like/unlike a post (toggle)
router.post('/:id/like', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID required.' });
  }
  try {
    const existingLike = await prisma.like.findFirst({ where: { postId, userId } });
    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return res.json({ success: true, liked: false });
    } else {
      await prisma.like.create({ data: { postId, userId } });
      return res.json({ success: true, liked: true });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Delete a post (only by author)
router.delete('/:id', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID required.' });
  }
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
router.post('/:id/react', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const { userId, emoji, label, category } = req.body;
  if (!userId || !emoji || !label || !category) {
    return res.status(400).json({ success: false, message: 'User ID, emoji, label, and category required.' });
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
      return res.json({ success: true, action: 'added' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Remove all reactions from a user on a post (clear all)
router.delete('/:id/reactions', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID required.' });
  }
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
