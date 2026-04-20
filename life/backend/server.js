const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const socialRoutes = require('./routes/social');
const socialMediaRoutes = require('./routes/social-media');
const facialRoutes = require('./routes/facial');
const eventRoutes = require('./routes/events');
const storiesRoutes = require('./routes/stories');
const streamsRoutes = require('./routes/streams');
const socketHelper = require('./socket');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/social', socialMediaRoutes);
app.use('/api/facial', facialRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/streams', streamsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Handle SPA routing - serve index.html for all unmatched routes
app.get('/:page(*)', (req, res) => {
  const pageFile = path.join(__dirname, '../frontend', req.params.page + '.html');
  res.sendFile(pageFile, (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Not found',
    path: req.path
  });
});

// Initialize database
db.initialize().then(() => {
  // Create HTTP server and attach Socket.IO
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // Initialize socket helper so routes can access the IO instance at runtime
  socketHelper.init(io);

  const { verifyToken } = require('./config/auth');

  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error('Authentication error'));
    }
    socket.user = { userId: payload.userId, isAdmin: payload.isAdmin };
    next();
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id, 'user:', socket.user && socket.user.userId);

    socket.on('join_room', ({ room, userId }) => {
      if (room) socket.join(room);
    });

    socket.on('leave_room', ({ room }) => {
      if (room) socket.leave(room);
    });

    socket.on('signal', ({ room, data }) => {
      if (room) socket.to(room).emit('signal', { from: socket.id, data });
    });

    socket.on('start_call', ({ room, callId, isVideo }) => {
      if (room) socket.to(room).emit('call_started', { callId, isVideo, by: socket.id, room });
    });

    socket.on('end_call', ({ room, callId }) => {
      if (room) socket.to(room).emit('call_ended', { callId });
    });
  });

  // Start server
  httpServer.listen(PORT, HOST, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║        🌿 LIFE SERVER STARTED 🌿              ║
║                                                ║
║  Server: http://${HOST}:${PORT}
║  Environment: ${process.env.NODE_ENV || 'development'}
║  Database: SQLite (${process.env.DB_PATH || 'data/life.db'})
║                                                ║
║  API Documentation:                           ║
║  - GET  /api/health                           ║
║  - POST /api/auth/register                    ║
║  - POST /api/auth/login                       ║
║  - GET  /api/users/:id                        ║
║  - GET  /api/notifications                    ║
║  - GET  /api/messages                         ║
║  - GET  /api/products                         ║
║                                                ║
║  Press Ctrl+C to stop                         ║
║                                                ║
╚════════════════════════════════════════════════╝
    `);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
