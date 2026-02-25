import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { generateToken, generateAccessToken, generateRefreshToken, verifyRefreshToken, authenticateToken } from './middleware/auth.js';
import { validate } from './middleware/validate.js';
import { registerSchema, loginSchema, requestResetSchema, verifyResetTokenSchema, passwordResetSchema } from './validation/schemas.js';
import postsRouter from './routes/posts.js';
import savedPostsRouter from './routes/savedPosts.js';
import commentsRouter from './routes/comments.js';
import usersRouter from './routes/users.js';
import friendsRouter from './routes/friends.js';
import followRouter from './routes/follow.js';
import messagesRouter from './routes/messages.js';
import notificationsRouter from './routes/notifications.js';
import newsRouter from './routes/news.js';
import storiesRouter from './routes/stories.js';
import pollsRouter from './routes/polls.js';
import eventsRouter from './routes/events.js';
import groupsRouter from './routes/groups.js';
import scheduledPostsRouter from './routes/scheduledPosts.js';
import reportsRouter from './routes/reports.js';
import { sendEmail } from './services/email.js';
import uploadRouter from './routes/upload.js';
import adminRouter from './routes/admin.js';
import analyticsRouter from './routes/analytics.js';


const app = express();
const PORT = process.env.PORT || 5000;
const SALT_ROUNDS = 10;

// Rate limiting configuration
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration requests per hour
  message: { success: false, message: 'Too many accounts created. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 password reset requests per windowMs
  message: { success: false, message: 'Too many password reset attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});


// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Increase body size limit for base64 images
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Cookie parser for HttpOnly cookies
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Use routers for all API endpoints
app.use('/api/upload', uploadRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/savedPosts', savedPostsRouter);
app.use('/api/users', usersRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/follow', followRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/news', newsRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/polls', pollsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/scheduled-posts', scheduledPostsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);


// Registration endpoint using Prisma
app.post('/api/register', registerLimiter, validate(registerSchema), async (req, res) => {
  const { username, password, email } = req.body;
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
app.post('/api/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { username, password } = req.body;
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
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set HttpOnly cookies (secure against XSS)
    res.cookie('authToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes (matches access token expiry)
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({
      success: true,
      message: 'Login successful!',
      token: accessToken, // Still return token for backwards compatibility
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

// Logout endpoint - clears the HttpOnly cookies
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Refresh access token using refresh token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    // Set new access token cookie
    res.cookie('authToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    return res.json({
      success: true,
      message: 'Access token refreshed',
      token: newAccessToken, // For backwards compatibility
      userId: user.id,
      username: user.username
    });
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

// Step 1: Request password reset — sends 6-digit code to email
app.post('/api/auth/verify-reset', passwordResetLimiter, validate(requestResetSchema), async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findFirst({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account with that email exists, a reset code has been sent.' });
    }

    // Generate 6-digit code with crypto CSPRNG
    const codeNum = crypto.randomBytes(4).readUInt32BE(0) % 1000000;
    const code = codeNum.toString().padStart(6, '0');

    // Store SHA-256 hash + 15-min expiry
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedCode,
        resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // Send code via email (falls back to console.log if no SMTP)
    await sendEmail({
      to: email,
      subject: 'Aurora Social - Password Reset Code',
      text: `Your password reset code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.`,
    });

    return res.json({ success: true, message: 'If an account with that email exists, a reset code has been sent.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Step 2: Verify the 6-digit reset code
app.post('/api/auth/verify-token', passwordResetLimiter, validate(verifyResetTokenSchema), async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }

    if (new Date() > new Date(user.resetTokenExpiry)) {
      await prisma.user.update({ where: { id: user.id }, data: { resetToken: null, resetTokenExpiry: null } });
      return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new one.' });
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    if (hashedCode !== user.resetToken) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }

    return res.json({ success: true, message: 'Code verified.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Step 3: Reset password with valid code
app.post('/api/auth/reset-password', passwordResetLimiter, validate(passwordResetSchema), async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }

    if (new Date() > new Date(user.resetTokenExpiry)) {
      await prisma.user.update({ where: { id: user.id }, data: { resetToken: null, resetTokenExpiry: null } });
      return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new one.' });
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    if (hashedCode !== user.resetToken) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
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
