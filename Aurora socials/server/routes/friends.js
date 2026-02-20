import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Send friend request
router.post('/request', authenticateToken, async (req, res) => {
  const senderId = req.user.userId; // Get senderId from JWT token
  const { receiverId } = req.body;
  if (!receiverId) {
    return res.status(400).json({ success: false, message: 'Receiver ID required.' });
  }
  if (senderId === receiverId) {
    return res.status(400).json({ success: false, message: 'Cannot send friend request to yourself.' });
  }
  try {
    // Check if friendship already exists in either direction
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    });
    if (existing) {
      if (existing.status === 'accepted') {
        return res.json({ success: false, message: 'Already friends.' });
      }
      if (existing.status === 'pending') {
        return res.json({ success: false, message: 'Friend request already pending.' });
      }
    }
    const friendship = await prisma.friendship.create({
      data: { senderId, receiverId, status: 'pending' }
    });
    return res.json({ success: true, friendship });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Accept friend request
router.post('/accept', authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Get userId from JWT token
  const { friendshipId } = req.body;
  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship) {
      return res.status(404).json({ success: false, message: 'Friend request not found.' });
    }
    if (friendship.receiverId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' }
    });
    
    // Create mutual follows so they appear as friends
    const senderId = friendship.senderId;
    const receiverId = friendship.receiverId;
    
    // Create follow: sender -> receiver (if doesn't exist)
    const senderFollowsReceiver = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: senderId, followingId: receiverId } }
    });
    if (!senderFollowsReceiver) {
      await prisma.follow.create({
        data: { followerId: senderId, followingId: receiverId }
      });
    }
    
    // Create follow: receiver -> sender (if doesn't exist)
    const receiverFollowsSender = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: receiverId, followingId: senderId } }
    });
    if (!receiverFollowsSender) {
      await prisma.follow.create({
        data: { followerId: receiverId, followingId: senderId }
      });
    }
    
    return res.json({ success: true, friendship: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Reject/cancel friend request or unfriend
router.delete('/:friendshipId', authenticateToken, async (req, res) => {
  const friendshipId = parseInt(req.params.friendshipId, 10);
  const userId = req.user.userId; // Get userId from JWT token
  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship) {
      return res.status(404).json({ success: false, message: 'Friendship not found.' });
    }
    if (friendship.senderId !== userId && friendship.receiverId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    await prisma.friendship.delete({ where: { id: friendshipId } });
    return res.json({ success: true, message: 'Friendship removed.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Get pending friend requests for a user
router.get('/requests/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  try {
    const requests = await prisma.friendship.findMany({
      where: { receiverId: userId, status: 'pending' },
      include: {
        sender: { select: { id: true, username: true, profilePicture: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Get friends list for a user
router.get('/list/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: { select: { id: true, username: true, profilePicture: true } },
        receiver: { select: { id: true, username: true, profilePicture: true } }
      }
    });
    // Map to get the friend (the other person)
    const friends = friendships.map(f => {
      const friend = f.senderId === userId ? f.receiver : f.sender;
      return { ...friend, friendshipId: f.id };
    });
    return res.json(friends);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Get friendship status between two users
router.get('/status/:userId/:otherUserId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const otherUserId = parseInt(req.params.otherUserId, 10);
  try {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      }
    });
    if (!friendship) {
      return res.json({ status: 'none', friendship: null });
    }
    return res.json({ 
      status: friendship.status, 
      friendship,
      isSender: friendship.senderId === userId
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
