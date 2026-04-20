const express = require('express');
const router = express.Router();
const { get, all, run } = require('../config/database');
const { authMiddleware, generateId } = require('../config/auth');

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await get(
      'SELECT id, username, email, full_name, bio, avatar_url, location, social_score, upvotes_count, downvotes_count, activity_level, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Get stats
    const connectionCount = await get(
      'SELECT COUNT(*) as count FROM connections WHERE (user_id_1 = ? OR user_id_2 = ?) AND status = "accepted"',
      [req.user.userId, req.user.userId]
    );

    const messageCount = await get(
      'SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND read = 0',
      [req.user.userId]
    );

    // Get user's global rank
    const rankResult = await get(
      `SELECT COUNT(*) as rank FROM users WHERE social_score > (SELECT social_score FROM users WHERE id = ?)`,
      [req.user.userId]
    );
    const rank = (rankResult?.rank || 0) + 1;

    const upvotes = user.upvotes_count || 0;
    const downvotes = user.downvotes_count || 0;
    const likePercentage = (upvotes + downvotes) > 0 ? Math.round((upvotes / (upvotes + downvotes)) * 100) : 0;

    res.json({
      success: true,
      user: {
        ...user,
        stats: {
          connections: connectionCount?.count || 0,
          unreadMessages: messageCount?.count || 0,
          social_score: user.social_score || 0,
          upvotes: upvotes,
          downvotes: downvotes,
          like_percentage: likePercentage,
          activity_level: user.activity_level || 0,
          global_rank: rank
        }
      }
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch profile'
    });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await get(
      'SELECT id, username, full_name, bio, avatar_url, location, social_score, upvotes_count, downvotes_count, activity_level, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Get user's global rank
    const rankResult = await get(
      `SELECT COUNT(*) as rank FROM users WHERE social_score > (SELECT social_score FROM users WHERE id = ?)`,
      [req.params.id]
    );
    const rank = (rankResult?.rank || 0) + 1;

    const upvotes = user.upvotes_count || 0;
    const downvotes = user.downvotes_count || 0;
    const likePercentage = (upvotes + downvotes) > 0 ? Math.round((upvotes / (upvotes + downvotes)) * 100) : 0;

    res.json({
      success: true,
      user: {
        ...user,
        stats: {
          social_score: user.social_score || 0,
          upvotes: upvotes,
          downvotes: downvotes,
          like_percentage: likePercentage,
          activity_level: user.activity_level || 0,
          global_rank: rank
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to fetch user'
    });
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { fullName, bio, location, avatarUrl } = req.body;

    await run(
      `UPDATE users SET full_name = ?, bio = ?, location = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [fullName, bio, location, avatarUrl, req.user.userId]
    );

    const updatedUser = await get(
      'SELECT id, username, email, full_name, bio, avatar_url, location FROM users WHERE id = ?',
      [req.user.userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to update profile'
    });
  }
});

// Get all users (for connecting)
router.get('/', async (req, res) => {
  try {
    const users = await all(
      'SELECT id, username, full_name, avatar_url, bio FROM users LIMIT 50'
    );

    res.json({
      success: true,
      users
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to fetch users'
    });
  }
});

// Send connection request
router.post('/connect/:userId', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (targetUserId === req.user.userId) {
      return res.status(400).json({
        error: true,
        message: 'Cannot connect with yourself'
      });
    }

    const existingConnection = await get(
      `SELECT id FROM connections 
       WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)`,
      [req.user.userId, targetUserId, targetUserId, req.user.userId]
    );

    if (existingConnection) {
      return res.status(400).json({
        error: true,
        message: 'Connection already exists'
      });
    }

    const connectionId = generateId();
    await run(
      'INSERT INTO connections (id, user_id_1, user_id_2, status, created_at, updated_at) VALUES (?, ?, ?, "pending", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [connectionId, req.user.userId, targetUserId]
    );

    res.json({
      success: true,
      message: 'Connection request sent'
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to send connection request'
    });
  }
});

module.exports = router;
