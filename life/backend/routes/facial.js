const express = require('express');
const router = express.Router();
const { get, run } = require('../config/database');
const { authMiddleware, generateId } = require('../config/auth');
const {
  verifyFacialDescriptor,
  processAndStoreFacialData,
  validateFacialData,
  getFacialRecognitionStatus
} = require('../config/facial-recognition');

/**
 * FACIAL RECOGNITION ENDPOINTS
 * 
 * Allows users to:
 * - Setup facial recognition from their profile/settings
 * - Login using facial recognition instead of password
 * - Disable facial recognition
 * - Check facial recognition status
 */

// Setup facial recognition (user captures their face)
router.post('/setup', authMiddleware, async (req, res) => {
  try {
    const { facialDescriptor } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!facialDescriptor || !Array.isArray(facialDescriptor) || facialDescriptor.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Valid facial descriptor required'
      });
    }

    // Process and validate facial data
    const facialData = processAndStoreFacialData(facialDescriptor);
    
    if (!facialData.success) {
      return res.status(400).json({
        error: true,
        message: facialData.error || 'Failed to process facial data'
      });
    }

    // Store facial data in database
    await run(
      `UPDATE users 
       SET facial_recognition_enabled = 1,
           facial_descriptor = ?,
           facial_data_hash = ?,
           facial_setup_date = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [facialData.facial_descriptor, facialData.facial_data_hash, userId]
    );

    res.json({
      success: true,
      message: 'Facial recognition setup complete!',
      facial_recognition: {
        enabled: true,
        setupDate: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Facial recognition setup error:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to setup facial recognition'
    });
  }
});

// Disable facial recognition
router.post('/disable', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Clear facial data from database
    await run(
      `UPDATE users 
       SET facial_recognition_enabled = 0,
           facial_descriptor = NULL,
           facial_data_hash = NULL,
           facial_setup_date = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Facial recognition disabled'
    });
  } catch (err) {
    console.error('Disable facial recognition error:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to disable facial recognition'
    });
  }
});

// Verify facial recognition for login (frontend sends captured descriptor)
router.post('/verify', async (req, res) => {
  try {
    const { email, facialDescriptor } = req.body;

    // Validate input
    if (!email || !facialDescriptor || !Array.isArray(facialDescriptor)) {
      return res.status(400).json({
        error: true,
        message: 'Email and facial descriptor required'
      });
    }

    // Find user by email
    const user = await get(
      `SELECT id, email, facial_recognition_enabled, facial_descriptor, 
              account_active, is_admin, role
       FROM users 
       WHERE email = ? AND facial_recognition_enabled = 1`,
      [email]
    );

    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Facial recognition not enabled for this account'
      });
    }

    // Check if account is active
    if (!user.account_active) {
      return res.status(403).json({
        error: true,
        message: 'Account is deactivated'
      });
    }

    // Verify facial descriptor against stored descriptor
    const verificationResult = verifyFacialDescriptor(
      facialDescriptor,
      user.facial_descriptor,
      0.45 // Threshold for facial match (0.45 = strict, 0.6 = loose)
    );

    if (!verificationResult.match) {
      return res.status(401).json({
        error: true,
        message: 'Face does not match',
        distance: verificationResult.distance
      });
    }

    // Update last facial login
    await run(
      'UPDATE users SET last_facial_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Generate authentication token (without regular password verification)
    const { generateToken } = require('../config/auth');
    const isAdmin = user.is_admin ? true : false;
    const token = generateToken(user.id, isAdmin);

    // Track facial login as activity
    const activityId = generateId();
    await run(
      `INSERT INTO user_activities (id, user_id, activity_type, points_earned, description, created_at)
       VALUES (?, ?, 'login', 1, 'Facial recognition login', CURRENT_TIMESTAMP)`,
      [activityId, user.id]
    );

    // Increment social score
    await run(
      `UPDATE users 
       SET social_score = social_score + 1,
           activity_level = activity_level + 1
       WHERE id = ?`,
      [user.id]
    );

    res.json({
      success: true,
      message: 'Facial recognition login successful',
      user: {
        id: user.id,
        email: user.email,
        isAdmin: isAdmin,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error('Facial verification error:', err);
    res.status(500).json({
      error: true,
      message: 'Facial verification failed'
    });
  }
});

// Get facial recognition status for current user
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await get(
      `SELECT facial_recognition_enabled, facial_setup_date, last_facial_login
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    const status = getFacialRecognitionStatus(user);

    res.json({
      success: true,
      facial_recognition: status
    });
  } catch (err) {
    console.error('Get facial status error:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to retrieve facial recognition status'
    });
  }
});

// Check if email has facial recognition enabled (for login page)
router.post('/check-enabled', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: true,
        message: 'Email required'
      });
    }

    const user = await get(
      `SELECT id, facial_recognition_enabled 
       FROM users 
       WHERE email = ? AND account_active = 1`,
      [email]
    );

    const enabled = user && user.facial_recognition_enabled === 1;

    res.json({
      success: true,
      facial_recognition_available: enabled,
      email: email
    });
  } catch (err) {
    console.error('Check facial enabled error:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to check facial recognition availability'
    });
  }
});

module.exports = router;
