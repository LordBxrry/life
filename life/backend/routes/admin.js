const express = require('express');
const router = express.Router();
const { db, run, get, all } = require('../config/database');
const { hashPassword, authMiddleware, adminMiddleware, generateId } = require('../config/auth');

// Protect all admin routes with auth and admin middleware
router.use(authMiddleware);
router.use(adminMiddleware);

// GET: List all users with full details
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const users = await all(
      `SELECT id, username, email, full_name, bio, avatar_url, location, role, is_admin, account_active,
              created_at, updated_at, last_login FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const countResult = await get('SELECT COUNT(*) as total FROM users');
    
    res.json({
      success: true,
      users,
      pagination: {
        total: countResult.total,
        page,
        limit,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch users' });
  }
});

// GET: Get specific user with all details
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await get(
      `SELECT id, username, email, full_name, bio, avatar_url, location, role, is_admin, account_active,
              created_at, updated_at, last_login FROM users WHERE id = ?`,
      [req.params.userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    // Get user statistics
    const stats = {
      posts: (await get('SELECT COUNT(*) as count FROM products WHERE provider_id = ?', [user.id]))?.count || 0,
      connections: (await get('SELECT COUNT(*) as count FROM connections WHERE (user_id_1 = ? OR user_id_2 = ?) AND status = "accepted"', [user.id, user.id]))?.count || 0,
      notifications: (await get('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?', [user.id]))?.count || 0,
      messages: (await get('SELECT COUNT(*) as count FROM messages WHERE sender_id = ? OR recipient_id = ?', [user.id, user.id]))?.count || 0,
      conversations: (await get('SELECT COUNT(*) as count FROM conversations WHERE user_id_1 = ? OR user_id_2 = ?', [user.id, user.id]))?.count || 0
    };

    // Get recent activity
    const recentActivity = await all(
      'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [user.id]
    );

    res.json({
      success: true,
      user: { ...user, stats },
      recentActivity
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch user details' });
  }
});

// PUT: Update user (admin can edit any user)
router.put('/users/:userId', async (req, res) => {
  try {
    const { username, email, full_name, bio, location, role, is_admin, account_active } = req.body;
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (username !== undefined) { updates.push('username = ?'); values.push(username); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (full_name !== undefined) { updates.push('full_name = ?'); values.push(full_name); }
    if (bio !== undefined) { updates.push('bio = ?'); values.push(bio); }
    if (location !== undefined) { updates.push('location = ?'); values.push(location); }
    if (role !== undefined) { updates.push('role = ?'); values.push(role); }
    if (is_admin !== undefined) { updates.push('is_admin = ?'); values.push(is_admin ? 1 : 0); }
    if (account_active !== undefined) { updates.push('account_active = ?'); values.push(account_active ? 1 : 0); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: true, message: 'No updates provided' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.userId);
    
    await run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const updatedUser = await get(
      'SELECT id, username, email, full_name, bio, avatar_url, location, role, is_admin, account_active, created_at, updated_at FROM users WHERE id = ?',
      [req.params.userId]
    );
    
    res.json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: true, message: 'Failed to update user' });
  }
});

// POST: Reset user password
router.post('/users/:userId/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ error: true, message: 'New password required' });
    }
    
    const passwordHash = await hashPassword(newPassword);
    
    await run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, req.params.userId]
    );
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: true, message: 'Failed to reset password' });
  }
});

// DELETE: Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    // Prevent deleting the admin
    const user = await get('SELECT is_admin FROM users WHERE id = ?', [req.params.userId]);
    if (user?.is_admin) {
      return res.status(400).json({ error: true, message: 'Cannot delete admin user' });
    }
    
    await run('DELETE FROM users WHERE id = ?', [req.params.userId]);
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: true, message: 'Failed to delete user' });
  }
});

// POST: Make user admin
router.post('/users/:userId/make-admin', async (req, res) => {
  try {
    await run(
      'UPDATE users SET is_admin = 1, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['admin', req.params.userId]
    );
    
    res.json({ success: true, message: 'User promoted to admin' });
  } catch (err) {
    console.error('Error promoting user:', err);
    res.status(500).json({ error: true, message: 'Failed to promote user' });
  }
});

// POST: Remove admin
router.post('/users/:userId/remove-admin', async (req, res) => {
  try {
    const currentAdmin = await get('SELECT is_admin FROM users WHERE id = ?', [req.user.userId]);
    if (!currentAdmin?.is_admin) {
      return res.status(403).json({ error: true, message: 'Only admins can remove admin status' });
    }
    
    await run(
      'UPDATE users SET is_admin = 0, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['user', req.params.userId]
    );
    
    res.json({ success: true, message: 'Admin status removed' });
  } catch (err) {
    console.error('Error removing admin:', err);
    res.status(500).json({ error: true, message: 'Failed to remove admin status' });
  }
});

// GET: All products (view all)
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const products = await all(
      `SELECT p.*, u.username FROM products p 
       LEFT JOIN users u ON p.provider_id = u.id 
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const countResult = await get('SELECT COUNT(*) as total FROM products');
    
    res.json({
      success: true,
      products,
      pagination: {
        total: countResult.total,
        page,
        limit,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch products' });
  }
});

// DELETE: Delete any product
router.delete('/products/:productId', async (req, res) => {
  try {
    await run('DELETE FROM products WHERE id = ?', [req.params.productId]);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: true, message: 'Failed to delete product' });
  }
});

// GET: All notifications
router.get('/notifications', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const notifications = await all(
      `SELECT n.*, u.username, u.email FROM notifications n 
       LEFT JOIN users u ON n.user_id = u.id 
       ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const countResult = await get('SELECT COUNT(*) as total FROM notifications');
    
    res.json({
      success: true,
      notifications,
      pagination: {
        total: countResult.total,
        page,
        limit,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch notifications' });
  }
});

// GET: Get specific user's messages
router.get('/users/:userId/messages', async (req, res) => {
  try {
    const messages = await all(
      `SELECT m.*, u_sender.username as sender_name, u_recipient.username as recipient_name 
       FROM messages m
       LEFT JOIN users u_sender ON m.sender_id = u_sender.id
       LEFT JOIN users u_recipient ON m.recipient_id = u_recipient.id
       WHERE m.sender_id = ? OR m.recipient_id = ?
       ORDER BY m.created_at DESC LIMIT 100`,
      [req.params.userId, req.params.userId]
    );
    
    res.json({ success: true, messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch messages' });
  }
});

// GET: Get specific user's profile
router.get('/users/:userId/profile', async (req, res) => {
  try {
    const user = await get(
      'SELECT * FROM users WHERE id = ?',
      [req.params.userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch profile' });
  }
});

// GET: System statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = {
      totalUsers: (await get('SELECT COUNT(*) as count FROM users'))?.count || 0,
      activeUsers: (await get('SELECT COUNT(*) as count FROM users WHERE account_active = 1'))?.count || 0,
      adminUsers: (await get('SELECT COUNT(*) as count FROM users WHERE is_admin = 1'))?.count || 0,
      totalProducts: (await get('SELECT COUNT(*) as count FROM products'))?.count || 0,
      totalMessages: (await get('SELECT COUNT(*) as count FROM messages'))?.count || 0,
      totalNotifications: (await get('SELECT COUNT(*) as count FROM notifications'))?.count || 0,
      totalConnections: (await get('SELECT COUNT(*) as count FROM connections WHERE status = "accepted"'))?.count || 0
    };
    
    res.json({ success: true, statistics: stats });
  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch statistics' });
  }
});

// POST: Create user as admin
router.post('/create-user', async (req, res) => {
  try {
    const { username, email, password, full_name, role = 'user', is_admin = false } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: true, message: 'Username, email, and password required' });
    }
    
    const existingUser = await get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existingUser) {
      return res.status(409).json({ error: true, message: 'User already exists' });
    }
    
    const passwordHash = await hashPassword(password);
    const userId = generateId();
    
    await run(
      `INSERT INTO users (id, username, email, password_hash, full_name, role, is_admin, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, username, email, passwordHash, full_name || username, role, is_admin ? 1 : 0]
    );
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { id: userId, username, email, full_name: full_name || username, role, is_admin }
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: true, message: 'Failed to create user' });
  }
});

module.exports = router;
