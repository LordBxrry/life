const express = require('express');
const router = express.Router();
const { get, all, run } = require('../config/database');
const { authMiddleware, generateId } = require('../config/auth');

// Get live streams (sorted by viewer count)
router.get('/live', authMiddleware, async (req, res) => {
  try {
    const streams = await all(
      `SELECT 
        ls.*,
        u.username,
        u.avatar_url,
        COUNT(DISTINCT sv.viewer_id) as current_viewers
       FROM live_streams ls
       JOIN users u ON ls.broadcaster_id = u.id
       LEFT JOIN stream_viewers sv ON ls.id = sv.stream_id AND sv.left_at IS NULL
       WHERE ls.status = 'live'
       AND (
         ls.broadcaster_id IN (
           SELECT user_id_2 FROM connections WHERE user_id_1 = ? AND status = 'accepted'
           UNION
           SELECT user_id_1 FROM connections WHERE user_id_2 = ? AND status = 'accepted'
         ) OR ls.broadcaster_id = ?
       )
       GROUP BY ls.id
       ORDER BY current_viewers DESC`,
      [req.user.userId, req.user.userId, req.user.userId]
    );

    res.json({
      success: true,
      streams
    });
  } catch (err) {
    console.error('Error fetching live streams:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch streams'
    });
  }
});

// Get all streams (including ended and scheduled)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const status = req.query.status || 'live'; // live, ended, scheduled

    const streams = await all(
      `SELECT 
        ls.*,
        u.username,
        u.avatar_url,
        COUNT(DISTINCT sv.viewer_id) as current_viewers
       FROM live_streams ls
       JOIN users u ON ls.broadcaster_id = u.id
       LEFT JOIN stream_viewers sv ON ls.id = sv.stream_id AND sv.left_at IS NULL
       WHERE ls.status = ?
       GROUP BY ls.id
       ORDER BY ls.created_at DESC`,
      [status]
    );

    res.json({
      success: true,
      streams
    });
  } catch (err) {
    console.error('Error fetching streams:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch streams'
    });
  }
});

// Get stream details with comments
router.get('/:streamId', authMiddleware, async (req, res) => {
  try {
    const stream = await get(
      `SELECT 
        ls.*,
        u.username,
        u.avatar_url,
        u.bio,
        COUNT(DISTINCT sv.viewer_id) as current_viewers
       FROM live_streams ls
       JOIN users u ON ls.broadcaster_id = u.id
       LEFT JOIN stream_viewers sv ON ls.id = sv.stream_id AND sv.left_at IS NULL
       WHERE ls.id = ?
       GROUP BY ls.id`,
      [req.params.streamId]
    );

    if (!stream) {
      return res.status(404).json({
        error: true,
        message: 'Stream not found'
      });
    }

    // Get recent comments
    const comments = await all(
      `SELECT 
        sc.id,
        sc.comment,
        sc.created_at,
        u.username,
        u.avatar_url
       FROM stream_comments sc
       JOIN users u ON sc.user_id = u.id
       WHERE sc.stream_id = ?
       ORDER BY sc.created_at DESC
       LIMIT 50`,
      [req.params.streamId]
    );

    res.json({
      success: true,
      stream,
      comments
    });
  } catch (err) {
    console.error('Error fetching stream:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch stream'
    });
  }
});

// Start a live stream
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, stream_url, thumbnail_url, scheduled_for } = req.body;

    if (!title) {
      return res.status(400).json({
        error: true,
        message: 'Stream title is required'
      });
    }

    const streamId = generateId();
    const status = scheduled_for ? 'scheduled' : 'live';
    const startedAt = scheduled_for ? null : new Date().toISOString();

    await run(
      `INSERT INTO live_streams (id, broadcaster_id, title, description, stream_url, thumbnail_url, status, started_at, scheduled_for)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        streamId,
        req.user.userId,
        title,
        description || '',
        stream_url || '',
        thumbnail_url || '',
        status,
        startedAt,
        scheduled_for || null
      ]
    );

    // Send notification to followers that user is going live
    if (status === 'live') {
      // Get user's followers
      const followers = await all(
        `SELECT user_id_1 as follower_id FROM connections 
         WHERE user_id_2 = ? AND status = 'accepted'
         UNION
         SELECT user_id_2 as follower_id FROM connections 
         WHERE user_id_1 = ? AND status = 'accepted'`,
        [req.user.userId, req.user.userId]
      );

      // Create notifications for each follower (in real app, would use WebSocket/push)
      for (const follower of followers) {
        const notifId = generateId();
        await run(
          `INSERT INTO notifications (id, user_id, type, title, message, link_to)
           VALUES (?, ?, 'live_stream', ?, ?, ?)`,
          [
            notifId,
            follower.follower_id,
            `${req.user.username} is live!`,
            `Join their stream now!`,
            `/stream/${streamId}`
          ]
        );
      }
    }

    res.json({
      success: true,
      message: status === 'live' ? 'Stream started!' : 'Stream scheduled!',
      streamId
    });
  } catch (err) {
    console.error('Error starting stream:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to start stream'
    });
  }
});

// Join stream (record viewer)
router.post('/:streamId/join', authMiddleware, async (req, res) => {
  try {
    const stream = await get('SELECT * FROM live_streams WHERE id = ?', [req.params.streamId]);

    if (!stream) {
      return res.status(404).json({
        error: true,
        message: 'Stream not found'
      });
    }

    // Check if viewer already joined
    const existingView = await get(
      `SELECT id FROM stream_viewers 
       WHERE stream_id = ? AND viewer_id = ? AND left_at IS NULL`,
      [req.params.streamId, req.user.userId]
    );

    if (!existingView) {
      const viewerId = generateId();
      await run(
        `INSERT INTO stream_viewers (id, stream_id, viewer_id)
         VALUES (?, ?, ?)`,
        [viewerId, req.params.streamId, req.user.userId]
      );

      // Update viewer count
      await run(
        `UPDATE live_streams 
         SET viewer_count = (SELECT COUNT(*) FROM stream_viewers 
                            WHERE stream_id = ? AND left_at IS NULL),
             max_viewers = CASE WHEN (SELECT COUNT(*) FROM stream_viewers 
                                     WHERE stream_id = ? AND left_at IS NULL) > max_viewers 
                          THEN (SELECT COUNT(*) FROM stream_viewers 
                               WHERE stream_id = ? AND left_at IS NULL) 
                          ELSE max_viewers END
         WHERE id = ?`,
        [req.params.streamId, req.params.streamId, req.params.streamId, req.params.streamId]
      );
    }

    res.json({
      success: true,
      message: 'Joined stream'
    });
  } catch (err) {
    console.error('Error joining stream:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to join stream'
    });
  }
});

// Leave stream
router.post('/:streamId/leave', authMiddleware, async (req, res) => {
  try {
    await run(
      `UPDATE stream_viewers 
       SET left_at = CURRENT_TIMESTAMP,
           watch_duration = CAST((julianday(CURRENT_TIMESTAMP) - julianday(joined_at)) * 24 * 60 * 60 AS INTEGER)
       WHERE stream_id = ? AND viewer_id = ? AND left_at IS NULL`,
      [req.params.streamId, req.user.userId]
    );

    // Update viewer count
    await run(
      `UPDATE live_streams 
       SET viewer_count = (SELECT COUNT(*) FROM stream_viewers 
                          WHERE stream_id = ? AND left_at IS NULL)
       WHERE id = ?`,
      [req.params.streamId, req.params.streamId]
    );

    res.json({
      success: true,
      message: 'Left stream'
    });
  } catch (err) {
    console.error('Error leaving stream:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to leave stream'
    });
  }
});

// Send comment in stream
router.post('/:streamId/comment', authMiddleware, async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Comment cannot be empty'
      });
    }

    const stream = await get('SELECT * FROM live_streams WHERE id = ?', [req.params.streamId]);

    if (!stream) {
      return res.status(404).json({
        error: true,
        message: 'Stream not found'
      });
    }

    const commentId = generateId();
    await run(
      `INSERT INTO stream_comments (id, stream_id, user_id, comment)
       VALUES (?, ?, ?, ?)`,
      [commentId, req.params.streamId, req.user.userId, comment.trim()]
    );

    res.json({
      success: true,
      message: 'Comment posted'
    });
  } catch (err) {
    console.error('Error posting comment:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to post comment'
    });
  }
});

// Send gift/donation in stream
router.post('/:streamId/gift', authMiddleware, async (req, res) => {
  try {
    const { gift_name, gift_value } = req.body;

    if (!gift_name) {
      return res.status(400).json({
        error: true,
        message: 'Gift name is required'
      });
    }

    const stream = await get('SELECT * FROM live_streams WHERE id = ?', [req.params.streamId]);

    if (!stream) {
      return res.status(404).json({
        error: true,
        message: 'Stream not found'
      });
    }

    const giftId = generateId();
    await run(
      `INSERT INTO stream_gifts (id, stream_id, sender_id, gift_name, gift_value)
       VALUES (?, ?, ?, ?, ?)`,
      [giftId, req.params.streamId, req.user.userId, gift_name, gift_value || 0]
    );

    res.json({
      success: true,
      message: 'Gift sent!'
    });
  } catch (err) {
    console.error('Error sending gift:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to send gift'
    });
  }
});

// End stream (broadcaster only)
router.post('/:streamId/end', authMiddleware, async (req, res) => {
  try {
    const stream = await get('SELECT broadcaster_id FROM live_streams WHERE id = ?', [req.params.streamId]);

    if (!stream) {
      return res.status(404).json({
        error: true,
        message: 'Stream not found'
      });
    }

    if (stream.broadcaster_id !== req.user.userId) {
      return res.status(403).json({
        error: true,
        message: 'Only broadcaster can end stream'
      });
    }

    await run(
      `UPDATE live_streams 
       SET status = 'ended', ended_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.params.streamId]
    );

    // Mark remaining viewers as left
    await run(
      `UPDATE stream_viewers 
       SET left_at = CURRENT_TIMESTAMP
       WHERE stream_id = ? AND left_at IS NULL`,
      [req.params.streamId]
    );

    res.json({
      success: true,
      message: 'Stream ended'
    });
  } catch (err) {
    console.error('Error ending stream:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to end stream'
    });
  }
});

// Get stream replays (ended streams)
router.get('/broadcasts/recent', authMiddleware, async (req, res) => {
  try {
    const streams = await all(
      `SELECT 
        ls.*,
        u.username,
        u.avatar_url,
        COUNT(DISTINCT sv.viewer_id) as total_viewers
       FROM live_streams ls
       JOIN users u ON ls.broadcaster_id = u.id
       LEFT JOIN stream_viewers sv ON ls.id = sv.stream_id
       WHERE ls.status = 'ended'
       AND (
         ls.broadcaster_id IN (
           SELECT user_id_2 FROM connections WHERE user_id_1 = ? AND status = 'accepted'
           UNION
           SELECT user_id_1 FROM connections WHERE user_id_2 = ? AND status = 'accepted'
         ) OR ls.broadcaster_id = ?
       )
       GROUP BY ls.id
       ORDER BY ls.ended_at DESC
       LIMIT 20`,
      [req.user.userId, req.user.userId, req.user.userId]
    );

    res.json({
      success: true,
      streams
    });
  } catch (err) {
    console.error('Error fetching replays:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch replays'
    });
  }
});

module.exports = router;
