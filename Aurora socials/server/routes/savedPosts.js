import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all saved posts for a user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  // Verify user can only access their own saved posts
  if (userId !== req.user.userId) {
    return res.status(403).json({ success: false, message: 'Not authorized to view these saved posts.' });
  }
  try {
    const savedPosts = await prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: { select: { id: true, username: true, profilePicture: true } },
            likes: true,
            comments: {
              include: { author: { select: { id: true, username: true, profilePicture: true } } }
            }
          }
        }
      },
      orderBy: { id: 'desc' }
    });
    res.json(savedPosts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch saved posts' });
  }
});

// Toggle save/unsave post
router.post('/:id/save', authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const userId = req.user.userId; // Get userId from JWT token
  try {
    const existingSaved = await prisma.savedPost.findFirst({ where: { postId, userId } });
    if (existingSaved) {
      await prisma.savedPost.delete({ where: { id: existingSaved.id } });
      return res.json({ success: true, saved: false });
    } else {
      await prisma.savedPost.create({ data: { postId, userId } });
      return res.json({ success: true, saved: true });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
