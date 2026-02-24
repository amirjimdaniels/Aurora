import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { createNotification } from './notifications.js';

const router = express.Router();
const prisma = new PrismaClient();

// Bot username for auto-follow feature
const BOT_USERNAME = 'AuroraBot';

// Helper function to check if user is the bot
async function getBotUser() {
  return await prisma.user.findUnique({ where: { username: BOT_USERNAME } });
}

// Follow a user
router.post('/follow', authenticateToken, async (req, res) => {
  const followerId = req.user.userId; // Get followerId from JWT token
  const { followingId } = req.body;

  if (followerId === followingId) {
    return res.status(400).json({ error: "You can't follow yourself" });
  }
  
  try {
    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    });
    
    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }
    
    const follow = await prisma.follow.create({
      data: { followerId, followingId }
    });

    // Notify the user being followed
    const followerUser = await prisma.user.findUnique({ where: { id: followerId }, select: { username: true } });
    await createNotification({
      userId: followingId,
      fromUserId: followerId,
      type: 'follow',
      message: `${followerUser?.username || 'Someone'} started following you`
    });

    // Bot auto-follow back feature
    const botUser = await getBotUser();
    if (botUser && followingId === botUser.id) {
      // Check if bot already follows back
      const botFollowsBack = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: botUser.id, followingId: followerId } }
      });
      
      if (!botFollowsBack) {
        await prisma.follow.create({
          data: { followerId: botUser.id, followingId: followerId }
        });
        console.log(`[Bot] Auto-followed back user ${followerId}`);
      }
    }
    
    res.json(follow);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow a user
router.delete('/unfollow', authenticateToken, async (req, res) => {
  const followerId = req.user.userId; // Get followerId from JWT token
  const { followingId } = req.body;
  
  try {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } }
    });
    
    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Check if following
router.get('/status/:followerId/:followingId', async (req, res) => {
  const { followerId, followingId } = req.params;
  
  try {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: Number(followerId), followingId: Number(followingId) } }
    });
    
    res.json({ isFollowing: !!follow });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// Get followers count
router.get('/followers/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: Number(userId) },
      include: { follower: { select: { id: true, username: true, profilePicture: true } } }
    });
    
    res.json(followers.map(f => f.follower));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get followers' });
  }
});

// Get following count
router.get('/following/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const following = await prisma.follow.findMany({
      where: { followerId: Number(userId) },
      include: { following: { select: { id: true, username: true, profilePicture: true } } }
    });
    
    res.json(following.map(f => f.following));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get following' });
  }
});

// Get follow counts for a user
router.get('/counts/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: Number(userId) } }),
      prisma.follow.count({ where: { followerId: Number(userId) } })
    ]);
    
    res.json({ followers: followersCount, following: followingCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get counts' });
  }
});

export default router;
