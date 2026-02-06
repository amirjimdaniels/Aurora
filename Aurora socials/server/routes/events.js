import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const router = express.Router();

// Create an event
router.post('/', async (req, res) => {
  try {
    const { userId, title, description, location, startTime, endTime, coverImage } = req.body;
    
    if (!userId || !title || !startTime) {
      return res.status(400).json({ error: 'userId, title, and startTime are required' });
    }
    
    const event = await prisma.event.create({
      data: {
        title,
        description,
        location,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        coverImage,
        authorId: Number(userId)
      },
      include: {
        author: {
          select: { id: true, username: true, profilePicture: true }
        },
        rsvps: true
      }
    });
    
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Get all upcoming events
router.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        startTime: { gte: new Date() }
      },
      include: {
        author: {
          select: { id: true, username: true, profilePicture: true }
        },
        rsvps: true
      },
      orderBy: { startTime: 'asc' }
    });
    
    const eventsWithStats = events.map(event => ({
      ...event,
      goingCount: event.rsvps.filter(r => r.status === 'going').length,
      interestedCount: event.rsvps.filter(r => r.status === 'interested').length
    }));
    
    res.json(eventsWithStats);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// Get single event
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
      include: {
        author: {
          select: { id: true, username: true, profilePicture: true }
        },
        rsvps: true
      }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Get user details for RSVPs
    const goingUsers = await prisma.user.findMany({
      where: {
        id: { in: event.rsvps.filter(r => r.status === 'going').map(r => r.userId) }
      },
      select: { id: true, username: true, profilePicture: true }
    });
    
    const interestedUsers = await prisma.user.findMany({
      where: {
        id: { in: event.rsvps.filter(r => r.status === 'interested').map(r => r.userId) }
      },
      select: { id: true, username: true, profilePicture: true }
    });
    
    res.json({
      ...event,
      goingCount: goingUsers.length,
      interestedCount: interestedUsers.length,
      goingUsers,
      interestedUsers
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to get event' });
  }
});

// RSVP to event
router.post('/:eventId/rsvp', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, status } = req.body; // status: 'going', 'interested', 'not_going'
    
    if (!userId || !status) {
      return res.status(400).json({ error: 'userId and status are required' });
    }
    
    if (!['going', 'interested', 'not_going'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use: going, interested, or not_going' });
    }
    
    // Upsert RSVP
    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        eventId_userId: {
          eventId: Number(eventId),
          userId: Number(userId)
        }
      },
      update: { status },
      create: {
        eventId: Number(eventId),
        userId: Number(userId),
        status
      }
    });
    
    res.json(rsvp);
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ error: 'Failed to RSVP' });
  }
});

// Remove RSVP
router.delete('/:eventId/rsvp', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    await prisma.eventRSVP.deleteMany({
      where: {
        eventId: Number(eventId),
        userId: Number(userId)
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Remove RSVP error:', error);
    res.status(500).json({ error: 'Failed to remove RSVP' });
  }
});

// Delete event
router.delete('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;
    
    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.authorId !== Number(userId)) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }
    
    await prisma.event.delete({
      where: { id: Number(eventId) }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get events user is attending
router.get('/user/:userId/attending', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const rsvps = await prisma.eventRSVP.findMany({
      where: {
        userId: Number(userId),
        status: { in: ['going', 'interested'] }
      },
      include: {
        event: {
          include: {
            author: {
              select: { id: true, username: true, profilePicture: true }
            },
            rsvps: true
          }
        }
      }
    });
    
    const events = rsvps.map(r => ({
      ...r.event,
      userStatus: r.status,
      goingCount: r.event.rsvps.filter(rsvp => rsvp.status === 'going').length,
      interestedCount: r.event.rsvps.filter(rsvp => rsvp.status === 'interested').length
    }));
    
    res.json(events);
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ error: 'Failed to get user events' });
  }
});

export default router;
