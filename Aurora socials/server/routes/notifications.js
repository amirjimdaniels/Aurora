import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const router = express.Router();

// Get notifications for a user
router.get('/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    // Enrich notifications with user data
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notif) => {
        let fromUser = null;
        if (notif.fromUserId) {
          fromUser = await prisma.user.findUnique({
            where: { id: notif.fromUserId },
            select: { id: true, username: true, profilePicture: true }
          });
        }
        return { ...notif, fromUser };
      })
    );
    
    res.json(enrichedNotifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/:userId/unread-count', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  try {
    const count = await prisma.notification.count({
      where: { userId, read: false }
    });
    res.json({ count });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  const notificationId = parseInt(req.params.notificationId, 10);
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read for a user
router.put('/:userId/read-all', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  try {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Create a notification (internal use, called from other routes)
export async function createNotification({ userId, fromUserId, type, message, postId = null, commentId = null }) {
  try {
    // Don't notify yourself
    if (userId === fromUserId) return null;
    
    const notification = await prisma.notification.create({
      data: {
        userId,
        fromUserId,
        type,
        message,
        postId,
        commentId
      }
    });
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
}

// Delete old notifications (cleanup)
router.delete('/:userId/cleanup', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  try {
    await prisma.notification.deleteMany({
      where: {
        userId,
        createdAt: { lt: thirtyDaysAgo },
        read: true
      }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error cleaning up notifications:', err);
    res.status(500).json({ error: 'Failed to cleanup notifications' });
  }
});

export default router;
