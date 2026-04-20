// pages/api/auth/register.js
import { query } from '../../../lib/db';
import { hashPassword, generateToken } from '../../../lib/auth';
import { v4 as uuid } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, username, password, firstName, lastName } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = uuid();
    await query(
      `INSERT INTO users (id, email, username, password, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, email, username, hashedPassword, firstName || '', lastName || '']
    );

    // Generate token
    const token = generateToken({ userId, email, username, isAdmin: false });

    res.status(201).json({
      success: true,
      token,
      user: { userId, email, username, firstName, lastName }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
