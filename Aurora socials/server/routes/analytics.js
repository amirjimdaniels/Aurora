import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { getOverviewStats } from '../services/analytics/overviewStats.js';
import { getEngagementTimeSeries, getTopCreators } from '../services/analytics/engagementMetrics.js';
import { getUserGrowth, getRetentionCohorts } from '../services/analytics/userGrowth.js';
import { getTrendingHashtags, getContentDistribution, getPostingPatterns } from '../services/analytics/contentTrends.js';
import { getSentimentOverview, analyzeSentimentBatch } from '../services/analytics/sentimentAnalysis.js';

const router = Router();

router.use(adminAuth);

// GET /api/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const stats = await getOverviewStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/engagement?days=30
router.get('/engagement', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
    const data = await getEngagementTimeSeries(days);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/engagement/top-creators?limit=10
router.get('/engagement/top-creators', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const data = await getTopCreators(limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/users/growth?days=90
router.get('/users/growth', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 90, 365);
    const data = await getUserGrowth(days);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/users/retention?weeks=8
router.get('/users/retention', async (req, res) => {
  try {
    const weeks = Math.min(parseInt(req.query.weeks, 10) || 8, 52);
    const data = await getRetentionCohorts(weeks);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/content/trending?days=7&limit=20
router.get('/content/trending', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 7, 90);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const data = await getTrendingHashtags(days, limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/content/distribution
router.get('/content/distribution', async (req, res) => {
  try {
    const data = await getContentDistribution();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/content/patterns
router.get('/content/patterns', async (req, res) => {
  try {
    const data = await getPostingPatterns();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/sentiment/overview
router.get('/sentiment/overview', async (req, res) => {
  try {
    const data = await getSentimentOverview();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analytics/sentiment/analyze
router.post('/sentiment/analyze', async (req, res) => {
  try {
    const batchSize = Math.min(parseInt(req.body.batchSize, 10) || 50, 200);
    const data = await analyzeSentimentBatch(batchSize);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
