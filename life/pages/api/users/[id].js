// pages/api/users/[id].js
import { query } from '../../../lib/db';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const result = await query(
        'SELECT id, username, email, first_name, last_name, avatar_url, bio, social_score, created_at FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error('Error fetching user:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    // Require authentication
    if (!req.user || req.user.userId !== id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
      const { firstName, lastName, bio, avatarUrl } = req.body;

      await query(
        `UPDATE users SET first_name = $1, last_name = $2, bio = $3, avatar_url = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [firstName || '', lastName || '', bio || '', avatarUrl || '', id]
      );

      const result = await query(
        'SELECT id, username, email, first_name, last_name, avatar_url, bio, social_score FROM users WHERE id = $1',
        [id]
      );

      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error('Error updating user:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default requireAuth(handler);
