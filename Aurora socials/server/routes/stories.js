import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create a new story
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Get userId from JWT token
    const { mediaUrl, caption } = req.body;

    if (!mediaUrl) {
      return res.status(400).json({ error: 'mediaUrl is required' });
    }
    
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    const story = await prisma.story.create({
      data: {
        mediaUrl,
        caption,
        authorId: Number(userId),
        expiresAt
      },
      include: {
        author: {
          select: { id: true, username: true, profilePicture: true }
        }
      }
    });
    
    res.status(201).json(story);
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
});

// Get all active stories (not expired)
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    
    // Delete expired stories first
    await prisma.story.deleteMany({
      where: { expiresAt: { lt: now } }
    });
    
    // Get all active stories grouped by user
    const stories = await prisma.story.findMany({
      where: { expiresAt: { gt: now } },
      include: {
        author: {
          select: { id: true, username: true, profilePicture: true }
        },
        views: {
          select: { userId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Group stories by author
    const groupedStories = stories.reduce((acc, story) => {
      const authorId = story.authorId;
      if (!acc[authorId]) {
        acc[authorId] = {
          author: story.author,
          stories: [],
          hasUnviewed: false
        };
      }
      acc[authorId].stories.push({
        id: story.id,
        mediaUrl: story.mediaUrl,
        caption: story.caption,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        viewCount: story.views.length,
        viewerIds: story.views.map(v => v.userId)
      });
      return acc;
    }, {});
    
    res.json(Object.values(groupedStories));
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: 'Failed to get stories' });
  }
});

// Get stories from users I follow
router.get('/feed/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    
    // Get list of users I follow
    const following = await prisma.follow.findMany({
      where: { followerId: Number(userId) },
      select: { followingId: true }
    });
    
    const followingIds = following.map(f => f.followingId);
    followingIds.push(Number(userId)); // Include own stories
    
    // Get stories from followed users
    const stories = await prisma.story.findMany({
      where: {
        authorId: { in: followingIds },
        expiresAt: { gt: now }
      },
      include: {
        author: {
          select: { id: true, username: true, profilePicture: true }
        },
        views: {
          select: { userId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Group stories by author
    const groupedStories = stories.reduce((acc, story) => {
      const authorId = story.authorId;
      if (!acc[authorId]) {
        acc[authorId] = {
          author: story.author,
          stories: [],
          hasUnviewed: false
        };
      }
      
      const isViewed = story.views.some(v => v.userId === Number(userId));
      if (!isViewed) acc[authorId].hasUnviewed = true;
      
      acc[authorId].stories.push({
        id: story.id,
        mediaUrl: story.mediaUrl,
        caption: story.caption,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        viewCount: story.views.length,
        viewed: isViewed
      });
      return acc;
    }, {});
    
    // Sort: unviewed first, then by recency
    const result = Object.values(groupedStories).sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return new Date(b.stories[0].createdAt) - new Date(a.stories[0].createdAt);
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get story feed error:', error);
    res.status(500).json({ error: 'Failed to get story feed' });
  }
});

// View a story (mark as seen)
router.post('/:storyId/view', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.userId; // Get userId from JWT token
    
    // Check if already viewed
    const existing = await prisma.storyView.findUnique({
      where: {
        storyId_userId: {
          storyId: Number(storyId),
          userId: Number(userId)
        }
      }
    });
    
    if (!existing) {
      await prisma.storyView.create({
        data: {
          storyId: Number(storyId),
          userId: Number(userId)
        }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ error: 'Failed to mark story as viewed' });
  }
});

// Get story viewers
router.get('/:storyId/viewers', async (req, res) => {
  try {
    const { storyId } = req.params;
    
    const views = await prisma.storyView.findMany({
      where: { storyId: Number(storyId) },
      include: {
        story: {
          select: { authorId: true }
        }
      }
    });
    
    // Get user info for each viewer
    const viewerIds = views.map(v => v.userId);
    const viewers = await prisma.user.findMany({
      where: { id: { in: viewerIds } },
      select: { id: true, username: true, profilePicture: true }
    });
    
    res.json(viewers);
  } catch (error) {
    console.error('Get story viewers error:', error);
    res.status(500).json({ error: 'Failed to get story viewers' });
  }
});

// Delete a story
router.delete('/:storyId', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.userId; // Get userId from JWT token

    // Verify ownership
    const story = await prisma.story.findUnique({
      where: { id: Number(storyId) }
    });
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    if (story.authorId !== Number(userId)) {
      return res.status(403).json({ error: 'Not authorized to delete this story' });
    }
    
    await prisma.story.delete({
      where: { id: Number(storyId) }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: 'Failed to delete story' });
  }
});

export default router;
