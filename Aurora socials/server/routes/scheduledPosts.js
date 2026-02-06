import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const router = express.Router();

// Create a scheduled post
router.post('/', async (req, res) => {
  try {
    const { userId, content, mediaUrl, scheduledAt } = req.body;
    
    if (!userId || !content || !scheduledAt) {
      return res.status(400).json({ error: 'userId, content, and scheduledAt are required' });
    }
    
    const scheduledTime = new Date(scheduledAt);
    if (scheduledTime <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }
    
    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        content,
        mediaUrl,
        scheduledAt: scheduledTime,
        authorId: Number(userId)
      },
      include: {
        author: {
          select: { id: true, username: true, profilePicture: true }
        }
      }
    });
    
    res.status(201).json(scheduledPost);
  } catch (error) {
    console.error('Create scheduled post error:', error);
    res.status(500).json({ error: 'Failed to schedule post' });
  }
});

// Get user's scheduled posts
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const scheduledPosts = await prisma.scheduledPost.findMany({
      where: {
        authorId: Number(userId),
        published: false,
        scheduledAt: { gte: new Date() }
      },
      orderBy: { scheduledAt: 'asc' }
    });
    
    res.json(scheduledPosts);
  } catch (error) {
    console.error('Get scheduled posts error:', error);
    res.status(500).json({ error: 'Failed to get scheduled posts' });
  }
});

// Update scheduled post
router.put('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, content, mediaUrl, scheduledAt } = req.body;
    
    const post = await prisma.scheduledPost.findUnique({
      where: { id: Number(postId) }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Scheduled post not found' });
    }
    
    if (post.authorId !== Number(userId)) {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }
    
    if (post.published) {
      return res.status(400).json({ error: 'Cannot edit a published post' });
    }
    
    const updated = await prisma.scheduledPost.update({
      where: { id: Number(postId) },
      data: {
        content: content || post.content,
        mediaUrl: mediaUrl !== undefined ? mediaUrl : post.mediaUrl,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : post.scheduledAt
      }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Update scheduled post error:', error);
    res.status(500).json({ error: 'Failed to update scheduled post' });
  }
});

// Delete scheduled post
router.delete('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    const post = await prisma.scheduledPost.findUnique({
      where: { id: Number(postId) }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Scheduled post not found' });
    }
    
    if (post.authorId !== Number(userId)) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    await prisma.scheduledPost.delete({
      where: { id: Number(postId) }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete scheduled post error:', error);
    res.status(500).json({ error: 'Failed to delete scheduled post' });
  }
});

// Publish scheduled posts (called periodically by a cron job or on server startup)
router.post('/publish', async (req, res) => {
  try {
    const now = new Date();
    
    // Find all scheduled posts that should be published
    const postsToPublish = await prisma.scheduledPost.findMany({
      where: {
        published: false,
        scheduledAt: { lte: now }
      }
    });
    
    const publishedPosts = [];
    
    for (const scheduledPost of postsToPublish) {
      // Create the actual post
      const newPost = await prisma.post.create({
        data: {
          content: scheduledPost.content,
          mediaUrl: scheduledPost.mediaUrl,
          authorId: scheduledPost.authorId
        }
      });
      
      // Mark scheduled post as published
      await prisma.scheduledPost.update({
        where: { id: scheduledPost.id },
        data: { published: true }
      });
      
      publishedPosts.push(newPost);
    }
    
    res.json({
      message: `Published ${publishedPosts.length} scheduled posts`,
      posts: publishedPosts
    });
  } catch (error) {
    console.error('Publish scheduled posts error:', error);
    res.status(500).json({ error: 'Failed to publish scheduled posts' });
  }
});

// Publish now (immediately publish a scheduled post)
router.post('/:postId/publish-now', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    const scheduledPost = await prisma.scheduledPost.findUnique({
      where: { id: Number(postId) }
    });
    
    if (!scheduledPost) {
      return res.status(404).json({ error: 'Scheduled post not found' });
    }
    
    if (scheduledPost.authorId !== Number(userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    if (scheduledPost.published) {
      return res.status(400).json({ error: 'Post already published' });
    }
    
    // Create the actual post
    const newPost = await prisma.post.create({
      data: {
        content: scheduledPost.content,
        mediaUrl: scheduledPost.mediaUrl,
        authorId: scheduledPost.authorId
      },
      include: {
        author: {
          select: { id: true, username: true, profilePicture: true }
        }
      }
    });
    
    // Mark as published
    await prisma.scheduledPost.update({
      where: { id: Number(postId) },
      data: { published: true }
    });
    
    res.json(newPost);
  } catch (error) {
    console.error('Publish now error:', error);
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

export default router;
