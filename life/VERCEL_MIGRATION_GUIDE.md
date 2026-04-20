# 🚀 Life Application - Vercel Migration Guide

## Overview

This guide explains how to deploy the Life Application to Vercel. The app has been rewritten as a Next.js application with PostgreSQL backend, making it serverless-compatible.

---

## Key Changes from Original

| Aspect | Original | Vercel Version |
|--------|----------|-----------------|
| **Framework** | Express.js monolith | Next.js |
| **Database** | SQLite (local file) | PostgreSQL (cloud) |
| **Frontend Hosting** | Express static files | Vercel static |
| **Backend** | Express server on port 3000 | Vercel Functions (/api routes) |
| **Real-time** | Socket.IO | Planned: Pusher/Firebase alternative* |
| **File Storage** | Local filesystem | Cloud storage (S3, Cloudinary, etc.)* |

*\*Real-time and file storage require additional service integration*

---

## Prerequisites

1. **Vercel Account** ([Sign up free](https://vercel.com/signup))
2. **GitHub Account** (for CI/CD)
3. **PostgreSQL Database** (see options below)
4. **Node.js 18+** (for local development)

---

## Step 1: Set Up PostgreSQL Database

### Option A: Vercel Postgres (Recommended)
```bash
# From your Vercel dashboard:
# 1. Go to Storage > Create Database > Postgres
# 2. Copy the connection string to .env.local
```

### Option B: Other PostgreSQL Providers
- **Neon**: https://neon.tech/ (free tier available)
- **AWS RDS**: https://aws.amazon.com/rds/
- **Supabase**: https://supabase.com/
- **Railway**: https://railway.app/

---

## Step 2: Environment Configuration

Create `.env.local` in the root directory:

```bash
# PostgreSQL Connection String
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT Secret (generate a strong random string)
JWT_SECRET="your-very-secret-key-here-generate-new"

# API Configuration
NEXT_PUBLIC_API_URL="/api"

# Optional: Facial Recognition
FACIAL_RECOGNITION_API_KEY="your-api-key-here"

# Optional: File Storage
NEXT_PUBLIC_UPLOAD_URL=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""
```

Generate a secure JWT_SECRET:
```bash
openssl rand -base64 32
```

---

## Step 3: Local Development

### Install Dependencies
```bash
npm install
```

### Initialize Database
The database schema will auto-initialize on first API request, but you can manually run:

```bash
# Create the database tables
npm run init-db
```

### Run Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

---

## Step 4: Deploy to Vercel

### Option A: Via GitHub (Recommended)
```bash
# 1. Push code to GitHub
git push origin main

# 2. Go to vercel.com and click "New Project"
# 3. Import your GitHub repository
# 4. Add environment variables in Vercel Dashboard
# 5. Click "Deploy"
```

### Option B: Via Vercel CLI
```bash
# 1. Install Vercel CLI (if needed)
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel --prod

# 4. Add environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
# ... repeat for other variables
```

---

## Step 5: Environment Variables in Vercel Dashboard

1. Go to your project settings
2. Click "Environment Variables"
3. Add each variable from your `.env.local`
4. Make sure they're available in **Production** environment
5. Redeploy after adding variables

**Critical Variables:**
- `DATABASE_URL` - PostgreSQL connection string  
- `JWT_SECRET` - Your JWT signing key

---

## Step 6: Verify Deployment

Check that your app is running:

```bash
curl https://your-project.vercel.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "environment": "production"
}
```

---

## API Endpoints

All endpoints use the `/api` prefix:

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user

### Users
- `GET /api/users/[id]` - Get user profile
- `PUT /api/users/[id]` - Update user profile

### Messages
- `GET /api/messages/[conversationId]` - Get messages
- `POST /api/messages/[conversationId]` - Send message

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event

### Stories
- `GET /api/stories` - List stories
- `POST /api/stories` - Create story

### Social Posts
- `GET /api/social/posts` - List posts
- `POST /api/social/posts` - Create post

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications` - Mark as read

---

## Troubleshooting

### Database Connection Errors
```
Error: DATABASE_URL is not set
```
**Solution:** Add `DATABASE_URL` to Vercel environment variables

### JWT Authentication Failures
```
Error: Invalid token
```
**Solution:** Ensure `JWT_SECRET` is set and identical in all deployments

### Function Timeout
```
Error: Function execution exceeded timeout
```
**Solution:** Optimize database queries, use connection pooling

### CORS Errors
Check that API requests include proper headers:
```javascript
fetch('/api/endpoint', {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  }
})
```

---

## Real-Time Features (Socket.IO)

⚠️ **Important:** Vercel Functions don't support long-lived WebSocket connections.

### Migration Options:

**Option 1: Pusher**
- Sign up: https://pusher.com/
- Install: `npm install pusher pusher-js`
- Add environment variables:
  - `PUSHER_APP_ID`
  - `PUSHER_KEY`
  - `PUSHER_SECRET`

**Option 2: Firebase Realtime Database**
- Console: https://console.firebase.google.com/
- Add SDK: `npm install firebase`
- Configure credentials in environment

**Option 3: Ably**
- https://ably.com/
- More Vercel-friendly than Socket.IO

---

## File Uploads

For image/file uploads, use a cloud storage service:

### Option 1: Cloudinary
```bash
npm install next-cloudinary
```

### Option 2: AWS S3
```bash
npm install aws-sdk
```

### Option 3: Vercel Blob Storage
```bash
npm install @vercel/blob
```

---

## Database Maintenance

### Backup Database
```bash
# Using pg_dump (most PostgreSQL providers support this)
pg_dump $DATABASE_URL > backup.sql
```

### Monitor Connections
```javascript
// In API route
import { getPool } from '@/lib/db';
const pool = getPool();
// Pooling handles connection management automatically
```

---

## Performance Optimization

1. **Enable ISR (Incremental Static Regeneration)**
   - Add `revalidate` to pages
   
2. **Optimize Images**
   - Use Next.js Image component
   
3. **Database Indexing**
   - Verify indexes in PostgreSQL
   
4. **API Response Caching**
   - Add cache headers to API routes

---

## Monitoring & Logging

### Vercel Logs
```bash
vercel logs --prod
```

### Database Monitoring
- Use your PostgreSQL provider's dashboard
- Monitor connection count and query performance

---

## Costs Estimate (Monthly)

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Vercel Hosting** | 100GB bandwidth | $20/month |
| **PostgreSQL** | ~1GB (varies) | $5-50/month |
| **File Storage** | None | ~$10/month |

*Most developers can run on free tiers initially*

---

## Next Steps

1. ✅ Deploy to Vercel
2. 🔄 Integrate real-time service (Pusher/Firebase)
3. 📤 Set up file uploads
4. 🔐 Configure custom domain
5. 🎨 Migrate frontend pages from HTML to React components
6. 📊 Set up analytics

---

## Support

For issues:
1. Check Vercel logs: `vercel logs --prod`
2. Verify environment variables
3. Test API endpoints with curl/Postman
4. Review application error messages

---

**Happy deploying! 🎉**
