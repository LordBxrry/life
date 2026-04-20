const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || 'data/life.db';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('✓ Database connection established');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisified database operations
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Initialize database tables
const initialize = async () => {
  try {
    // Users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        bio TEXT,
        avatar_url TEXT,
        location TEXT,
        role TEXT DEFAULT 'user',
        is_admin BOOLEAN DEFAULT 0,
        account_active BOOLEAN DEFAULT 1,
        social_score INTEGER DEFAULT 0,
        upvotes_count INTEGER DEFAULT 0,
        downvotes_count INTEGER DEFAULT 0,
        activity_level INTEGER DEFAULT 0,
        facial_recognition_enabled BOOLEAN DEFAULT 0,
        facial_descriptor TEXT,
        facial_data_hash TEXT,
        facial_setup_date DATETIME,
        last_facial_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    // Add columns to existing table if needed (migration)
    try {
      await run('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"');
    } catch (e) { /* Column might already exist */ }
    try {
      await run('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0');
    } catch (e) { /* Column might already exist */ }
    try {
      await run('ALTER TABLE users ADD COLUMN account_active BOOLEAN DEFAULT 1');
    } catch (e) { /* Column might already exist */ }
    try {
      await run('ALTER TABLE users ADD COLUMN social_score INTEGER DEFAULT 0');
    } catch (e) { /* Column might already exist */ }
    try {
      await run('ALTER TABLE users ADD COLUMN upvotes_count INTEGER DEFAULT 0');
    } catch (e) { /* Column might already exist */ }
    try {
      await run('ALTER TABLE users ADD COLUMN downvotes_count INTEGER DEFAULT 0');
    } catch (e) { /* Column might already exist */ }
    try {
      await run('ALTER TABLE users ADD COLUMN activity_level INTEGER DEFAULT 0');
    } catch (e) { /* Column might already exist */ }
    try {
      await run('ALTER TABLE users ADD COLUMN facial_recognition_enabled BOOLEAN DEFAULT 0');
    } catch (e) { /* Column might already exist */ }
    try {
      await run('ALTER TABLE users ADD COLUMN facial_descriptor TEXT');
    } catch (e) { /* Column might already exist */ }
    try {
      await run('ALTER TABLE users ADD COLUMN facial_data_hash TEXT');
    } catch (e) { /* Column might already exist */ }
    try {
      await run('ALTER TABLE users ADD COLUMN facial_setup_date DATETIME');
    } catch (e) { /* Column might already exist */ }
    try {
      await run('ALTER TABLE users ADD COLUMN last_facial_login DATETIME');
    } catch (e) { /* Column might already exist */ }

    // User sessions table
    await run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Notifications table
    await run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT 0,
        link_to TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Conversations table
    await run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id_1 TEXT NOT NULL,
        user_id_2 TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id_1) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id_2) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Messages table
    await run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        recipient_id TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Products table
    await run(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT,
        image_url TEXT,
        provider_id TEXT NOT NULL,
        rating REAL DEFAULT 0,
        reviews_count INTEGER DEFAULT 0,
        available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Connections table (user relationships)
    await run(`
      CREATE TABLE IF NOT EXISTS connections (
        id TEXT PRIMARY KEY,
        user_id_1 TEXT NOT NULL,
        user_id_2 TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id_1, user_id_2),
        FOREIGN KEY (user_id_1) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id_2) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Activity logs table
    await run(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        description TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // User ratings/votes table - for social scoring
    await run(`
      CREATE TABLE IF NOT EXISTS user_ratings (
        id TEXT PRIMARY KEY,
        rater_id TEXT NOT NULL,
        rated_user_id TEXT NOT NULL,
        vote_type TEXT NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(rater_id, rated_user_id),
        FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (rated_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Activity tracking for social score
    await run(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        points_earned INTEGER DEFAULT 0,
        description TEXT,
        reference_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Social media connections
    await run(`
      CREATE TABLE IF NOT EXISTS social_connections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        username TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at DATETIME,
        connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_sync DATETIME,
        disconnected_at DATETIME,
        active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, platform)
      )
    `);

    // Groups table (for group messaging)
    await run(`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Group members
    await run(`
      CREATE TABLE IF NOT EXISTS group_members (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Group messages
    await run(`
      CREATE TABLE IF NOT EXISTS group_messages (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Events table
    await run(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        host_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        location TEXT NOT NULL,
        event_type TEXT CHECK(event_type IN ('public', 'private')) DEFAULT 'public',
        max_attendees INTEGER,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Event attendees table
    await run(`
      CREATE TABLE IF NOT EXISTS event_attendees (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rsvp_status TEXT CHECK(rsvp_status IN ('pending', 'accepted', 'declined', 'interested')) DEFAULT 'pending',
        invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        responded_at DATETIME,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(event_id, user_id)
      )
    `);

    // Stories table (short-form content with 24h expiration)
    await run(`
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        media_url TEXT NOT NULL,
        media_type TEXT CHECK(media_type IN ('image', 'video')) DEFAULT 'image',
        caption TEXT,
        duration INTEGER DEFAULT 5,
        view_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Story views tracking
    await run(`
      CREATE TABLE IF NOT EXISTS story_views (
        id TEXT PRIMARY KEY,
        story_id TEXT NOT NULL,
        viewer_id TEXT NOT NULL,
        viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
        FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(story_id, viewer_id)
      )
    `);

    // Story reactions (hearts, emojis, etc.)
    await run(`
      CREATE TABLE IF NOT EXISTS story_reactions (
        id TEXT PRIMARY KEY,
        story_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        reaction TEXT DEFAULT '❤️',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(story_id, user_id)
      )
    `);

    // Live streams table
    await run(`
      CREATE TABLE IF NOT EXISTS live_streams (
        id TEXT PRIMARY KEY,
        broadcaster_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        stream_url TEXT,
        thumbnail_url TEXT,
        status TEXT CHECK(status IN ('live', 'ended', 'scheduled')) DEFAULT 'scheduled',
        viewer_count INTEGER DEFAULT 0,
        max_viewers INTEGER DEFAULT 0,
        started_at DATETIME,
        ended_at DATETIME,
        scheduled_for DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (broadcaster_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Live stream viewers
    await run(`
      CREATE TABLE IF NOT EXISTS stream_viewers (
        id TEXT PRIMARY KEY,
        stream_id TEXT NOT NULL,
        viewer_id TEXT NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        left_at DATETIME,
        watch_duration INTEGER DEFAULT 0,
        FOREIGN KEY (stream_id) REFERENCES live_streams(id) ON DELETE CASCADE,
        FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Live stream comments
    await run(`
      CREATE TABLE IF NOT EXISTS stream_comments (
        id TEXT PRIMARY KEY,
        stream_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        comment TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (stream_id) REFERENCES live_streams(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Live stream gifts/donations (for monetization)
    await run(`
      CREATE TABLE IF NOT EXISTS stream_gifts (
        id TEXT PRIMARY KEY,
        stream_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        gift_name TEXT NOT NULL,
        gift_value REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (stream_id) REFERENCES live_streams(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✓ Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
};

module.exports = {
  db,
  run,
  get,
  all,
  initialize,
  DB_PATH
};
