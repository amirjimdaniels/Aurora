import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const router = express.Router();

// Add a comment to a post (supports replies via parentId)
router.post('/:id/comment', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const { userId, content, parentId } = req.body;
  if (!userId || !content) {
    return res.status(400).json({ success: false, message: 'User ID and content required.' });
  }
  try {
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content,
        parentId: parentId ? parseInt(parentId, 10) : null
      }
    });
    return res.json({ success: true, comment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Like/unlike a comment
router.post('/:commentId/like', async (req, res) => {
  const commentId = parseInt(req.params.commentId, 10);
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID required.' });
  }
  try {
    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } }
    });
    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
      return res.json({ success: true, liked: false });
    } else {
      await prisma.commentLike.create({ data: { userId, commentId } });
      return res.json({ success: true, liked: true });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Delete a comment (only by author) - also deletes all replies
router.delete('/:commentId', async (req, res) => {
  const commentId = parseInt(req.params.commentId, 10);
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID required.' });
  }
  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }
    if (comment.authorId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment.' });
    }
    // Delete all replies first
    await prisma.comment.deleteMany({ where: { parentId: commentId } });
    // Delete the comment
    await prisma.comment.delete({ where: { id: commentId } });
    return res.json({ success: true, message: 'Comment deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
