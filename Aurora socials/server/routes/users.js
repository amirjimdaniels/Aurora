import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const router = express.Router();

// Get user profile by ID
router.get('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        coverPhoto: true,
        birthday: true,
        location: true,
        createdAt: true,
        posts: {
          include: {
            author: { select: { username: true } },
            likes: true,
            comments: {
              include: { author: { select: { username: true } } }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { posts: true }
        }
      }
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { bio, profilePicture, coverPhoto, birthday, location } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bio: bio !== undefined ? bio : undefined,
        profilePicture: profilePicture !== undefined ? profilePicture : undefined,
        coverPhoto: coverPhoto !== undefined ? coverPhoto : undefined,
        birthday: birthday !== undefined ? birthday : undefined,
        location: location !== undefined ? location : undefined
      },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        coverPhoto: true,
        birthday: true,
        location: true,
        createdAt: true
      }
    });
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

export default router;
