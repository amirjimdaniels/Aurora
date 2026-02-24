import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { createNotification } from './notifications.js';

const router = express.Router();
const prisma = new PrismaClient();

// Bot configuration
const BOT_USERNAME = 'AuroraBot';
const BOT_RESPONSES = [
  "Hey there! 👋 I'm AuroraBot, your friendly testing companion!",
  "Thanks for messaging me! I'm here to help test the chat feature. 🤖",
  "Beep boop! 🤖 Message received loud and clear!",
  "Hello! I auto-reply to all messages. Pretty cool, right? ✨",
  "Hi! I'm just a bot, but I appreciate the conversation! 💬",
  "Aurora Socials is awesome! Thanks for testing with me! 🚀",
  "I got your message! Everything seems to be working great! ✅",
  "Greetings, human! 🤖 Your message has been processed successfully.",
];

// Helper function to get bot user
async function getBotUser() {
  return await prisma.user.findUnique({ where: { username: BOT_USERNAME } });
}

// Get a random bot response
function getRandomBotResponse() {
  return BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)];
}

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
router.post('/send', authenticateToken, async (req, res) => {
  const senderId = req.user.userId; // Get senderId from JWT token
  const { receiverId, content } = req.body;
  
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
    
    // Create a notification for the receiver (throttled: only if no unread message notif from same sender)
    const existingNotif = await prisma.notification.findFirst({
      where: {
        userId: receiverId,
        fromUserId: senderId,
        type: 'message',
        read: false
      }
    });
    if (!existingNotif) {
      const senderUser = await prisma.user.findUnique({ where: { id: senderId }, select: { username: true } });
      await createNotification({
        userId: receiverId,
        fromUserId: senderId,
        type: 'message',
        message: `${senderUser?.username || 'Someone'} sent you a message`
      });
    }

    // Bot auto-reply feature
    const botUser = await getBotUser();
    if (botUser && receiverId === botUser.id) {
      // Delay the reply slightly to make it feel more natural
      setTimeout(async () => {
        try {
          await prisma.message.create({
            data: {
              senderId: botUser.id,
              receiverId: senderId,
              content: getRandomBotResponse()
            }
          });
          console.log(`[Bot] Auto-replied to user ${senderId}`);
        } catch (err) {
          console.error('[Bot] Failed to auto-reply:', err);
        }
      }, 500);
    }
    
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

// In-memory store for typing indicators (clears automatically after timeout)
const typingUsers = new Map();
const TYPING_TIMEOUT = 3000; // 3 seconds

// Set typing status
router.post('/typing', authenticateToken, (req, res) => {
  const senderId = req.user.userId; // Get senderId from JWT token
  const { receiverId } = req.body;
  const key = `${senderId}-${receiverId}`;
  
  // Clear existing timeout for this typing session
  if (typingUsers.has(key)) {
    clearTimeout(typingUsers.get(key).timeout);
  }
  
  // Set new typing status with auto-clear timeout
  typingUsers.set(key, {
    senderId: Number(senderId),
    receiverId: Number(receiverId),
    timestamp: Date.now(),
    timeout: setTimeout(() => {
      typingUsers.delete(key);
    }, TYPING_TIMEOUT)
  });
  
  res.json({ success: true });
});

// Stop typing (explicit clear)
router.post('/stop-typing', authenticateToken, (req, res) => {
  const senderId = req.user.userId; // Get senderId from JWT token
  const { receiverId } = req.body;
  const key = `${senderId}-${receiverId}`;
  
  if (typingUsers.has(key)) {
    clearTimeout(typingUsers.get(key).timeout);
    typingUsers.delete(key);
  }
  
  res.json({ success: true });
});

// Check if someone is typing to me
router.get('/typing/:userId', (req, res) => {
  const { userId } = req.params;
  const myId = Number(userId);
  
  const typingToMe = [];
  
  for (const [key, value] of typingUsers.entries()) {
    if (value.receiverId === myId) {
      typingToMe.push({
        userId: value.senderId,
        timestamp: value.timestamp
      });
    }
  }
  
  res.json(typingToMe);
});

// Check if specific user is typing to me
router.get('/typing/:userId/:otherUserId', (req, res) => {
  const { userId, otherUserId } = req.params;
  const key = `${otherUserId}-${userId}`;
  
  const isTyping = typingUsers.has(key);
  res.json({ isTyping });
});

export default router;
