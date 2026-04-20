@echo off
REM Quick setup script for local development (Windows)

echo.
echo 🚀 Life Application - Vercel Setup
echo ====================================
echo.

REM Check Node.js version
echo ✓ Checking Node.js version...
node --version

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install

REM Create .env.local if it doesn't exist
echo.
echo 🔧 Setting up environment variables...
if not exist .env.local (
    echo Creating .env.local...
    (
        echo # Local development environment
        echo DATABASE_URL=postgresql://user:password@localhost:5432/life_app
        echo JWT_SECRET=your-secret-key-here
        echo NODE_ENV=development
        echo NEXT_PUBLIC_API_URL=/api
    ) > .env.local
    echo ✓ Created .env.local (update with your database connection)
) else (
    echo ✓ .env.local already exists
)

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Update DATABASE_URL in .env.local with your PostgreSQL connection string
echo 2. Run: npm run dev
echo 3. Visit: http://localhost:3000
echo.
echo For production deployment:
echo 1. Read: VERCEL_MIGRATION_GUIDE.md
echo 2. Set up PostgreSQL (Vercel Postgres, Neon, etc.)
echo 3. Deploy: vercel --prod
echo.
pause
