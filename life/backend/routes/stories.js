const express = require('express');
const router = express.Router();
const { get, all, run } = require('../config/database');
const { authMiddleware, generateId } = require('../config/auth');

// Get all stories from followers (feed)
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const stories = await all(
      `SELECT 
        s.*,
        u.username,
        u.avatar_url,
        COUNT(DISTINCT sv.viewer_id) as view_count,
        (SELECT COUNT(*) FROM story_reactions WHERE story_id = s.id) as reaction_count,
        (SELECT reaction FROM story_reactions WHERE story_id = s.id AND user_id = ?) as user_reaction
       FROM stories s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN story_views sv ON s.id = sv.story_id
       WHERE (s.user_id IN (
         SELECT user_id_2 FROM connections WHERE user_id_1 = ? AND status = 'accepted'
         UNION
         SELECT user_id_1 FROM connections WHERE user_id_2 = ? AND status = 'accepted'
       ) OR s.user_id = ?)
       AND s.expires_at > CURRENT_TIMESTAMP
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [req.user.userId, req.user.userId, req.user.userId, req.user.userId]
    );

    res.json({
      success: true,
      stories
    });
  } catch (err) {
    console.error('Error fetching stories:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch stories'
    });
  }
});

// Get user's own stories
router.get('/my-stories', authMiddleware, async (req, res) => {
  try {
    const stories = await all(
      `SELECT 
        s.*,
        u.username,
        u.avatar_url,
        COUNT(DISTINCT sv.viewer_id) as view_count
       FROM stories s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN story_views sv ON s.id = sv.story_id
       WHERE s.user_id = ?
       AND s.expires_at > CURRENT_TIMESTAMP
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [req.user.userId]
    );

    res.json({
      success: true,
      stories
    });
  } catch (err) {
    console.error('Error fetching user stories:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch stories'
    });
  }
});

// Get stories from specific user
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const stories = await all(
      `SELECT 
        s.*,
        u.username,
        u.avatar_url,
        COUNT(DISTINCT sv.viewer_id) as view_count,
        (SELECT reaction FROM story_reactions WHERE story_id = s.id AND user_id = ?) as user_reaction
       FROM stories s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN story_views sv ON s.id = sv.story_id
       WHERE s.user_id = ?
       AND s.expires_at > CURRENT_TIMESTAMP
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [req.user.userId, req.params.userId]
    );

    res.json({
      success: true,
      stories
    });
  } catch (err) {
    console.error('Error fetching user stories:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch stories'
    });
  }
});

// Create a new story
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { media_url, media_type, caption, duration } = req.body;

    if (!media_url) {
      return res.status(400).json({
        error: true,
        message: 'Media URL is required'
      });
    }

    const storyId = generateId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now

    await run(
      `INSERT INTO stories (id, user_id, media_url, media_type, caption, duration, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [storyId, req.user.userId, media_url, media_type || 'image', caption || '', duration || 5, expiresAt.toISOString()]
    );

    res.json({
      success: true,
      message: 'Story posted successfully',
      storyId
    });
  } catch (err) {
    console.error('Error creating story:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to create story'
    });
  }
});

// View story (track view + trigger notification)
router.post('/:storyId/view', authMiddleware, async (req, res) => {
  try {
    const story = await get('SELECT * FROM stories WHERE id = ?', [req.params.storyId]);

    if (!story) {
      return res.status(404).json({
        error: true,
        message: 'Story not found'
      });
    }

    // Record view if not already viewed by this user
    try {
      const viewId = generateId();
      await run(
        `INSERT INTO story_views (id, story_id, viewer_id)
         VALUES (?, ?, ?)`,
        [viewId, req.params.storyId, req.user.userId]
      );

      // Update view count
      await run(
        `UPDATE stories SET view_count = view_count + 1 WHERE id = ?`,
        [req.params.storyId]
      );
    } catch (e) {
      // View already recorded
    }

    res.json({
      success: true,
      message: 'View recorded'
    });
  } catch (err) {
    console.error('Error recording view:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to record view'
    });
  }
});

// React to story (heart/emoji)
router.post('/:storyId/react', authMiddleware, async (req, res) => {
  try {
    const { reaction } = req.body;

    if (!reaction) {
      return res.status(400).json({
        error: true,
        message: 'Reaction emoji is required'
      });
    }

    const story = await get('SELECT * FROM stories WHERE id = ?', [req.params.storyId]);

    if (!story) {
      return res.status(404).json({
        error: true,
        message: 'Story not found'
      });
    }

    // Record or update reaction
    try {
      const reactionId = generateId();
      await run(
        `INSERT INTO story_reactions (id, story_id, user_id, reaction)
         VALUES (?, ?, ?, ?)`,
        [reactionId, req.params.storyId, req.user.userId, reaction]
      );
    } catch (e) {
      // Update existing reaction
      await run(
        `UPDATE story_reactions SET reaction = ? 
         WHERE story_id = ? AND user_id = ?`,
        [reaction, req.params.storyId, req.user.userId]
      );
    }

    res.json({
      success: true,
      message: 'Reaction recorded'
    });
  } catch (err) {
    console.error('Error recording reaction:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to record reaction'
    });
  }
});

// Get story viewers
router.get('/:storyId/viewers', authMiddleware, async (req, res) => {
  try {
    const story = await get('SELECT user_id FROM stories WHERE id = ?', [req.params.storyId]);

    if (!story) {
      return res.status(404).json({
        error: true,
        message: 'Story not found'
      });
    }

    // Only story owner can see viewers
    if (story.user_id !== req.user.userId) {
      return res.status(403).json({
        error: true,
        message: 'Access denied'
      });
    }

    const viewers = await all(
      `SELECT 
        u.id,
        u.username,
        u.avatar_url,
        sv.viewed_at,
        (SELECT reaction FROM story_reactions WHERE story_id = ? AND user_id = u.id) as reaction
       FROM story_views sv
       JOIN users u ON sv.viewer_id = u.id
       WHERE sv.story_id = ?
       ORDER BY sv.viewed_at DESC`,
      [req.params.storyId, req.params.storyId]
    );

    res.json({
      success: true,
      viewers
    });
  } catch (err) {
    console.error('Error fetching viewers:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch viewers'
    });
  }
});

// Delete story
router.delete('/:storyId', authMiddleware, async (req, res) => {
  try {
    const story = await get('SELECT user_id FROM stories WHERE id = ?', [req.params.storyId]);

    if (!story) {
      return res.status(404).json({
        error: true,
        message: 'Story not found'
      });
    }

    if (story.user_id !== req.user.userId) {
      return res.status(403).json({
        error: true,
        message: 'Only owner can delete story'
      });
    }

    await run('DELETE FROM stories WHERE id = ?', [req.params.storyId]);

    res.json({
      success: true,
      message: 'Story deleted'
    });
  } catch (err) {
    console.error('Error deleting story:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to delete story'
    });
  }
});

module.exports = router;
