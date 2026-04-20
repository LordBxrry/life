const express = require('express');
const router = express.Router();
const { get, all, run } = require('../config/database');
const { authMiddleware, generateId } = require('../config/auth');

// Get all notifications for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await all(
      `SELECT id, type, title, message, read, link_to, created_at 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [req.user.userId]
    );

    res.json({
      success: true,
      notifications
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch notifications'
    });
  }
});

// Get unread notification count
router.get('/count/unread', authMiddleware, async (req, res) => {
  try {
    const result = await get(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0',
      [req.user.userId]
    );

    res.json({
      success: true,
      unreadCount: result?.count || 0
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to fetch unread count'
    });
  }
});

// Create notification
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { userId, type, title, message, linkTo } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        error: true,
        message: 'Missing required fields'
      });
    }

    const notificationId = generateId();
    await run(
      `INSERT INTO notifications (id, user_id, type, title, message, link_to, read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [notificationId, userId, type, title, message, linkTo || null]
    );

    res.status(201).json({
      success: true,
      message: 'Notification created',
      notificationId
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to create notification'
    });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await run(
      'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to update notification'
    });
  }
});

// Mark all as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await run(
      'UPDATE notifications SET read = 1 WHERE user_id = ?',
      [req.user.userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to update notifications'
    });
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await run(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to delete notification'
    });
  }
});

// Clear all notifications
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await run(
      'DELETE FROM notifications WHERE user_id = ?',
      [req.user.userId]
    );

    res.json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to clear notifications'
    });
  }
});

module.exports = router;
