import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { createSyntheticUsers } from '../services/syntheticUsers/userCreator.js';

const router = Router();

router.use(adminAuth);

// POST /api/admin/generate-users
router.post('/generate-users', async (req, res) => {
  const { count = 5, generateImages = true } = req.body;

  const userCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 50);

  const logs = [];
  try {
    const results = await createSyntheticUsers(userCount, {
      generateImages,
      progressCallback: (msg) => logs.push(msg),
    });

    res.json({
      success: true,
      created: results.created.length,
      errors: results.errors.length,
      users: results.created,
      errorDetails: results.errors,
      logs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      logs,
    });
  }
});

export default router;
