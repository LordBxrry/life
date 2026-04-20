const express = require('express');
const router = express.Router();
const { db, run, get } = require('../config/database');
const { generateToken, hashPassword, comparePassword, generateId, authMiddleware } = require('../config/auth');

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Username, email, and password are required'
      });
    }

    // Check if user exists
    const existingUser = await get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existingUser) {
      return res.status(409).json({
        error: true,
        message: 'Email or username already exists'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = generateId();

    // Create user
    await run(
      `INSERT INTO users (id, username, email, password_hash, full_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, username, email, passwordHash, fullName || username]
    );

    // Generate token
    const token = generateToken(userId);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        username,
        email,
        fullName: fullName || username
      },
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      error: true,
      message: 'Registration failed'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.account_active) {
      return res.status(403).json({
        error: true,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: true,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Track login activity for social score
    const activityId = generateId();
    const points = 1; // login point
    await run(
      `INSERT INTO user_activities (id, user_id, activity_type, points_earned, description, created_at)
       VALUES (?, ?, 'login', ?, 'User logged in', CURRENT_TIMESTAMP)`,
      [activityId, user.id, points]
    );

    // Increment social score for login
    await run(
      `UPDATE users 
       SET social_score = social_score + ?,
           activity_level = activity_level + 1
       WHERE id = ?`,
      [points, user.id]
    );

    // Generate token with admin status
    const isAdmin = user.is_admin ? true : false;
    const token = generateToken(user.id, isAdmin);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        avatar: user.avatar_url,
        isAdmin: isAdmin,
        role: user.role,
        social_score: (user.social_score || 0) + 1
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: true,
      message: 'Login failed'
    });
  }
});

// Logout endpoint
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Logout failed'
    });
  }
});

// Verify token endpoint
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const user = await get('SELECT id, username, email, full_name, avatar_url FROM users WHERE id = ?', [req.user.userId]);
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        avatar: user.avatar_url
      }
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Token verification failed'
    });
  }
});

module.exports = router;
