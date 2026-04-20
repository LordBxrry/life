# Architecture & System Overview

Visual guide to how all components of the Life application work together.

---

## 🏗️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER'S HOME SERVER                         │
│                    (localhost:3000)                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│   FRONTEND (Browser)     │         │   BACKEND (Node.js)      │
│                          │         │                          │
│  HTML Pages:             │         │  Express Server:         │
│  • index.html            │         │  • Port 3000             │
│  • profile.html          │────────▶│  • 5 Route Files         │
│  • shop.html             │ HTTP    │  • JWT Auth              │
│  • settings.html         │ Requests│  • CORS Enabled          │
│  • about.html            │◀────────│  • Static File Serving   │
│  • signinorup.html       │ JSON    │                          │
│                          │ Response│                          │
│  JavaScript:             │         │  Database:               │
│  • app.js (localStorage) │         │  • SQLite3               │
│  • app-backend.js (API)  │         │  • 8 Tables              │
│  • api-client.js         │         │  • data/life.db          │
│                          │         │                          │
│  Styling:                │         │  Configuration:          │
│  • styles.css            │         │  • .env file             │
│  • CSS Variables         │         │  • JWT_SECRET            │
│  • Responsive Design     │         │  • Database path         │
└──────────────────────────┘         └──────────────────────────┘
```

---

## 🔄 Request/Response Flow

### Example: User Login Flow

```
1. User enters credentials in signinorup.html
   │
   ├──► Submit form
   │
2. Frontend JavaScript captures input
   │
   ├──► POST /api/auth/login
   │    with {email, password}
   │
3. Express server receives request
   │
   ├──► auth.js route handler
   │
4. Validate and hash password
   │
   ├──► Compare with bcrypt
   ├──► Check in users table
   │
5. Generate JWT token
   │
   ├──► jwt-simple signs token
   │
6. Server responds
   │
   └──► {success: true, token: "...", user: {...}}
        │
7. Frontend stores token
   │
   ├──► localStorage.setItem('authToken', token)
   │
8. Redirect to dashboard
   │
   └──► window.location.href = 'index.html'
```

---

## 📊 Database Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA                          │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │    USERS     │
    ├──────────────┤
    │ id (PK)      │◄─────────┐
    │ username     │          │
    │ email        │          │
    │ password_hash│          │
    │ full_name    │          │
    │ bio          │          │
    │ avatar_url   │          │
    │ location     │          │
    │ created_at   │          │
    │ updated_at   │          │
    │ last_login   │          │
    └──────────────┘          │
           │                  │
           │ 1:N              │
           ├──────────────────┼──────────────────┐
           │                  │                  │
    ┌──────┴──────┐    ┌──────┴──────┐    ┌─────┴─────┐
    │SESSIONS     │    │NOTIFICATIONS│    │ CONNECTIONS
    ├─────────────┤    ├─────────────┤    ├────────────┤
    │ id (PK)     │    │ id (PK)     │    │ id (PK)    │
    │ user_id (FK)│    │ user_id(FK) │    │ user_1 (FK)│
    │ token       │    │ type        │    │ user_2 (FK)│
    │ expires_at  │    │ message     │    │ status     │
    │ created_at  │    │ read        │    │ created_at │
    └─────────────┘    │ created_at  │    └────────────┘
                       └─────────────┘

    ┌──────────────┐         ┌──────────────┐
    │CONVERSATIONS │◄────────┤   MESSAGES   │
    ├──────────────┤  1:N    ├──────────────┤
    │ id (PK)      │         │ id (PK)      │
    │ user_1_id(FK)├─────────┤ convo_id(FK) │
    │ user_2_id(FK)│         │ sender_id(FK)│
    │ created_at   │         │ content      │
    │ updated_at   │         │ created_at   │
    └──────────────┘         └──────────────┘
           ▲                         ▲
           │                         │ (sender)
           └─────────────────────────┘ (USERS)

    ┌──────────────┐      ┌──────────────┐
    │   PRODUCTS   │      │ ACTIVITY_LOGS│
    ├──────────────┤      ├──────────────┤
    │ id (PK)      │      │ id (PK)      │
    │ name         │      │ user_id(FK)  │
    │ description  │      │ action       │
    │ category     │      │ resource     │
    │ price        │      │ created_at   │
    │ image_url    │      └──────────────┘
    │ provider_id●─┼──────→ USERS.id
    │ available    │
    │ created_at   │
    └──────────────┘

Legend:
  PK = Primary Key (unique identifier)
  FK = Foreign Key (reference to other table)
  ● = Foreign key reference
  ┌─► = One-to-Many relationship
```

---

## 🌊 Data Flow: Complete User Session

```
START
  │
  ├─► User visits http://localhost:3000
  │
  ├─► Browser loads index.html
  │   │
  │   ├─► Load styles.css (styling)
  │   ├─► Load app-backend.js (app logic)
  │   └─► Parse HTML structure
  │
  ├─► Check localStorage for authToken
  │   │
  │   ├─ NO TOKEN? ──► Redirect to signinorup.html
  │   │               (User must login first)
  │   │
  │   └─ HAS TOKEN? ──► Verify with backend
  │                    GET /api/auth/verify
  │                    │
  │                    ├─ VALID? ──► Load dashboard
  │                    └─ INVALID?──► Clear token, redirect to login
  │
  ├─► Fetch user data
  │   │
  │   ├─► GET /api/users/profile
  │   │   │
  │   │   ├─► Backend queries users table
  │   │   │
  │   │   └─► Returns {username, bio, location, ...}
  │   │
  │   └─► Store in localStorage + update UI
  │
  ├─► Fetch notifications
  │   │
  │   ├─► GET /api/notifications
  │   │   │
  │   │   ├─► Backend queries notifications table
  │   │   │   WHERE user_id = ? AND unread = true
  │   │   │
  │   │   └─► Returns array of notifications
  │   │
  │   └─► Display in notification panel
  │
  ├─► Fetch conversations
  │   │
  │   ├─► GET /api/messages/conversations
  │   │   │
  │   │   ├─► Backend queries conversations table
  │   │   │   WHERE user_1_id = ? OR user_2_id = ?
  │   │   │
  │   │   └─► Returns active conversations
  │   │
  │   └─► Display in messaging panel
  │
  ├─► Fetch products (if on shop page)
  │   │
  │   ├─► GET /api/products?limit=50
  │   │   │
  │   │   ├─► Backend queries products table
  │   │   │
  │   │   └─► Returns product list
  │   │
  │   └─► Render in product grid
  │
  ├─► User sends message
  │   │
  │   ├─► POST /api/messages/send
  │   │   body: {conversation_id, content}
  │   │   │
  │   │   ├─► Backend inserts into messages table
  │   │   │
  │   │   └─► Returns {success, message_id}
  │   │
  │   └─► Update UI with new message
  │
  ├─► User creates notification
  │   │
  │   ├─► POST /api/notifications
  │   │   body: {type, message}
  │   │   │
  │   │   ├─► Backend inserts into notifications table
  │   │   │
  │   │   └─► Returns {success, notification}
  │   │
  │   └─► Show toast notification
  │
  ├─► User updates profile
  │   │
  │   ├─► PUT /api/users/profile
  │   │   body: {username, bio, location, ...}
  │   │   │
  │   │   ├─► Backend updates users table
  │   │   │   WHERE id = ?
  │   │   │
  │   │   └─► Returns {success, updated_user}
  │   │
  │   └─► Refresh profile display
  │
  ├─► User logs out
  │   │
  │   ├─► POST /api/auth/logout
  │   │   │
  │   │   ├─► Backend clears session
  │   │   │
  │   │   └─► Returns {success}
  │   │
  │   ├─► Frontend clears localStorage
  │   │
  │   └─► Redirect to signinorup.html
  │
END
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│              AUTHENTICATION LIFECYCLE                       │
└─────────────────────────────────────────────────────────────┘

SIGNUP / LOGIN
    │
    ├─► User submits credentials
    │
    ├─► Frontend: POST /api/auth/register or /api/auth/login
    │
    ├─► Backend receives request
    │   │
    │   ├─► Express middleware parses JSON body
    │   │
    │   ├─► auth.js route handler processes request
    │   │   │
    │   │   ├─ For REGISTER:
    │   │   │  ├─► Validate input
    │   │   │  ├─► Check email not exists
    │   │   │  ├─► bcryptjs.hash(password, 10)
    │   │   │  ├─► Insert into users table
    │   │   │  └─► Generate JWT token
    │   │   │
    │   │   ├─ For LOGIN:
    │   │   │  ├─► Find user by email
    │   │   │  ├─► bcryptjs.compare(password, hash)
    │   │   │  ├─► Generate JWT token
    │   │   │  └─► Update last_login timestamp
    │   │   │
    │   ├─► Return token + user data
    │   │
    ├─► Frontend stores token
    │   │
    │   ├─► localStorage.setItem('authToken', token)
    │   ├─► localStorage.setItem('userId', user.id)
    │   ├─► localStorage.setItem('userName', user.username)
    │
    ├─► Frontend includes token in Authorization header
    │   │
    │   ├─► Authorization: Bearer <token>
    │
PROTECTED REQUESTS
    │
    ├─► Frontend: GET /api/users/profile (with token)
    │
    ├─► Backend receives request with Authorization header
    │   │
    │   ├─► Express middleware checks Authorization header
    │   │
    │   ├─► auth.js authMiddleware()
    │   │   │
    │   │   ├─► Extract token from header
    │   │   │
    │   │   ├─► jwt-simple.decode(token, JWT_SECRET)
    │   │   │
    │   │   ├─ VALID? ──► Attach user.id to request
    │   │   │              Continue to route handler
    │   │   │
    │   │   └─ INVALID/EXPIRED? ──► Return 401 Unauthorized
    │   │                          (Frontend clears token, redirects)
    │   │
    │   ├─► Route handler accesses request.user.id
    │   │
    │   ├─► Query database for this user
    │   │
    │   └─► Return user data
    │
    ├─► Frontend receives data
    │   │
    │   ├─ 401 received? ──► Clear localStorage
    │   │                   Redirect to login
    │   │
    │   └─ 200 received? ──► Update UI with data
    │
LOGOUT
    │
    ├─► User clicks logout button
    │
    ├─► Frontend: POST /api/auth/logout (with token)
    │
    ├─► Backend processes logout
    │   │
    │   ├─► (Optional) Invalidate session in database
    │   │
    │   └─► Return success
    │
    ├─► Frontend clears localStorage
    │   │
    │   ├─► localStorage.removeItem('authToken')
    │   ├─► localStorage.removeItem('userId')
    │   ├─► localStorage.removeItem('userName')
    │
    ├─► Redirect to login page
    │
    └─► User session terminated
```

---

## 🔄 Message Flow: Sending a Message

```
Step 1: User types message
  │
  ├─► Text entered in messaging-input

Step 2: User clicks Send button
  │
  ├─► onclick="App.sendMessage(this.value)"

Step 3: Frontend prepares request
  │
  ├─► Message content validated
  ├─► API endpoint: POST /api/messages/send
  ├─► Request body:
  │   {
  │     "conversation_id": "conv_123",
  │     "content": "Hello!"
  │   }
  ├─► Headers include: Authorization: Bearer <token>

Step 4: Request travels to backend
  │
  ├─► Express server receives POST request
  │
  ├─► Middleware chain:
  │   ├─► Express.json() parses body
  │   ├─► CORS middleware checks origin
  │   ├─► authMiddleware validates token
  │   └─► Route handler: messages.js

Step 5: Backend processes message
  │
  ├─► messages.js route handler
  │
  ├─► Validate conversation exists
  │
  ├─► Verify user is participant
  │
  ├─► Insert into messages table:
  │   {
  │     id: uuid(),
  │     conversation_id: "conv_123",
  │     sender_id: "user_456",
  │     content: "Hello!",
  │     created_at: NOW()
  │   }
  │
  ├─► Update conversations.updated_at timestamp
  │
  ├─► Return response:
  │   {
  │     "success": true,
  │     "message": {...},
  │     "timestamp": "2024-01-15T10:30:00Z"
  │   }

Step 6: Response returns to frontend
  │
  ├─► Frontend receives 200 OK

Step 7: Frontend updates UI
  │
  ├─► Add message to conversation view
  ├─► Clear input field
  ├─► Show success toast
  ├─► Update last_message in conversation preview
  ├─► Update conversation.updated_at timestamp

Step 8: Complete
  │
  └─► Message visible to user immediately
      (Other user sees it next time they refresh)
```

---

## 📁 File Include Dependency Tree

```
index.html (and all other HTML pages)
    │
    ├─► styles.css
    │   └─► CSS Variables (colors, sizes)
    │       └─► Font Awesome CDN
    │
    ├─► app-backend.js (or app.js for offline)
    │   │
    │   ├─► Depends on: API_BASE_URL = http://localhost:3000/api
    │   │
    │   ├─► At init: App.init()
    │   │   ├─► setupHeader()
    │   │   ├─► setupNavigation()
    │   │   ├─► setupNotifications()
    │   │   ├─► setupMessaging()
    │   │   └─► (if logged in) syncUserData()
    │   │
    │   └─► Event listeners on buttons/inputs
    │
    └─► (Optional) api-client.js
        └─► Provides APIClient class for API calls
            └─► Makes fetch() requests to backend
```

---

## 🚀 Startup Sequence

```
User runs: npm start
    │
    ├─► Reads backend/server.js
    │
    ├─► Check if .env exists
    │   │
    │   ├─ YES? ──► Load environment variables (dotenv)
    │   └─ NO?  ──► Use defaults (PORT 3000, HOST localhost)
    │
    ├─► Import all modules
    │   ├─► express
    │   ├─► cors
    │   ├─► body-parser
    │   ├─► database config
    │   ├─► auth config
    │   └─► all route files
    │
    ├─► Initialize database
    │   │
    │   ├─► database.js initialize()
    │   │
    │   ├─ CREATE TABLE IF NOT EXISTS users
    │   ├─ CREATE TABLE IF NOT EXISTS sessions
    │   ├─ CREATE TABLE IF NOT EXISTS notifications
    │   ├─ CREATE TABLE IF NOT EXISTS conversations
    │   ├─ CREATE TABLE IF NOT EXISTS messages
    │   ├─ CREATE TABLE IF NOT EXISTS products
    │   ├─ CREATE TABLE IF NOT EXISTS connections
    │   └─ CREATE TABLE IF NOT EXISTS activity_logs
    │
    ├─► Configure Express app
    │   │
    │   ├─► app.use(cors())
    │   ├─► app.use(bodyParser.json())
    │   ├─► app.use(express.static('frontend')) ◄─── Serve HTML files
    │   │
    │   ├─► Mount route routers
    │   │   ├─► /api/auth/*  ──► auth.js
    │   │   ├─► /api/users/* ──► users.js
    │   │   ├─► /api/notifications/* ──► notifications.js
    │   │   ├─► /api/messages/* ──► messages.js
    │   │   └─► /api/products/* ──► products.js
    │   │
    │   └─► app.listen(PORT, HOST)
    │
    ├─► Display startup banner
    │   │
    │   ╔════════════════════════════════════════════════════════════════════════╗
    │   ║                    Life Application Server                            ║
    │   ║                    Running on http://localhost:3000                  ║
    │   ║                    Environment: development                           ║
    │   ╚════════════════════════════════════════════════════════════════════════╝
    │
    ├─► Accept connections
    │   │
    │   ├─ Browser connects to http://localhost:3000
    │   ├─ Server serves index.html (via express.static)
    │   ├─ Browser loads HTML + CSS + JS
    │   ├─ JavaScript checks for auth token
    │   ├─ If no token, shows login page
    │   ├─ If token valid, shows dashboard
    │   │
    │   └─► Ready for user interaction!
    │
    Server running... (Press Ctrl+C to stop)
```

---

## 🔌 Integration Points

### Frontend ↔ Backend Integration
```
Frontend                          Backend
(Browser)                        (Node.js)
    │                               │
    ├─ HTTP Request ────────────────►
    │  (GET, POST, PUT, DELETE)
    │  Headers: Authorization
    │  Body: JSON data
    │
    │◄─ HTTP Response ───────────────
    │  Status: 200, 401, 404, etc.
    │  Body: JSON response
    │
    └─ Data Flow
       ├─► Request validation
       ├─► Database query
       ├─► Response generation
       └─► Client updates UI
```

### Database ↔ Backend Integration
```
Backend                          Database
(Node.js)                        (SQLite)
    │                               │
    ├─ SQL Query ──────────────────►
    │  (SELECT, INSERT, UPDATE, DELETE)
    │  on tables (users, messages, etc.)
    │
    │◄─ Result Set ◄─────────────────
    │  (Rows of data)
    │
    └─ Data Flow
       ├─► Parse results
       ├─► Format as JSON
       └─► Send to client
```

---

## 📊 Component Interaction Map

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                      │
└─────────────────────────────────────────────────────────────┘

header
├─ Navigation Links
│  ├─► index.html
│  ├─► profile.html
│  ├─► about.html
│  ├─► shop.html
│  ├─► settings.html
│  └─► signinorup.html
│
├─ Notification Panel
│  ├─► Notification List
│  ├─► Clear All Button
│  └─► Badge (unread count)
│
└─ Messaging Panel
   ├─► Conversations List
   ├─► New Message Button
   └─► Badge (unread messages)

main content
├─ Page-specific content
└─ Rendered based on current page

footer
└─ Site information

┌─────────────────────────────────────────────────────────────┐
│                    BACKEND COMPONENTS                       │
└─────────────────────────────────────────────────────────────┘

Express App
├─ Middleware
│  ├─► CORS Middleware
│  ├─► Body Parser Middleware
│  ├─► Auth Middleware
│  └─► Error Handler
│
├─ Route Handlers
│  ├─► auth.js (register, login, verify)
│  ├─► users.js (profile, connections)
│  ├─► notifications.js (crud operations)
│  ├─► messages.js (conversations, messages)
│  └─► products.js (product listing)
│
├─ Utilities
│  ├─► JWT token generation/verification
│  ├─► Password hashing/comparison
│  ├─► ID generation
│  └─► Error handling
│
└─ Database
   ├─► Connection pool
   ├─► Table initialization
   ├─► Query execution
   └─► Transaction handling
```

---

## 🔐 Security Layers

```
REQUEST FLOW WITH SECURITY CHECKS

Browser Request
    │
    ├─ CORS Check
    │  └─► Is origin allowed?
    │
    ├─ Body Parsing
    │  └─► Is JSON valid?
    │
    ├─ Authentication Check (if /api/protected/*)
    │  ├─► Is Authorization header present?
    │  ├─► Is token format valid?
    │  └─► Is token signature valid?
    │
    ├─ Input Validation
    │  ├─► Is username format correct?
    │  ├─► Is email format correct?
    │  └─► Is password meeting requirements?
    │
    ├─ Database Operation
    │  ├─► Check permissions
    │  ├─► Validate foreign keys
    │  └─► Check constraints
    │
    └─► Response to client
         └─► Only include necessary data
```

---

**Architecture Version**: 2.0.0  
**Last Updated**: 2024
