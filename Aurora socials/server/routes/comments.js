import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const router = express.Router();

// Add a comment to a post
router.post('/:id/comment', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const { userId, content } = req.body;
  if (!userId || !content) {
    return res.status(400).json({ success: false, message: 'User ID and content required.' });
  }
  try {
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content
      }
    });
    return res.json({ success: true, comment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
