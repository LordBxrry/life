const express = require('express');
const router = express.Router();
const { db, run, get, all } = require('../config/database');
const { authMiddleware, generateId } = require('../config/auth');

/**
 * SOCIAL SCORE SYSTEM
 * 
 * Points earned through:
 * - Activity: login (+1), message sent (+2), profile update (+2), product listed (+5)
 * - User votes: upvote (+10), downvote (-5)
 * 
 * Keeps users engaged with gamification and community feedback
 */

// Track activity for social score points
router.post('/track-activity', authMiddleware, async (req, res) => {
  try {
    const { activity_type, description, reference_id } = req.body;
    const userId = req.user.id;

    // Point system for different activities
    const activityPoints = {
      'login': 1,
      'message_sent': 2,
      'profile_update': 2,
      'product_listed': 5,
      'profile_viewed': 1,
      'connection_made': 3,
      'post_created': 3,
      'review_written': 4,
      'daily_check_in': 1
    };

    const points = activityPoints[activity_type] || 0;

    if (points === 0) {
      return res.status(400).json({
        error: true,
        message: 'Invalid activity type'
      });
    }

    // Record activity
    const activityId = generateId();
    await run(
      `INSERT INTO user_activities (id, user_id, activity_type, points_earned, description, reference_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [activityId, userId, activity_type, points, description, reference_id]
    );

    // Update user's social score and activity level
    await run(
      `UPDATE users 
       SET social_score = social_score + ?,
           activity_level = activity_level + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [points, userId]
    );

    // Get updated user data
    const updatedUser = await get(
      `SELECT id, username, social_score, upvotes_count, downvotes_count, activity_level
       FROM users WHERE id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: `Activity tracked! +${points} points`,
      points_earned: points,
      user: updatedUser
    });
  } catch (err) {
    console.error('Track activity error:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to track activity'
    });
  }
});

// Vote/rate a user (upvote or downvote)
// upvote = positive opinion, downvote = negative opinion
router.post('/vote/:targetUserId', authMiddleware, async (req, res) => {
  try {
    const { vote_type } = req.body; // 'upvote' or 'downvote'
    const raterId = req.user.id;
    const targetUserId = req.params.targetUserId;

    // Validation
    if (!['upvote', 'downvote'].includes(vote_type)) {
      return res.status(400).json({
        error: true,
        message: 'vote_type must be "upvote" or "downvote"'
      });
    }

    if (raterId === targetUserId) {
      return res.status(400).json({
        error: true,
        message: 'Cannot vote on your own account'
      });
    }

    // Check if target user exists
    const targetUser = await get('SELECT id FROM users WHERE id = ?', [targetUserId]);
    if (!targetUser) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Check for existing vote
    const existingVote = await get(
      `SELECT id, vote_type FROM user_ratings WHERE rater_id = ? AND rated_user_id = ?`,
      [raterId, targetUserId]
    );

    const ratingId = generateId();
    let pointsChange = 0;
    let action = 'created';

    if (existingVote) {
      // Update existing vote
      action = 'updated';

      // Calculate point change
      if (existingVote.vote_type === 'upvote' && vote_type === 'downvote') {
        // Changed from upvote to downvote: -10 - (-5) = -15
        pointsChange = -15;
      } else if (existingVote.vote_type === 'downvote' && vote_type === 'upvote') {
        // Changed from downvote to upvote: +10 - (+5) = +5
        pointsChange = 15;
      } else {
        // Same vote, no change
        return res.json({
          success: true,
          message: 'Vote unchanged',
          action: 'no_change'
        });
      }

      await run(
        `UPDATE user_ratings SET vote_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [vote_type, existingVote.id]
      );
    } else {
      // Create new vote
      await run(
        `INSERT INTO user_ratings (id, rater_id, rated_user_id, vote_type, created_at, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [ratingId, raterId, targetUserId, vote_type]
      );

      pointsChange = vote_type === 'upvote' ? 10 : -5;
    }

    // Update target user's score and vote counts
    const updateQuery = vote_type === 'upvote' 
      ? `UPDATE users 
         SET social_score = social_score + ?,
             upvotes_count = upvotes_count + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      : `UPDATE users 
         SET social_score = social_score + ?,
             downvotes_count = downvotes_count + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`;

    await run(updateQuery, [pointsChange, targetUserId]);

    // Get updated user data
    const updatedUser = await get(
      `SELECT id, username, social_score, upvotes_count, downvotes_count FROM users WHERE id = ?`,
      [targetUserId]
    );

    res.json({
      success: true,
      message: `${vote_type} recorded!`,
      action: action,
      points_change: pointsChange,
      target_user: updatedUser
    });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to record vote'
    });
  }
});

// Get user's social score and rating stats
router.get('/:userId/score', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get user info with social stats
    const user = await get(
      `SELECT id, username, email, full_name, avatar_url, bio, location,
              social_score, upvotes_count, downvotes_count, activity_level,
              created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Get rating breakdown
    const upvotes = user.upvotes_count || 0;
    const downvotes = user.downvotes_count || 0;
    const totalVotes = upvotes + downvotes;
    const likePercentage = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;

    // Get recent activities
    const recentActivities = await all(
      `SELECT activity_type, points_earned, description, created_at
       FROM user_activities
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    // Get user's rank on leaderboard
    const rankResult = await get(
      `SELECT COUNT(*) as rank FROM users WHERE social_score > (SELECT social_score FROM users WHERE id = ?)`,
      [userId]
    );

    const rank = (rankResult?.rank || 0) + 1;

    res.json({
      success: true,
      user: {
        ...user,
        stats: {
          social_score: user.social_score || 0,
          upvotes: upvotes,
          downvotes: downvotes,
          total_votes: totalVotes,
          like_percentage: likePercentage,
          activity_level: user.activity_level || 0,
          global_rank: rank
        },
        recent_activities: recentActivities
      }
    });
  } catch (err) {
    console.error('Get user score error:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to retrieve user score'
    });
  }
});

// Get leaderboard - top users by social score
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    // Get top users by social score
    const leaderboard = await all(
      `SELECT 
         id, username, avatar_url, bio,
         social_score, upvotes_count, downvotes_count, activity_level,
         created_at
       FROM users
       WHERE account_active = 1
       ORDER BY social_score DESC, upvotes_count DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Add rankings
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: offset + index + 1,
      like_percentage: (((user.upvotes_count || 0) / ((user.upvotes_count || 0) + (user.downvotes_count || 0))) * 100) || 0
    }));

    // Get total users
    const totalResult = await get('SELECT COUNT(*) as total FROM users WHERE account_active = 1');
    const total = totalResult?.total || 0;

    res.json({
      success: true,
      leaderboard: rankedLeaderboard,
      pagination: {
        limit,
        offset,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get leaderboard error:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to retrieve leaderboard'
    });
  }
});

// Get user's rating history (who voted on this user)
router.get('/:userId/ratings', async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    // Verify user exists
    const user = await get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Get ratings this user received
    const ratings = await all(
      `SELECT 
         ur.id, ur.vote_type, ur.reason, ur.created_at,
         u.id as rater_id, u.username as rater_username, u.avatar_url as rater_avatar
       FROM user_ratings ur
       JOIN users u ON ur.rater_id = u.id
       WHERE ur.rated_user_id = ?
       ORDER BY ur.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // Get rating counts
    const countResult = await get(
      `SELECT 
         SUM(CASE WHEN vote_type = 'upvote' THEN 1 ELSE 0 END) as upvotes,
         SUM(CASE WHEN vote_type = 'downvote' THEN 1 ELSE 0 END) as downvotes
       FROM user_ratings
       WHERE rated_user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      ratings: ratings,
      summary: {
        upvotes: countResult?.upvotes || 0,
        downvotes: countResult?.downvotes || 0
      }
    });
  } catch (err) {
    console.error('Get ratings error:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to retrieve ratings'
    });
  }
});

// Get current user's activity stats
router.get('/my/activity', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get activity summary
    const activitySummary = await all(
      `SELECT 
         activity_type, 
         COUNT(*) as count,
         SUM(points_earned) as total_points
       FROM user_activities
       WHERE user_id = ?
       GROUP BY activity_type
       ORDER BY total_points DESC`,
      [userId]
    );

    // Get user's social stats
    const userStats = await get(
      `SELECT social_score, upvotes_count, downvotes_count, activity_level FROM users WHERE id = ?`,
      [userId]
    );

    res.json({
      success: true,
      activity_summary: activitySummary,
      stats: userStats
    });
  } catch (err) {
    console.error('Get activity error:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to retrieve activity stats'
    });
  }
});

module.exports = router;
