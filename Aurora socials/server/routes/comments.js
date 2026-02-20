import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { createNotification } from './notifications.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Add a comment to a post (supports replies via parentId)
router.post('/:id/comment', authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const userId = req.user.userId; // Get userId from JWT token
  const { content, parentId } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, message: 'Content required.' });
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
    
    // Get user info for notification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });
    
    if (parentId) {
      // This is a reply to a comment
      const parentComment = await prisma.comment.findUnique({
        where: { id: parseInt(parentId, 10) },
        select: { authorId: true }
      });
      
      if (parentComment && parentComment.authorId !== userId) {
        await createNotification({
          userId: parentComment.authorId,
          fromUserId: userId,
          type: 'comment_reply',
          message: `${user?.username || 'Someone'} replied to your comment`,
          postId,
          commentId: comment.id
        });
      }
    } else {
      // This is a comment on a post
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true }
      });
      
      if (post && post.authorId !== userId) {
        await createNotification({
          userId: post.authorId,
          fromUserId: userId,
          type: 'comment',
          message: `${user?.username || 'Someone'} commented on your post`,
          postId,
          commentId: comment.id
        });
      }
    }
    
    return res.json({ success: true, comment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Like/unlike a comment
router.post('/:commentId/like', authenticateToken, async (req, res) => {
  const commentId = parseInt(req.params.commentId, 10);
  const userId = req.user.userId; // Get userId from JWT token
  try {
    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } }
    });
    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
      return res.json({ success: true, liked: false });
    } else {
      await prisma.commentLike.create({ data: { userId, commentId } });
      
      // Get comment author and send notification
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true, postId: true }
      });
      
      if (comment && comment.authorId !== userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true }
        });
        await createNotification({
          userId: comment.authorId,
          fromUserId: userId,
          type: 'comment_like',
          message: `${user?.username || 'Someone'} liked your comment`,
          postId: comment.postId,
          commentId
        });
      }
      
      return res.json({ success: true, liked: true });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Delete a comment (only by author) - also deletes all replies
router.delete('/:commentId', authenticateToken, async (req, res) => {
  const commentId = parseInt(req.params.commentId, 10);
  const userId = req.user.userId; // Get userId from JWT token
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
