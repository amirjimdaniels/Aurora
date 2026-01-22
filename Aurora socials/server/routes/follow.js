import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Follow a user
router.post('/follow', async (req, res) => {
  const { followerId, followingId } = req.body;
  
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
    
    res.json(follow);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow a user
router.delete('/unfollow', async (req, res) => {
  const { followerId, followingId } = req.body;
  
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
