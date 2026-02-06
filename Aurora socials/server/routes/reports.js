import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Create a report (bug, feature, contact, or post report)
router.post('/', async (req, res) => {
  try {
    const { 
      userId, type, category, subject, title, description, 
      message, email, steps, severity, useCase, postId 
    } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ error: 'userId and type are required' });
    }

    const report = await prisma.report.create({
      data: {
        userId,
        type,
        category,
        subject,
        title,
        description,
        message,
        email,
        steps,
        severity,
        useCase,
        postId
      }
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Get reports by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const reports = await prisma.report.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get all reports (admin)
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Update report status (admin)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const report = await prisma.report.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    res.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Delete a report
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.report.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Report deleted' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Report a post specifically
router.post('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, category, description } = req.body;

    if (!userId || !category) {
      return res.status(400).json({ error: 'userId and category are required' });
    }

    // Check if user already reported this post
    const existing = await prisma.report.findFirst({
      where: {
        userId,
        postId: parseInt(postId),
        type: 'post'
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already reported this post' });
    }

    const report = await prisma.report.create({
      data: {
        userId,
        type: 'post',
        postId: parseInt(postId),
        category,
        description,
        title: `Post Report: ${category}`
      }
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error reporting post:', error);
    res.status(500).json({ error: 'Failed to report post' });
  }
});

export default router;
