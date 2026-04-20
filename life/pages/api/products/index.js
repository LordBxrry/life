// pages/api/products/index.js
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await query('SELECT * FROM products ORDER BY created_at DESC');
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, description, price, imageUrl } = req.body;

      if (!name || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await query(
        'INSERT INTO products (id, name, description, price, image_url) VALUES (gen_random_uuid(), $1, $2, $3, $4)',
        [name, description || '', price, imageUrl || '']
      );

      res.status(201).json({ success: true });
    } catch (err) {
      console.error('Error creating product:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
