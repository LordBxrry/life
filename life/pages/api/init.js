// pages/api/init.js
// This endpoint initializes the database schema on first request
// Can be called manually to set up the database

import { initializeDatabase } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initializeDatabase();
    res.status(200).json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (err) {
    console.error('Database initialization error:', err);
    res.status(500).json({ 
      error: 'Database initialization failed',
      details: err.message 
    });
  }
}
