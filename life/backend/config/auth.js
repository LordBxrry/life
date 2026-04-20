const jwt = require('jwt-simple');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const SALT_ROUNDS = 10;

// Generate JWT token
const generateToken = (userId, isAdmin = false) => {
  const payload = {
    userId,
    isAdmin,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };
  return jwt.encode(payload, JWT_SECRET);
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    const payload = jwt.decode(token, JWT_SECRET);
    return payload;
  } catch (err) {
    return null;
  }
};

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Compare password
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Generate UUID
const generateId = () => {
  return uuidv4();
};

// Middleware to verify token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: true,
      message: 'No token provided'
    });
  }

  // Handle demo tokens (for development/demo purposes)
  if (token.startsWith('demo-token-')) {
    req.user = {
      userId: token.replace('demo-token-', ''),
      isAdmin: false,
      isDemo: true
    };
    return next();
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      error: true,
      message: 'Invalid or expired token'
    });
  }

  req.user = {
    userId: payload.userId,
    isAdmin: payload.isAdmin || false
  };
  next();
};

// Middleware to verify admin access
const adminMiddleware = (req, res, next) => {
  // First check authentication
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      error: true,
      message: 'Authentication required'
    });
  }

  // Then check admin status
  if (!req.user.isAdmin) {
    return res.status(403).json({
      error: true,
      message: 'Admin access required'
    });
  }

  next();
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateId,
  authMiddleware,
  adminMiddleware
};
