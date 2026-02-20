import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create a group
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Get userId from JWT token
    const {name, description, coverImage, isPrivate } = req.body;
    
    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }
    
    const group = await prisma.group.create({
      data: {
        name,
        description,
        coverImage,
        isPrivate: isPrivate || false,
        creatorId: Number(userId),
        // Creator automatically becomes admin member
        members: {
          create: {
            userId: Number(userId),
            role: 'admin'
          }
        }
      },
      include: {
        creator: {
          select: { id: true, username: true, profilePicture: true }
        },
        members: true
      }
    });
    
    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get all groups
router.get('/', async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      where: { isPrivate: false },
      include: {
        creator: {
          select: { id: true, username: true, profilePicture: true }
        },
        members: true,
        posts: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const groupsWithStats = groups.map(group => ({
      ...group,
      memberCount: group.members.length,
      postCount: group.posts.length
    }));
    
    res.json(groupsWithStats);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to get groups' });
  }
});

// Get single group
router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const group = await prisma.group.findUnique({
      where: { id: Number(groupId) },
      include: {
        creator: {
          select: { id: true, username: true, profilePicture: true }
        },
        members: true,
        posts: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Get member details
    const memberIds = group.members.map(m => m.userId);
    const memberDetails = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, username: true, profilePicture: true }
    });
    
    const membersWithDetails = group.members.map(m => ({
      ...m,
      user: memberDetails.find(u => u.id === m.userId)
    }));
    
    res.json({
      ...group,
      members: membersWithDetails,
      memberCount: group.members.length
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Failed to get group' });
  }
});

// Join group
router.post('/:groupId/join', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    // Check if already a member
    const existing = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: Number(groupId),
          userId: Number(userId)
        }
      }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }
    
    const member = await prisma.groupMember.create({
      data: {
        groupId: Number(groupId),
        userId: Number(userId),
        role: 'member'
      }
    });
    
    res.status(201).json(member);
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// Leave group
router.post('/:groupId/leave', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    // Check if user is creator (creators can't leave)
    const group = await prisma.group.findUnique({
      where: { id: Number(groupId) }
    });
    
    if (group && group.creatorId === Number(userId)) {
      return res.status(400).json({ error: 'Creator cannot leave the group. Delete the group instead.' });
    }
    
    await prisma.groupMember.deleteMany({
      where: {
        groupId: Number(groupId),
        userId: Number(userId)
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

// Post to group
router.post('/:groupId/posts', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId; // Get userId from JWT token
    const {content, mediaUrl } = req.body;
    
    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }
    
    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: Number(groupId),
          userId: Number(userId)
        }
      }
    });
    
    if (!membership) {
      return res.status(403).json({ error: 'Must be a member to post in this group' });
    }
    
    const post = await prisma.groupPost.create({
      data: {
        groupId: Number(groupId),
        authorId: Number(userId),
        content,
        mediaUrl
      }
    });
    
    res.status(201).json(post);
  } catch (error) {
    console.error('Create group post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get group posts
router.get('/:groupId/posts', async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const posts = await prisma.groupPost.findMany({
      where: { groupId: Number(groupId) },
      orderBy: { createdAt: 'desc' }
    });
    
    // Get author details
    const authorIds = [...new Set(posts.map(p => p.authorId))];
    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, username: true, profilePicture: true }
    });
    
    const postsWithAuthors = posts.map(post => ({
      ...post,
      author: authors.find(a => a.id === post.authorId)
    }));
    
    res.json(postsWithAuthors);
  } catch (error) {
    console.error('Get group posts error:', error);
    res.status(500).json({ error: 'Failed to get group posts' });
  }
});

// Get user's groups
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const memberships = await prisma.groupMember.findMany({
      where: { userId: Number(userId) },
      include: {
        group: {
          include: {
            creator: {
              select: { id: true, username: true, profilePicture: true }
            },
            members: true
          }
        }
      }
    });
    
    const groups = memberships.map(m => ({
      ...m.group,
      userRole: m.role,
      memberCount: m.group.members.length
    }));
    
    res.json(groups);
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({ error: 'Failed to get user groups' });
  }
});

// Delete group
router.delete('/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    
    const group = await prisma.group.findUnique({
      where: { id: Number(groupId) }
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (group.creatorId !== Number(userId)) {
      return res.status(403).json({ error: 'Only the creator can delete this group' });
    }
    
    await prisma.group.delete({
      where: { id: Number(groupId) }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

export default router;
