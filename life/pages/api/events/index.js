// pages/api/events/index.js
import { query } from '../../../lib/db';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await query(
        'SELECT id, creator_id, title, description, start_date, location, image_url FROM events ORDER BY start_date DESC'
      );
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching events:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, description, startDate, location, imageUrl } = req.body;

      if (!title || !startDate) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await query(
        `INSERT INTO events (id, creator_id, title, description, start_date, location, image_url)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
        [req.user.userId, title, description || '', startDate, location || '', imageUrl || '']
      );

      res.status(201).json({ success: true });
    } catch (err) {
      console.error('Error creating event:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default requireAuth(handler);
