#!/usr/bin/env node
/**
 * Admin User Initialization Script
 * Creates the first admin/superuser account with full access
 * 
 * Usage: npm run setup-admin
 * Or: node backend/admin-init.js
 */

const { run, get, initialize } = require('./config/database');
const { hashPassword, generateId } = require('./config/auth');
require('dotenv').config();

// Default admin credentials from .env or use defaults
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@life.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
const ADMIN_USERNAME = 'administrator';

const createAdminUser = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   Admin User Initialization                ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // Initialize database first
    console.log('Initializing database tables...');
    await initialize();

    // Check if admin already exists
    const existingAdmin = await get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [ADMIN_EMAIL, ADMIN_USERNAME]
    );

    if (existingAdmin) {
      console.log('✓ Admin user already exists!');
      console.log(`  Email: ${ADMIN_EMAIL}`);
      console.log(`  Username: ${ADMIN_USERNAME}`);
      process.exit(0);
    }

    // Create admin user
    console.log('Creating admin user...');
    const adminId = generateId();
    const passwordHash = await hashPassword(ADMIN_PASSWORD);

    await run(
      `INSERT INTO users (id, username, email, password_hash, full_name, role, is_admin, account_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [adminId, ADMIN_USERNAME, ADMIN_EMAIL, passwordHash, 'System Administrator', 'admin', 1, 1]
    );

    console.log('\n✓ Admin user created successfully!\n');
    console.log('📋 Admin Account Details:');
    console.log('─────────────────────────');
    console.log(`Email:    ${ADMIN_EMAIL}`);
    console.log(`Username: ${ADMIN_USERNAME}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`User ID:  ${adminId}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');

    console.log('🔑 Login Instructions:');
    console.log('─────────────────────');
    console.log('1. Go to http://localhost:3000/signinorup.html');
    console.log(`2. Click "Login"`);
    console.log(`3. Enter email: ${ADMIN_EMAIL}`);
    console.log(`4. Enter password: ${ADMIN_PASSWORD}`);
    console.log('5. You are now logged in as admin!\n');

    console.log('🎯 Admin Features Available:');
    console.log('─────────────────────────');
    console.log('✓ View all user accounts with full details');
    console.log('✓ Edit any user profile');
    console.log('✓ Reset any user password');
    console.log('✓ Delete user accounts');
    console.log('✓ Promote/demote users to admin');
    console.log('✓ Deactivate/activate accounts');
    console.log('✓ View all products and delete any');
    console.log('✓ View all notifications');
    console.log('✓ View all messages');
    console.log('✓ View system statistics\n');

    console.log('📚 Admin API Endpoints:');
    console.log('─────────────────────');
    console.log('GET    /api/admin/users              - List all users');
    console.log('GET    /api/admin/users/:userId      - Get user details');
    console.log('PUT    /api/admin/users/:userId      - Edit user');
    console.log('POST   /api/admin/users/:userId/reset-password - Reset password');
    console.log('DELETE /api/admin/users/:userId      - Delete user');
    console.log('POST   /api/admin/users/:userId/make-admin     - Make admin');
    console.log('POST   /api/admin/users/:userId/remove-admin   - Remove admin');
    console.log('GET    /api/admin/products           - View all products');
    console.log('DELETE /api/admin/products/:productId - Delete product');
    console.log('GET    /api/admin/notifications      - View all notifications');
    console.log('GET    /api/admin/users/:userId/messages - User messages');
    console.log('GET    /api/admin/statistics         - System statistics');
    console.log('POST   /api/admin/create-user        - Create new user\n');

    process.exit(0);
  } catch (err) {
    console.error('✗ Error creating admin user:', err);
    process.exit(1);
  }
};

// Run initialization
createAdminUser();
