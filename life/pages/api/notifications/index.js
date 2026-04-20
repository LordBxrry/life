// pages/api/notifications/index.js
import { query } from '../../../lib/db';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await query(
        'SELECT id, type, message, read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
        [req.user.userId]
      );
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { notificationId, read } = req.body;

      await query(
        'UPDATE notifications SET read = $1 WHERE id = $2 AND user_id = $3',
        [read, notificationId, req.user.userId]
      );

      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error updating notification:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default requireAuth(handler);
