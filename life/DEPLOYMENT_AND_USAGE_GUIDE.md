# 🚀 Life Application - Deployment & Usage Guide

**Life Application v2.0.0** | Full-stack social platform with financial tracking, events, stories, and live streaming

---

## ⚡ Quick Start (5 Minutes)

### Prerequisites
- **Node.js** v14+ ([Download](https://nodejs.org/))
- **npm** v6+ (included with Node.js)
- **Port 3000** available

Verify:
```bash
node --version
npm --version
```

### Setup & Run

**Step 1:** Navigate to backend
```bash
cd backend
```

**Step 2:** Install dependencies (first time only)
```bash
npm install
```

**Step 3:** Create environment file
```bash
cp .env.example .env
```

**Step 4:** Start server
```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════════════════════════════════╗
║                    Life Application Server                            ║
║                    Running on http://localhost:3000                  ║
║                    Environment: development                           ║
║════════════════════════════════════════════════════════════════════════╝
```

**Step 5:** Open in browser
- Visit: **http://localhost:3000**
- Sign up for an account
- ✅ Done!

---

## 📁 Project Structure

```
life/
├── frontend/                # Web interface
│   ├── index.html          # Main dashboard
│   ├── profile.html        # User profile
│   ├── signinorup.html     # Login/signup
│   ├── settings.html       # User settings
│   ├── shop.html           # Product shop
│   ├── about.html          # About page
│   ├── app.js              # Frontend app methods
│   ├── styles.css          # Styling
│   └── [other assets]
│
├── backend/                # Node.js/Express API
│   ├── server.js           # Main server
│   ├── package.json        # Dependencies
│   ├── .env.example        # Config template
│   ├── config/
│   │   ├── database.js     # SQLite schema
│   │   ├── auth.js         # JWT auth
│   │   └── [other config]
│   ├── routes/             # API endpoints
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── messages.js
│   │   ├── notifications.js
│   │   ├── products.js
│   │   ├── events.js
│   │   ├── stories.js
│   │   ├── streams.js
│   │   ├── admin.js
│   │   ├── social.js
│   │   └── [other routes]
│   └── [other files]
│
└── documentation/          # Guides and docs
```

---

## ✨ Features

### 👤 User Profile & Authentication
- JWT-based secure login
- User profiles with avatar, bio, location
- Account settings and preferences
- Password management

### 💰 Financial Tracking
- Income/expense management
- Transaction list with search, filter, sort
- Dual view modes (table & card)
- Financial analytics

### 📅 Event Management
- Create public/private events
- Host-controlled invitations
- RSVP tracking
- Event details and attendee management
- Event discovery and browsing

### 📸 Stories
- Post ephemeral stories (24-hour expiration)
- Media support (image/video)
- View tracking and analytics
- Emoji reactions
- Automatic expiration

### 🔴 Live Streaming
- Go live to followers
- Scheduled streaming
- Real-time viewer count
- Live chat comments
- Gift/donation system
- Stream replays

### 💬 Messaging & Notifications
- 1-to-1 messaging
- Group chats
- Real-time notifications
- Unread message tracking
- Read receipts

### 🛍️ Shopping
- Product catalog with categories
- Product search and filtering
- Shopping cart
- Order history

### 👥 Social Features
- Follow/unfollow users
- Social connections
- Social scoring system
- User discovery
- Reputation tracking

### 🔑 Admin System
- Full user management
- Content moderation
- System statistics
- User activation/deactivation

---

## 🔌 Core API Endpoints

### Authentication
```
POST   /api/auth/register              - Create account
POST   /api/auth/login                 - Login
GET    /api/auth/verify                - Verify token
POST   /api/auth/logout                - Logout
```

### Users
```
GET    /api/users/profile              - Get your profile
PUT    /api/users/profile              - Update profile
GET    /api/users                      - List all users
GET    /api/users/:id                  - Get user by ID
POST   /api/users/connect/:userId      - Follow user
```

### Financial
```
GET    /api/transactions               - Get transactions
POST   /api/transactions               - Create transaction
PUT    /api/transactions/:id           - Update transaction
DELETE /api/transactions/:id           - Delete transaction
```

### Events
```
POST   /api/events                     - Create event
GET    /api/events                     - List events
GET    /api/events/:id                 - Event details
PUT    /api/events/:id                 - Update event
DELETE /api/events/:id                 - Delete event
POST   /api/events/:id/invite          - Invite users
POST   /api/events/:id/rsvp            - RSVP to event
GET    /api/events/:id/attendees       - Get attendees
```

### Stories
```
GET    /api/stories/feed               - Get follower stories
GET    /api/stories/user/:userId       - Get user's stories
POST   /api/stories                    - Post story
POST   /api/stories/:id/view           - View story
POST   /api/stories/:id/react          - React to story
DELETE /api/stories/:id                - Delete story
```

### Live Streams
```
GET    /api/streams/live               - Get live streams
GET    /api/streams/broadcasts/recent  - Get replays
POST   /api/streams                    - Start/schedule stream
POST   /api/streams/:id/join           - Join stream
POST   /api/streams/:id/comment        - Add comment
POST   /api/streams/:id/gift           - Send gift
POST   /api/streams/:id/end            - End stream
```

### Messages
```
GET    /api/messages/conversations     - List conversations
POST   /api/messages/conversation/:userId - Start conversation
POST   /api/messages/send              - Send message
GET    /api/messages/count/unread      - Unread count
```

### Notifications
```
GET    /api/notifications              - Get notifications
GET    /api/notifications/count/unread - Unread count
PUT    /api/notifications/:id/read     - Mark as read
DELETE /api/notifications/:id          - Delete notification
```

### Products
```
GET    /api/products                   - List products
GET    /api/products/:id               - Product details
GET    /api/products/category/:cat     - By category
POST   /api/products                   - Create product
PUT    /api/products/:id               - Update product
DELETE /api/products/:id               - Delete product
```

### Admin
```
GET    /api/admin/users                - List all users
GET    /api/admin/users/:id            - User details
PUT    /api/admin/users/:id            - Edit user
DELETE /api/admin/users/:id            - Delete user
POST   /api/admin/users/:id/make-admin - Promote to admin
POST   /api/admin/create-user          - Create user
```

---

## 🔑 Admin Setup

### Create Admin Account

**Step 1:** Start backend (if not running)
```bash
npm start
```

**Step 2:** In a new terminal, initialize admin
```bash
cd backend
npm run setup-admin
```

You'll see:
```
✓ Admin user created successfully!

📋 Admin Account Details:
─────────────────────
Email:    admin@life.local
Username: administrator
Password: ChangeMe123!
```

**Step 3:** Login as admin
1. Go to: http://localhost:3000/signinorup.html
2. Click **Login**
3. Email: `admin@life.local`
4. Password: `ChangeMe123!`

### What Admin Can Do
- View all user accounts
- Edit any user profile
- Reset user passwords
- Delete accounts
- Promote/demote admins
- View all content
- Manage products
- System statistics

---

## 🧪 Testing Features

### Create an Account
1. Click **Sign Up**
2. Enter username, email, password
3. Click **Sign Up**
4. You're logged in!

### Test Each Section
- **Dashboard** - Overview of your data
- **Profile** - View/edit your profile
- **Events** - Create and find events
- **Shop** - Browse products
- **Messages** - Chat with others (top right)
- **Stories** - Post or view stories
- **Live** - Stream to your followers
- **Settings** - Manage preferences

### Create Test Data
```bash
# Generate demo users with sample data
npm run seed-demo-data
```

---

## 🛠️ Common Commands

### Start Server
```bash
cd backend
npm start              # Production mode
npm run dev           # Development with auto-reload
```

### Database
```bash
npm run reset-db      # Delete all data, recreate fresh
npm run backup-db     # Create backup with timestamp
npm run seed-demo-data # Create sample data
```

### Testing
```bash
npm run health-check  # Verify server running
curl http://localhost:3000/api/health
```

### Admin
```bash
npm run setup-admin   # Create admin account
```

---

## 🚨 Troubleshooting

### Port 3000 Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID [PID] /F

# Or use different port in .env
PORT=3001
```

### Database Errors
```bash
# Reset database and start fresh
npm run reset-db
npm start
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
npm start
```

### CORS or Authentication Errors
1. Check `.env` file exists and is configured
2. Verify `JWT_SECRET` is set
3. Restart server: `npm start`

### Server Won't Start
1. Check Node.js version: `node --version` (need v14+)
2. Check port availability: `netstat -ano | findstr :3000`
3. Check logs for specific error messages
4. Try `npm install` again

---

## 📊 Environment Configuration

### .env File Template
Create `.env` in backend folder:

```
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d
DB_PATH=./database.sqlite
ADMIN_EMAIL=admin@life.local
ADMIN_USERNAME=administrator
ADMIN_PASSWORD=ChangeMe123!
```

**Generate strong JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📦 Deployment Checklist

- [ ] Node.js v14+ installed
- [ ] Dependencies installed: `npm install`
- [ ] `.env` file created and configured
- [ ] JWT_SECRET generated and set
- [ ] Database initialized (automatic on first run)
- [ ] Admin account created: `npm run setup-admin`
- [ ] Server starts: `npm start`
- [ ] Browser loads: http://localhost:3000
- [ ] Can login with test account
- [ ] Can access main features

---

## 🎯 Next Steps

1. **Customize** - Edit frontend/styles.css for your branding
2. **Add Users** - Create accounts or use signup
3. **Explore Features** - Try each section
4. **Read API Docs** - Full endpoint documentation in code comments
5. **Extend** - Add new features by creating new routes

---

## 📞 Help

If issues occur:
1. Check error message in terminal
2. Review troubleshooting section above
3. Check `.env` configuration
4. Try `npm install` then `npm start`
5. Look at backend/config/database.js for schema info

---

**Version:** 2.0.0 | **Last Updated:** April 2026 | **Status:** Production Ready ✅
