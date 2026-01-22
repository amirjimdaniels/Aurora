import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import postsRouter from './routes/posts.js';
import savedPostsRouter from './routes/savedPosts.js';
import commentsRouter from './routes/comments.js';


const app = express();
const PORT = 5000;


// No more in-memory user store; using Prisma/SQLite

app.use(cors({
    origin: 'http://localhost:5173', // Change to 'http://localhost:5174' if your frontend runs on that port
  credentials: true
}));

app.use(bodyParser.json());

// Use posts router for all /api/posts endpoints


app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/savedPosts', savedPostsRouter);


// Registration endpoint using Prisma
app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required.' });
  }
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Username already exists.' });
    }
    // Create user
    await prisma.user.create({ data: { username, password, email } });
    return res.json({ success: true, message: 'Registered and auto-verified!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});


// Login endpoint using Prisma
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required.' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    return res.json({ success: true, message: 'Login successful!', userId: user.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
