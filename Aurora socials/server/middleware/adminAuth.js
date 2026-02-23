import jwt from 'jsonwebtoken';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export async function adminAuth(req, res, next) {
  // Path 1: API key auth (for CLI, external tools, curl)
  const apiKey = req.headers['x-admin-api-key'];
  if (apiKey) {
    if (!process.env.ADMIN_API_KEY) {
      return res.status(500).json({ error: 'ADMIN_API_KEY not configured on server' });
    }
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(403).json({ error: 'Invalid admin API key' });
    }
    return next();
  }

  // Path 2: JWT auth from a developer user (for the frontend UI)
  let token = req.cookies?.authToken;
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required (API key or developer login)' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isDeveloper: true },
    });

    if (!user?.isDeveloper) {
      return res.status(403).json({ error: 'Developer access required' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
