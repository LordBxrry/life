#!/bin/bash
# Quick setup script for local development

echo "🚀 Life Application - Vercel Setup"
echo "===================================="
echo ""

# Check Node.js version
echo "✓ Checking Node.js version..."
node_version=$(node --version)
if [[ $node_version == *"18"* ]] || [[ $node_version == *"19"* ]] || [[ $node_version == *"20"* ]]; then
    echo "✓ Node.js $node_version detected"
else
    echo "⚠️  Node.js 18+ is recommended"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env.local
echo ""
echo "🔧 Setting up environment variables..."
if [ ! -f .env.local ]; then
    echo "Creating .env.local..."
    cat > .env.local << EOF
# Local development environment
DATABASE_URL=postgresql://user:password@localhost:5432/life_app
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=development
NEXT_PUBLIC_API_URL=/api
EOF
    echo "✓ Created .env.local (update with your database connection)"
else
    echo "✓ .env.local already exists"
fi

# Run development server
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update DATABASE_URL in .env.local with your PostgreSQL connection string"
echo "2. Run: npm run dev"
echo "3. Visit: http://localhost:3000"
echo ""
echo "For production deployment:"
echo "1. Read: VERCEL_MIGRATION_GUIDE.md"
echo "2. Set up PostgreSQL (Vercel Postgres, Neon, etc.)"
echo "3. Deploy: vercel --prod"
