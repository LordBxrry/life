const express = require('express');
const router = express.Router();
const { get, all, run } = require('../config/database');
const { authMiddleware, generateId } = require('../config/auth');

// Get all public events + user's private events
router.get('/', authMiddleware, async (req, res) => {
  try {
    const events = await all(
      `SELECT 
        e.*,
        COALESCE(u.username, 'Demo User') as host_name,
        COALESCE(u.avatar_url, 'DU') as host_avatar,
        COUNT(DISTINCT CASE WHEN ea.rsvp_status = 'accepted' THEN ea.user_id END) as attendee_count,
        (SELECT rsvp_status FROM event_attendees WHERE event_id = e.id AND user_id = ?) as user_rsvp_status
       FROM events e
       LEFT JOIN users u ON e.host_id = u.id
       LEFT JOIN event_attendees ea ON e.id = ea.event_id
       WHERE e.event_type = 'public' OR e.host_id = ?
       GROUP BY e.id
       ORDER BY e.date ASC`,
      [req.user.userId, req.user.userId]
    );

    res.json({
      success: true,
      events
    });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch events'
    });
  }
});

// Get detailed event with all attendees
router.get('/:eventId', authMiddleware, async (req, res) => {
  try {
    const event = await get(
      `SELECT 
        e.*,
        COALESCE(u.username, 'Demo User') as host_name,
        COALESCE(u.avatar_url, 'DU') as host_avatar,
        COALESCE(u.location, 'Unknown') as host_location
       FROM events e
       LEFT JOIN users u ON e.host_id = u.id
       WHERE e.id = ?`,
      [req.params.eventId]
    );

    if (!event) {
      return res.status(404).json({
        error: true,
        message: 'Event not found'
      });
    }

    // Check access (public or user is host)
    if (event.event_type === 'private' && event.host_id !== req.user.userId) {
      return res.status(403).json({
        error: true,
        message: 'Access denied'
      });
    }

    // Get attendees
    const attendees = await all(
      `SELECT 
        ea.id,
        ea.user_id,
        ea.rsvp_status,
        ea.invited_at,
        ea.responded_at,
        COALESCE(u.username, 'Demo User') as username,
        COALESCE(u.avatar_url, 'DU') as avatar_url
       FROM event_attendees ea
       LEFT JOIN users u ON ea.user_id = u.id
       WHERE ea.event_id = ?
       ORDER BY CASE WHEN ea.rsvp_status = 'accepted' THEN 0 ELSE 1 END, ea.invited_at ASC`,
      [req.params.eventId]
    );

    res.json({
      success: true,
      event,
      attendees
    });
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch event'
    });
  }
});

// Create event
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, date, time, location, event_type, max_attendees } = req.body;

    if (!name || !date || !time || !location || !event_type) {
      return res.status(400).json({
        error: true,
        message: 'Missing required fields'
      });
    }

    const eventId = generateId('evt');
    await run(
      `INSERT INTO events (id, host_id, name, description, date, time, location, event_type, max_attendees)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [eventId, req.user.userId, name, description || '', date, time, location, event_type, max_attendees || null]
    );

    // Host automatically accepts the event
    await run(
      `INSERT INTO event_attendees (id, event_id, user_id, rsvp_status)
       VALUES (?, ?, ?, ?)`,
      ['ea_' + Date.now(), eventId, req.user.userId, 'accepted']
    );

    res.json({
      success: true,
      message: 'Event created successfully',
      eventId
    });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to create event'
    });
  }
});

// Update event (host only)
router.put('/:eventId', authMiddleware, async (req, res) => {
  try {
    const event = await get('SELECT host_id FROM events WHERE id = ?', [req.params.eventId]);

    if (!event) {
      return res.status(404).json({
        error: true,
        message: 'Event not found'
      });
    }

    if (event.host_id !== req.user.userId) {
      return res.status(403).json({
        error: true,
        message: 'Only host can update event'
      });
    }

    const { name, description, date, time, location, event_type, max_attendees } = req.body;

    await run(
      `UPDATE events 
       SET name = ?, description = ?, date = ?, time = ?, location = ?, event_type = ?, max_attendees = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, description, date, time, location, event_type, max_attendees || null, req.params.eventId]
    );

    res.json({
      success: true,
      message: 'Event updated successfully'
    });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to update event'
    });
  }
});

// Delete event (host only)
router.delete('/:eventId', authMiddleware, async (req, res) => {
  try {
    const event = await get('SELECT host_id FROM events WHERE id = ?', [req.params.eventId]);

    if (!event) {
      return res.status(404).json({
        error: true,
        message: 'Event not found'
      });
    }

    if (event.host_id !== req.user.userId) {
      return res.status(403).json({
        error: true,
        message: 'Only host can delete event'
      });
    }

    await run('DELETE FROM events WHERE id = ?', [req.params.eventId]);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to delete event'
    });
  }
});

// Invite users to event (host only)
router.post('/:eventId/invite', authMiddleware, async (req, res) => {
  try {
    const event = await get('SELECT host_id FROM events WHERE id = ?', [req.params.eventId]);

    if (!event) {
      return res.status(404).json({
        error: true,
        message: 'Event not found'
      });
    }

    if (event.host_id !== req.user.userId) {
      return res.status(403).json({
        error: true,
        message: 'Only host can invite users'
      });
    }

    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Invalid user IDs'
      });
    }

    for (const userId of userIds) {
      try {
        await run(
          `INSERT INTO event_attendees (id, event_id, user_id, rsvp_status)
           VALUES (?, ?, ?, ?)`,
          ['ea_' + Date.now() + Math.random(), req.params.eventId, userId, 'pending']
        );
      } catch (e) {
        // User already invited or doesn't exist, skip
      }
    }

    res.json({
      success: true,
      message: 'Invites sent successfully'
    });
  } catch (err) {
    console.error('Error inviting users:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to invite users'
    });
  }
});

// Update RSVP status
router.patch('/:eventId/rsvp', authMiddleware, async (req, res) => {
  try {
    const { rsvp_status } = req.body;

    if (!['pending', 'accepted', 'declined', 'interested'].includes(rsvp_status)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid RSVP status'
      });
    }

    const attendee = await get(
      `SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?`,
      [req.params.eventId, req.user.userId]
    );

    if (!attendee) {
      // Create new attendee entry if not already invited
      await run(
        `INSERT INTO event_attendees (id, event_id, user_id, rsvp_status, responded_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        ['ea_' + Date.now(), req.params.eventId, req.user.userId, rsvp_status]
      );
    } else {
      // Update existing RSVP
      await run(
        `UPDATE event_attendees SET rsvp_status = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [rsvp_status, attendee.id]
      );
    }

    res.json({
      success: true,
      message: 'RSVP updated successfully'
    });
  } catch (err) {
    console.error('Error updating RSVP:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to update RSVP'
    });
  }
});

// Approve/reject attendee (host only)
router.patch('/:eventId/attendees/:attendeeId', authMiddleware, async (req, res) => {
  try {
    const event = await get('SELECT host_id FROM events WHERE id = ?', [req.params.eventId]);

    if (!event) {
      return res.status(404).json({
        error: true,
        message: 'Event not found'
      });
    }

    if (event.host_id !== req.user.userId) {
      return res.status(403).json({
        error: true,
        message: 'Only host can manage attendees'
      });
    }

    const { action } = req.body; // 'accept' or 'reject'

    if (action === 'accept') {
      await run(
        `UPDATE event_attendees SET rsvp_status = ? WHERE id = ? AND event_id = ?`,
        ['accepted', req.params.attendeeId, req.params.eventId]
      );
    } else if (action === 'reject') {
      await run(
        `DELETE FROM event_attendees WHERE id = ? AND event_id = ?`,
        [req.params.attendeeId, req.params.eventId]
      );
    } else {
      return res.status(400).json({
        error: true,
        message: 'Invalid action'
      });
    }

    res.json({
      success: true,
      message: 'Attendee updated successfully'
    });
  } catch (err) {
    console.error('Error managing attendee:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to manage attendee'
    });
  }
});

// Get events hosted by user
router.get('/hosted/all', authMiddleware, async (req, res) => {
  try {
    const events = await all(
      `SELECT 
        e.*,
        COUNT(DISTINCT CASE WHEN ea.rsvp_status = 'accepted' THEN ea.user_id END) as attendee_count
       FROM events e
       LEFT JOIN event_attendees ea ON e.id = ea.event_id
       WHERE e.host_id = ?
       GROUP BY e.id
       ORDER BY e.date ASC`,
      [req.user.userId]
    );

    res.json({
      success: true,
      events
    });
  } catch (err) {
    console.error('Error fetching hosted events:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch hosted events'
    });
  }
});

module.exports = router;
