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
        author: { select: { username: true } },
        likes: true,
        comments: {
          include: { author: { select: { username: true } } }
        },
        savedBy: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
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

export default router;
