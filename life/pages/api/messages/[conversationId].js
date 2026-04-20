// pages/api/messages/[conversationId].js
import { query } from '../../../lib/db';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { conversationId } = req.query;

  if (req.method === 'GET') {
    try {
      const result = await query(
        `SELECT id, from_user_id, to_user_id, content, created_at FROM messages
         WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)
         ORDER BY created_at DESC LIMIT 50`,
        [req.user.userId, conversationId]
      );

      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching messages:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { content, toUserId } = req.body;

      if (!content || !toUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await query(
        'INSERT INTO messages (id, from_user_id, to_user_id, content) VALUES (gen_random_uuid(), $1, $2, $3)',
        [req.user.userId, toUserId, content]
      );

      res.status(201).json({ success: true });
    } catch (err) {
      console.error('Error creating message:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default requireAuth(handler);
