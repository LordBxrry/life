const express = require('express');
const router = express.Router();
const { db, run, get, all } = require('../config/database');
const { authMiddleware, generateId } = require('../config/auth');

/**
 * SOCIAL MEDIA INTEGRATION
 *
 * Allows users to connect social media accounts and aggregate feeds
 */

// Get user's connected social media accounts
router.get('/connections', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get connected platforms
    const connections = await all(
      `SELECT platform, username, connected_at, last_sync
       FROM social_connections
       WHERE user_id = ? AND active = 1`,
      [userId]
    );

    res.json({
      success: true,
      connections: connections.map(conn => ({
        platform: conn.platform,
        username: conn.username,
        connectedAt: conn.connected_at,
        lastSync: conn.last_sync
      }))
    });
  } catch (err) {
    console.error('Get connections error:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to get connections'
    });
  }
});

// Connect to a social media platform
router.post('/connect/:platform', authMiddleware, async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user.id;
    const { username, accessToken } = req.body; // In real implementation, get from OAuth

    // Validate platform
    const validPlatforms = ['twitter', 'facebook', 'instagram', 'linkedin'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid platform'
      });
    }

    // Check if already connected
    const existing = await get(
      `SELECT id FROM social_connections WHERE user_id = ? AND platform = ? AND active = 1`,
      [userId, platform]
    );

    if (existing) {
      return res.status(400).json({
        error: true,
        message: 'Already connected to this platform'
      });
    }

    // Add connection
    const connectionId = generateId();
    await run(
      `INSERT INTO social_connections (id, user_id, platform, username, access_token, connected_at, active)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)`,
      [connectionId, userId, platform, username, accessToken]
    );

    res.json({
      success: true,
      message: `${platform} connected successfully`
    });
  } catch (err) {
    console.error('Connect platform error:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to connect platform'
    });
  }
});

// Disconnect from a social media platform
router.post('/disconnect/:platform', authMiddleware, async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user.id;

    // Deactivate connection
    await run(
      `UPDATE social_connections
       SET active = 0, disconnected_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND platform = ? AND active = 1`,
      [userId, platform]
    );

    res.json({
      success: true,
      message: `${platform} disconnected`
    });
  } catch (err) {
    console.error('Disconnect platform error:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to disconnect platform'
    });
  }
});

// Get aggregated feed from connected accounts
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Get connected platforms
    const connections = await all(
      `SELECT platform, username, access_token
       FROM social_connections
       WHERE user_id = ? AND active = 1`,
      [userId]
    );

    if (connections.length === 0) {
      return res.json({
        success: true,
        feed: [],
        message: 'No connected social media accounts'
      });
    }

    // For demo purposes, return mock data
    // In real implementation, fetch from actual APIs
    const mockFeed = generateMockFeed(connections, limit);

    res.json({
      success: true,
      feed: mockFeed
    });
  } catch (err) {
    console.error('Get feed error:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to get feed'
    });
  }
});

// Mock feed generator for demo
function generateMockFeed(connections, limit) {
  const feed = [];
  const platforms = connections.map(c => c.platform);

  for (let i = 0; i < limit; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const connection = connections.find(c => c.platform === platform);

    feed.push({
      id: generateId(),
      platform: platform,
      username: connection.username,
      content: getMockContent(platform),
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // Last 7 days
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 20),
      shares: Math.floor(Math.random() * 10)
    });
  }

  // Sort by timestamp descending
  return feed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getMockContent(platform) {
  const contents = {
    twitter: [
      "Just had an amazing coffee! ☕ #morningvibes",
      "Working on something exciting... stay tuned! 🚀",
      "Beautiful sunset today 🌅",
      "New project launch coming soon! #tech"
    ],
    facebook: [
      "Family dinner was wonderful tonight! 🍽️",
      "Check out this amazing recipe I tried",
      "Weekend plans: hiking and relaxation 🏔️",
      "Proud of my team's latest achievement!"
    ],
    instagram: [
      "Photo dump from my recent trip 📸✈️",
      "New outfit, who dis? 👗",
      "Foodie adventures continue 🍜",
      "Sunset vibes 🌅 #photography"
    ],
    linkedin: [
      "Excited to share my latest article on industry trends",
      "Professional development never stops 📚",
      "Networking event was a success! 🤝",
      "Career milestone achieved! 🎉"
    ]
  };

  const platformContents = contents[platform] || ["New post!"];
  return platformContents[Math.floor(Math.random() * platformContents.length)];
}

module.exports = router;