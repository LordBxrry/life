const express = require('express');
const router = express.Router();
const { get, all, run } = require('../config/database');
const { authMiddleware, generateId } = require('../config/auth');
const socketHelper = require('../socket');

// Get all conversations for user
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await all(
      `SELECT 
        c.id,
        CASE 
          WHEN c.user_id_1 = ? THEN u.id
          ELSE u.id
        END as other_user_id,
        CASE 
          WHEN c.user_id_1 = ? THEN u.username
          ELSE u.username
        END as other_user_name,
        CASE 
          WHEN c.user_id_1 = ? THEN u.avatar_url
          ELSE u.avatar_url
        END as other_user_avatar,
        (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND recipient_id = ? AND read = 0) as unread_count,
        c.updated_at
       FROM conversations c
       JOIN users u ON (c.user_id_1 = u.id AND c.user_id_2 = ?) OR (c.user_id_2 = u.id AND c.user_id_1 = ?)
       WHERE c.user_id_1 = ? OR c.user_id_2 = ?
       ORDER BY c.updated_at DESC`,
      [req.user.userId, req.user.userId, req.user.userId, req.user.userId, 
       req.user.userId, req.user.userId, req.user.userId, req.user.userId]
    );

    res.json({
      success: true,
      conversations
    });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch conversations'
    });
  }
});

// Get messages for a conversation
router.get('/conversation/:conversationId', authMiddleware, async (req, res) => {
  try {
    const messages = await all(
      `SELECT m.*, u.username as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [req.params.conversationId]
    );

    // Mark messages as read
    await run(
      'UPDATE messages SET read = 1 WHERE conversation_id = ? AND recipient_id = ?',
      [req.params.conversationId, req.user.userId]
    );

    res.json({
      success: true,
      messages
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to fetch messages'
    });
  }
});

// Get or create conversation with a user
router.post('/conversation/:userId', authMiddleware, async (req, res) => {
  try {
    const recipientUserId = req.params.userId;

    if (recipientUserId === req.user.userId) {
      return res.status(400).json({
        error: true,
        message: 'Cannot message yourself'
      });
    }

    // Check if conversation exists
    let conversation = await get(
      `SELECT id FROM conversations 
       WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)`,
      [req.user.userId, recipientUserId, recipientUserId, req.user.userId]
    );

    if (!conversation) {
      // Create new conversation
      const conversationId = generateId();
      await run(
        `INSERT INTO conversations (id, user_id_1, user_id_2, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [conversationId, req.user.userId, recipientUserId]
      );
      conversation = { id: conversationId };
    }

    res.json({
      success: true,
      conversationId: conversation.id
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to create/get conversation'
    });
  }
});

// Send message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { conversationId, recipientId, message } = req.body;

    if (!conversationId || !recipientId || !message) {
      return res.status(400).json({
        error: true,
        message: 'Missing required fields'
      });
    }

    const messageId = generateId();
    await run(
      `INSERT INTO messages (id, conversation_id, sender_id, recipient_id, message, read, created_at)
       VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [messageId, conversationId, req.user.userId, recipientId, message]
    );

    // Update conversation timestamp
    await run(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [conversationId]
    );

    // Emit real-time message if socket is available
    try {
      const io = socketHelper.getIo();
      if (io) {
        io.to(`conv_${conversationId}`).emit('message', {
          conversationId,
          messageId,
          senderId: req.user.userId,
          message
        });
      }
    } catch (e) {
      console.error('Error emitting socket message:', e);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent',
      messageId
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to send message'
    });
  }
});

// Create group
router.post('/groups', authMiddleware, async (req, res) => {
  try {
    const { name, memberIds = [] } = req.body;
    if (!name) return res.status(400).json({ error: true, message: 'Group name required' });

    const groupId = generateId();
    await run(
      `INSERT INTO groups (id, name, owner_id, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [groupId, name, req.user.userId]
    );

    // Add owner as member and any provided members
    await run(`INSERT INTO group_members (id, group_id, user_id, joined_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`, [generateId(), groupId, req.user.userId]);
    for (const m of memberIds) {
      await run(`INSERT INTO group_members (id, group_id, user_id, joined_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`, [generateId(), groupId, m]);
    }

    res.status(201).json({ success: true, groupId });
  } catch (err) {
    console.error('Error creating group:', err);
    res.status(500).json({ error: true, message: 'Failed to create group' });
  }
});

// Add member to group
router.post('/groups/:groupId/add', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: true, message: 'userId required' });

    await run(`INSERT INTO group_members (id, group_id, user_id, joined_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`, [generateId(), groupId, userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error adding group member:', err);
    res.status(500).json({ error: true, message: 'Failed to add member' });
  }
});

// Get group messages
router.get('/groups/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await all(
      `SELECT gm.*, u.username as sender_name FROM group_messages gm JOIN users u ON gm.sender_id = u.id WHERE gm.group_id = ? ORDER BY gm.created_at ASC LIMIT 200`,
      [groupId]
    );
    res.json({ success: true, messages });
  } catch (err) {
    console.error('Error fetching group messages:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch group messages' });
  }
});

// Send group message
router.post('/groups/send', authMiddleware, async (req, res) => {
  try {
    const { groupId, message } = req.body;
    if (!groupId || !message) return res.status(400).json({ error: true, message: 'Missing fields' });

    const messageId = generateId();
    await run(`INSERT INTO group_messages (id, group_id, sender_id, message, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`, [messageId, groupId, req.user.userId, message]);

    try {
      const io = socketHelper.getIo();
      if (io) io.to(`group_${groupId}`).emit('group_message', { groupId, messageId, senderId: req.user.userId, message });
    } catch (e) {
      console.error('Error emitting group message:', e);
    }

    res.status(201).json({ success: true, messageId });
  } catch (err) {
    console.error('Error sending group message:', err);
    res.status(500).json({ error: true, message: 'Failed to send group message' });
  }
});

// Get unread message count
router.get('/count/unread', authMiddleware, async (req, res) => {
  try {
    const result = await get(
      'SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND read = 0',
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

module.exports = router;
