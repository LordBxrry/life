// pages/api/stories/index.js
import { query } from '../../../lib/db';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await query(
        `SELECT id, user_id, content, image_url, created_at FROM stories
         WHERE expires_at > CURRENT_TIMESTAMP OR expires_at IS NULL
         ORDER BY created_at DESC`
      );
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching stories:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { content, imageUrl, expiresAt } = req.body;

      if (!content && !imageUrl) {
        return res.status(400).json({ error: 'Content or image required' });
      }

      await query(
        `INSERT INTO stories (id, user_id, content, image_url, expires_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
        [req.user.userId, content || '', imageUrl || '', expiresAt || null]
      );

      res.status(201).json({ success: true });
    } catch (err) {
      console.error('Error creating story:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default requireAuth(handler);
