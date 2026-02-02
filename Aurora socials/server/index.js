import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { generateToken, authenticateToken } from './middleware/auth.js';
import postsRouter from './routes/posts.js';
import savedPostsRouter from './routes/savedPosts.js';
import commentsRouter from './routes/comments.js';
import usersRouter from './routes/users.js';
import friendsRouter from './routes/friends.js';
import followRouter from './routes/follow.js';
import messagesRouter from './routes/messages.js';


const app = express();
const PORT = 5000;
const SALT_ROUNDS = 10;


// No more in-memory user store; using Prisma/SQLite

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

// Increase body size limit for base64 images
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Use posts router for all /api/posts endpoints


app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/savedPosts', savedPostsRouter);
app.use('/api/users', usersRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/follow', followRouter);
app.use('/api/messages', messagesRouter);


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
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    // Create user with hashed password
    await prisma.user.create({ data: { username, password: hashedPassword, email } });
    return res.json({ success: true, message: 'Registered successfully!' });
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
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    
    // Compare password with hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    return res.json({ 
      success: true, 
      message: 'Login successful!', 
      token,
      userId: user.id,
      username: user.username
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Verify token endpoint - for checking if user is still logged in
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ 
    success: true, 
    userId: req.user.userId, 
    username: req.user.username 
  });
});

// Verify identity for password reset
app.post('/api/auth/verify-reset', async (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) {
    return res.status(400).json({ success: false, message: 'Username and email required.' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || user.email !== email) {
      return res.status(404).json({ success: false, message: 'No account found with that username and email.' });
    }
    return res.json({ success: true, message: 'Identity verified.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  const { username, email, newPassword } = req.body;
  if (!username || !email || !newPassword) {
    return res.status(400).json({ success: false, message: 'All fields required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || user.email !== email) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    return res.json({ success: true, message: 'Password reset successful.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
