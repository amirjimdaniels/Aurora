import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get friends (mutual followers) for a user
router.get('/friends/:userId', async (req, res) => {
  const { userId } = req.params;
  const id = Number(userId);
  
  try {
    // Get users I follow
    const following = await prisma.follow.findMany({
      where: { followerId: id },
      select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);
    
    // Get users who follow me back (mutual = friends)
    const mutualFollows = await prisma.follow.findMany({
      where: {
        followerId: { in: followingIds },
        followingId: id
      },
      include: {
        follower: {
          select: { id: true, username: true, profilePicture: true }
        }
      }
    });
    
    const friends = mutualFollows.map(f => f.follower);
    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// Get followers for a user
router.get('/followers/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: Number(userId) },
      include: {
        follower: {
          select: { id: true, username: true, profilePicture: true }
        }
      }
    });
    
    res.json(followers.map(f => f.follower));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get followers' });
  }
});

// Send a message (only between friends/mutual followers)
router.post('/send', async (req, res) => {
  const { senderId, receiverId, content } = req.body;
  
  try {
    // Check if they're mutual followers (friends)
    const [iFollow, theyFollow] = await Promise.all([
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: senderId, followingId: receiverId } }
      }),
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: receiverId, followingId: senderId } }
      })
    ]);
    
    if (!iFollow || !theyFollow) {
      return res.status(403).json({ error: 'You can only message friends (mutual followers)' });
    }
    
    const message = await prisma.message.create({
      data: { senderId, receiverId, content },
      include: {
        sender: { select: { id: true, username: true, profilePicture: true } },
        receiver: { select: { id: true, username: true, profilePicture: true } }
      }
    });
    
    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversation between two users
router.get('/conversation/:userId/:otherUserId', async (req, res) => {
  const { userId, otherUserId } = req.params;
  const id1 = Number(userId);
  const id2 = Number(otherUserId);
  
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: id1, receiverId: id2 },
          { senderId: id2, receiverId: id1 }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, username: true, profilePicture: true } }
      }
    });
    
    // Mark messages as read
    await prisma.message.updateMany({
      where: { senderId: id2, receiverId: id1, read: false },
      data: { read: true }
    });
    
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// Get all conversations (list of users with last message)
router.get('/conversations/:userId', async (req, res) => {
  const { userId } = req.params;
  const id = Number(userId);
  
  try {
    // Get all messages involving this user
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: id }, { receiverId: id }]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, username: true, profilePicture: true } },
        receiver: { select: { id: true, username: true, profilePicture: true } }
      }
    });
    
    // Group by conversation partner and get latest message
    const conversationsMap = new Map();
    for (const msg of messages) {
      const partnerId = msg.senderId === id ? msg.receiverId : msg.senderId;
      if (!conversationsMap.has(partnerId)) {
        const partner = msg.senderId === id ? msg.receiver : msg.sender;
        const unreadCount = await prisma.message.count({
          where: { senderId: partnerId, receiverId: id, read: false }
        });
        conversationsMap.set(partnerId, {
          partner,
          lastMessage: msg,
          unreadCount
        });
      }
    }
    
    res.json(Array.from(conversationsMap.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get unread message count
router.get('/unread/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const count = await prisma.message.count({
      where: { receiverId: Number(userId), read: false }
    });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router;
