import jwt from 'jsonwebtoken';

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  // Check for token in cookies first (HttpOnly - more secure)
  let token = req.cookies?.authToken;

  // Fall back to Authorization header for backwards compatibility
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, username }
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Optional auth - doesn't fail if no token, but attaches user if present
export const optionalAuth = (req, res, next) => {
  // Check cookies first, then Authorization header
  let token = req.cookies?.authToken;

  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Token invalid, but we don't fail - just no user attached
    }
  }
  next();
};

// Generate access token (short-lived)
export const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, username: user.username, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // 15 minutes
  );
};

// Generate refresh token (long-lived)
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id, username: user.username, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' } // 7 days
  );
};

// Legacy function - kept for backwards compatibility
export const generateToken = (user) => {
  return generateAccessToken(user);
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (err) {
    throw new Error('Invalid refresh token');
  }
};
