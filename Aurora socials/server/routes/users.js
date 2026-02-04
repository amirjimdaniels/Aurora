import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const router = express.Router();

// Get suggested users for a user (people they may know)
router.get('/suggestions/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  try {
    // Get current user's friends
    const userFriendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'accepted' },
          { receiverId: userId, status: 'accepted' }
        ]
      }
    });
    
    const friendIds = userFriendships.map(f => 
      f.senderId === userId ? f.receiverId : f.senderId
    );
    
    // Get current user's following list
    const following = await prisma.follow.findMany({
      where: { followerId: userId }
    });
    const followingIds = following.map(f => f.followingId);
    
    // Get users that current user's friends are also friends with (mutual friends)
    const friendsOfFriends = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: { in: friendIds }, status: 'accepted' },
          { receiverId: { in: friendIds }, status: 'accepted' }
        ]
      }
    });
    
    // Count mutual friends for each suggested user
    const mutualFriendsCount = {};
    friendsOfFriends.forEach(f => {
      const otherUserId = friendIds.includes(f.senderId) ? f.receiverId : f.senderId;
      if (otherUserId !== userId && !friendIds.includes(otherUserId) && !followingIds.includes(otherUserId)) {
        mutualFriendsCount[otherUserId] = (mutualFriendsCount[otherUserId] || 0) + 1;
      }
    });
    
    // Get user's hashtags from their posts
    const userPosts = await prisma.post.findMany({
      where: { authorId: userId },
      include: {
        hashtags: { include: { hashtag: true } }
      }
    });
    
    const userHashtags = new Set();
    userPosts.forEach(post => {
      post.hashtags.forEach(ph => userHashtags.add(ph.hashtag.name));
    });
    
    // Find users who use similar hashtags
    const similarHashtagUsers = await prisma.postHashtag.findMany({
      where: {
        hashtag: { name: { in: [...userHashtags] } },
        post: { authorId: { not: userId } }
      },
      include: {
        post: { select: { authorId: true } }
      }
    });
    
    // Count shared hashtags for each user
    const sharedHashtagsCount = {};
    similarHashtagUsers.forEach(ph => {
      const authorId = ph.post.authorId;
      if (authorId !== userId && !friendIds.includes(authorId) && !followingIds.includes(authorId)) {
        sharedHashtagsCount[authorId] = (sharedHashtagsCount[authorId] || 0) + 1;
      }
    });
    
    // Combine scores: prioritize mutual friends, then shared hashtags
    const suggestedUserIds = new Set([
      ...Object.keys(mutualFriendsCount).map(Number),
      ...Object.keys(sharedHashtagsCount).map(Number)
    ]);
    
    // If not enough suggestions, add random users
    if (suggestedUserIds.size < 10) {
      const randomUsers = await prisma.user.findMany({
        where: {
          id: { not: userId, notIn: [...friendIds, ...followingIds, ...suggestedUserIds] }
        },
        take: 10 - suggestedUserIds.size,
        select: { id: true }
      });
      randomUsers.forEach(u => suggestedUserIds.add(u.id));
    }
    
    // Get full user details
    const suggestedUsers = await prisma.user.findMany({
      where: { id: { in: [...suggestedUserIds] } },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        bio: true
      },
      take: 10
    });
    
    // Add mutual friends count and shared hashtags to response
    const enrichedSuggestions = suggestedUsers.map(user => ({
      ...user,
      mutualFriends: mutualFriendsCount[user.id] || 0,
      sharedHashtags: sharedHashtagsCount[user.id] || 0
    })).sort((a, b) => 
      (b.mutualFriends + b.sharedHashtags) - (a.mutualFriends + a.sharedHashtags)
    );
    
    res.json(enrichedSuggestions);
  } catch (err) {
    console.error('Error fetching suggested users:', err);
    res.status(500).json({ error: 'Failed to fetch suggested users' });
  }
});

// Get user profile by ID
router.get('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        coverPhoto: true,
        birthday: true,
        location: true,
        createdAt: true,
        posts: {
          include: {
            author: { select: { username: true } },
            likes: true,
            comments: {
              include: { author: { select: { username: true } } }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { posts: true }
        }
      }
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { bio, profilePicture, coverPhoto, birthday, location } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bio: bio !== undefined ? bio : undefined,
        profilePicture: profilePicture !== undefined ? profilePicture : undefined,
        coverPhoto: coverPhoto !== undefined ? coverPhoto : undefined,
        birthday: birthday !== undefined ? birthday : undefined,
        location: location !== undefined ? location : undefined
      },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        coverPhoto: true,
        birthday: true,
        location: true,
        createdAt: true
      }
    });
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

export default router;
