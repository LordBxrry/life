# Quick Start - Life Application on Vercel

## What's Changed?

Your app has been completely rewritten to run on Vercel! Here's what happened:

- ✅ **Express.js → Next.js** - Modern meta-framework with native Vercel support
- ✅ **SQLite → PostgreSQL** - Cloud-hosted database instead of local files
- ✅ **Express Server → Serverless Functions** - Auto-scaling API routes
- ✅ **HTML Pages → React Components** - Interactive pages with state management

---

## Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Environment File
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### Step 3: Update Database Connection
Edit `.env.local` and add your PostgreSQL connection:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-random-secret-key
```

**Don't have PostgreSQL?** Get a free database:
- **Vercel Postgres** (easiest): https://vercel.com/postgres
- **Neon**: https://neon.tech/ (free tier)
- **Supabase**: https://supabase.com/

### Step 4: Start Development
```bash
npm run dev
```
Visit: **http://localhost:3000**

---

## Endpoints Reference

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Users
- `GET /api/users/[id]` - Get profile
- `PUT /api/users/[id]` - Update profile

### Messages
- `GET /api/messages/[id]` - Get messages
- `POST /api/messages/[id]` - Send message

### Products, Events, Stories, Social
- `GET/POST /api/products`
- `GET/POST /api/events`
- `GET/POST /api/stories`
- `GET/POST /api/social/posts`

---

## Deploy to Vercel

### Option 1: GitHub (Recommended)
```bash
git push origin main
# Then connect in Vercel dashboard
```

### Option 2: Vercel CLI
```bash
npm i -g vercel        # Install Vercel CLI
vercel login           # Login to your account
vercel --prod          # Deploy
```

---

## Key Files

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel config |
| `next.config.js` | Next.js settings |
| `pages/api/` | Backend API routes |
| `pages/` | Frontend pages |
| `lib/db.js` | Database connection |
| `lib/auth.js` | Authentication helpers |
| `VERCEL_MIGRATION_GUIDE.md` | Full deployment guide |
| `MIGRATION_SUMMARY.md` | Complete technical details |

---

## Troubleshooting

**"DATABASE_URL is not set"**
- Add to `.env.local`: `DATABASE_URL=your_postgres_url`
- If on Vercel, add to Environment Variables in dashboard

**"Cannot find module 'pg'"**
- Run: `npm install`

**"Invalid token"**
- Check JWT_SECRET is set
- Ensure token is passed in Authorization header

---

## Next Steps

1. ✅ Get PostgreSQL database
2. ✅ Set up environment variables
3. ✅ Test locally (`npm run dev`)
4. ✅ Deploy to Vercel (`vercel --prod`)
5. ⏳ Integrate real-time service (Pusher/Firebase)
6. ⏳ Set up file uploads (Cloudinary/S3)

---

## Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Check Logs:** `vercel logs --prod`

---

**Ready? Start with `npm install` and `npm run dev`!** 🚀
