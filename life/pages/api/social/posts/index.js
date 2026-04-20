// pages/api/social/posts/index.js
import { query } from '../../../../lib/db';
import { requireAuth } from '../../../../lib/auth';

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await query(
        `SELECT id, user_id, content, image_url, likes, shares, created_at FROM social_posts
         ORDER BY created_at DESC LIMIT 50`
      );
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching posts:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { content, imageUrl } = req.body;

      if (!content && !imageUrl) {
        return res.status(400).json({ error: 'Content or image required' });
      }

      await query(
        `INSERT INTO social_posts (id, user_id, content, image_url)
         VALUES (gen_random_uuid(), $1, $2, $3)`,
        [req.user.userId, content || '', imageUrl || '']
      );

      res.status(201).json({ success: true });
    } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default requireAuth(handler);
