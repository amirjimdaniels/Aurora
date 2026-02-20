import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create a poll (attached to a post)
router.post('/', async (req, res) => {
  try {
    const { postId, question, options, expiresAt } = req.body;
    
    if (!postId || !question || !options || options.length < 2) {
      return res.status(400).json({ 
        error: 'postId, question, and at least 2 options are required' 
      });
    }
    
    const poll = await prisma.poll.create({
      data: {
        postId: Number(postId),
        question,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        options: {
          create: options.map(text => ({ text }))
        }
      },
      include: {
        options: {
          include: {
            votes: true
          }
        }
      }
    });
    
    res.status(201).json(poll);
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// Get poll by post ID
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    const poll = await prisma.poll.findUnique({
      where: { postId: Number(postId) },
      include: {
        options: {
          include: {
            votes: true
          }
        }
      }
    });
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Calculate vote percentages
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
    const pollWithStats = {
      ...poll,
      totalVotes,
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: opt.votes.length,
        percentage: totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0,
        voterIds: opt.votes.map(v => v.userId)
      })),
      isExpired: poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false
    };
    
    res.json(pollWithStats);
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ error: 'Failed to get poll' });
  }
});

// Vote on a poll option
router.post('/:pollId/vote', authenticateToken, async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user.userId; // Get userId from JWT token
    const { optionId } = req.body;

    if (!optionId) {
      return res.status(400).json({ error: 'optionId is required' });
    }
    
    // Check if poll is expired
    const poll = await prisma.poll.findUnique({
      where: { id: Number(pollId) },
      include: {
        options: {
          include: { votes: true }
        }
      }
    });
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Poll has expired' });
    }
    
    // Check if user already voted on any option in this poll
    const existingVote = await prisma.pollVote.findFirst({
      where: {
        userId: Number(userId),
        option: {
          pollId: Number(pollId)
        }
      }
    });
    
    if (existingVote) {
      // Remove existing vote and add new one (change vote)
      await prisma.pollVote.delete({
        where: { id: existingVote.id }
      });
    }
    
    // Add new vote
    await prisma.pollVote.create({
      data: {
        userId: Number(userId),
        optionId: Number(optionId)
      }
    });
    
    // Return updated poll
    const updatedPoll = await prisma.poll.findUnique({
      where: { id: Number(pollId) },
      include: {
        options: {
          include: { votes: true }
        }
      }
    });
    
    const totalVotes = updatedPoll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
    const pollWithStats = {
      ...updatedPoll,
      totalVotes,
      options: updatedPoll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: opt.votes.length,
        percentage: totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0,
        voterIds: opt.votes.map(v => v.userId)
      }))
    };
    
    res.json(pollWithStats);
  } catch (error) {
    console.error('Vote on poll error:', error);
    res.status(500).json({ error: 'Failed to vote on poll' });
  }
});

// Remove vote from poll
router.delete('/:pollId/vote', authenticateToken, async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user.userId; // Get userId from JWT token
    
    const existingVote = await prisma.pollVote.findFirst({
      where: {
        userId: Number(userId),
        option: {
          pollId: Number(pollId)
        }
      }
    });
    
    if (existingVote) {
      await prisma.pollVote.delete({
        where: { id: existingVote.id }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Remove vote error:', error);
    res.status(500).json({ error: 'Failed to remove vote' });
  }
});

export default router;
