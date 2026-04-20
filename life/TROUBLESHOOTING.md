# 🔧 Troubleshooting Guide

Solutions to common issues you might encounter when running the Life application.

---

## 🚨 Startup Issues

### ❌ "Cannot find module 'express'"

**Problem**: Dependencies not installed

**Solution**:
```bash
cd backend
npm install
```

**Detailed steps**:
1. Make sure you're in the `backend` folder
2. Run `npm install` to install all dependencies
3. Wait for it to complete (creates `node_modules` folder)
4. Try `npm start` again

---

### ❌ "Error: listen EADDRINUSE :::3000"

**Problem**: Port 3000 is already in use

**Solution**:

```bash
# Find what's using port 3000
lsof -i :3000              # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>              # macOS/Linux (use PID from above)
taskkill /PID <PID> /F     # Windows

# Start on different port (edit .env)
PORT=3001
```

**Alternative**: Use a different port
1. Edit `backend/.env`
2. Change `PORT=3000` to `PORT=3001`
3. Restart server
4. Access via `http://localhost:3001`

---

### ❌ "Error: ENOENT: no such file or directory, open '.env'"

**Problem**: .env file not found

**Solution**:
```bash
cd backend
cp .env.example .env
# Now you have a .env file to customize
```

---

### ❌ "Cannot find module 'dotenv'"

**Problem**: .env module not installed

**Solution**:
```bash
cd backend
npm install dotenv
# Or reinstall everything
npm install
```

---

### ❌ No startup banner appears

**Problem**: Server may not be starting correctly

**Solution**:
```bash
# Check for errors in more detail
node backend/server.js

# Look for error messages
# Common issues:
# - Port already in use
# - .env file missing
# - Dependencies not installed
# - Syntax errors in server.js
```

---

## 🌐 Browser/Connection Issues

### ❌ "Cannot GET /" or blank page

**Problem**: Frontend files not loading

**Solutions**:

1. **Check server is running**:
   ```bash
   curl http://localhost:3000
   # Should return HTML content, not error
   ```

2. **Check frontend files exist**:
   ```bash
   ls frontend/
   # Should show: index.html, styles.css, app.js, etc.
   ```

3. **Check static file serving in server.js**:
   ```javascript
   app.use(express.static('frontend'));
   // Should be present in server.js
   ```

4. **Restart server** (sometimes needed):
   ```bash
   npm start
   ```

---

### ❌ CORS Error in Browser Console

**Error**: `Access to XMLHttpRequest at 'http://localhost:3000/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Problem**: CORS not properly configured

**Solution**:

1. Check `.env` has correct CORS_ORIGIN:
   ```env
   CORS_ORIGIN=http://localhost:3000
   ```

2. Restart server to apply .env changes:
   ```bash
   npm start
   ```

3. Check browser console - should not see CORS errors now

---

### ❌ 401 Unauthorized Error

**Error**: `401 Unauthorized` in network tab

**Problem**: Authentication token missing or expired

**Solutions**:

1. **Check token exists**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Type: `localStorage.getItem('authToken')`
   - Should return a long string (token)

2. **Token is missing**:
   - Need to login first
   - Go to signinorup.html
   - Create account or login

3. **Token is expired**:
   - Logout and login again
   - This gets a new token

4. **Check Authorization header**:
   - In Network tab (F12)
   - Check the request headers
   - Should have: `Authorization: Bearer <token>`

---

### ❌ 404 Not Found

**Error**: `404 Not Found` for API endpoint

**Problem**: Route doesn't exist or endpoint is wrong

**Solutions**:

1. **Check endpoint spelling**:
   - `/api/users` (correct)
   - `/api/user` (wrong - 404)
   - API is case-sensitive

2. **Check route file exists**:
   ```bash
   ls backend/routes/
   # Should show: auth.js, users.js, notifications.js, messages.js, products.js
   ```

3. **Check route is mounted** in server.js:
   ```javascript
   app.use('/api/users', require('./routes/users'));
   // Must be present
   ```

4. **Verify endpoint exists** in route file:
   ```javascript
   router.get('/', async (req, res) => {
     // Must have this endpoint or will get 404
   });
   ```

---

## 🔐 Authentication Issues

### ❌ "Invalid email or password" on login

**Problem**: Credentials don't match database

**Solutions**:

1. **Verify account exists**:
   - Use correct email address
   - Passwords are case-sensitive
   - Check for extra spaces

2. **Reset account** (nuke and recreate):
   - Delete database: `rm backend/data/life.db`
   - Restart server: `npm start`
   - Create new account

3. **Check database** (advanced):
   ```bash
   sqlite3 backend/data/life.db
   SELECT email, username FROM users;
   # See if user exists
   .exit  # Exit sqlite
   ```

---

### ❌ "Email already exists"

**Problem**: Trying to sign up with email that's already registered

**Solutions**:

1. **Use different email**:
   - Use another email address for new account
   - Or login with existing account

2. **Delete user** (if you want to reuse email):
   ```bash
   sqlite3 backend/data/life.db
   DELETE FROM users WHERE email='test@example.com';
   .exit
   npm start  # Restart server
   ```

   Or just reset entire database:
   ```bash
   npm run reset-db
   ```

---

### ❌ Token keeps expiring

**Problem**: Getting logged out frequently

**Cause**: JWT_SECRET changed or token expiration is too short

**Solution**:

1. **Check JWT_EXPIRATION** in .env:
   ```env
   JWT_EXPIRATION=7d  # 7 days
   # Or set to longer: 30d (30 days)
   ```

2. **Restart server after changing .env**:
   ```bash
   npm start
   ```

3. **Ensure JWT_SECRET is set** and consistent:
   ```env
   JWT_SECRET=your_very_long_secret_key_here_min_32_chars
   ```

---

## 🗄️ Database Issues

### ❌ "SQLITE_CANTOPEN" or database errors

**Problem**: Database file can't be opened or doesn't exist

**Solutions**:

1. **Ensure data directory exists**:
   ```bash
   mkdir -p backend/data
   # Creates the directory if missing
   ```

2. **Check file permissions**:
   ```bash
   ls -la backend/data/
   # Should show: life.db (database file)
   ```

3. **Reset database if corrupted**:
   ```bash
   rm backend/data/life.db
   npm start  # Restart - will recreate fresh database
   ```

---

### ❌ "Table X already exists" on startup

**Problem**: Database already initialized

**Solution**: This is normal on restart - not an error
- Database tables are only created if they don't exist
- Safe to ignore this message

---

### ❌ "Foreign key constraint failed"

**Problem**: Trying to insert invalid foreign key reference

**Example**: Sending message to conversation that doesn't exist

**Solutions**:

1. **Verify conversation exists before sending message**
2. **Check database relationships**:
   ```bash
   sqlite3 backend/data/life.db
   SELECT * FROM conversations;  # Check conversations exist
   .exit
   ```

3. **Disable foreign keys** (not recommended):
   - Edit backend/config/database.js
   - Change: `PRAGMA foreign_keys = ON;` to `OFF`
   - (Only for debugging - enable it back)

---

## 📱 Frontend Integration Issues

### ❌ "API not responding" or blank pages

**Problem**: Frontend can't connect to backend

**Check**:
1. Is backend running? Run `npm start` in backend folder
2. Is port 3000 available?
3. Is CORS_ORIGIN set correctly in .env?

**Solution**:
```bash
# Test backend is running
curl http://localhost:3000/api/health

# Should return:
# {"status":"OK","timestamp":"...","uptime":2.5,"environment":"development"}
```

If that works, frontend should connect.

---

### ❌ "Undefined is not a function" in browser console

**Problem**: JavaScript error in frontend code

**Solution**:

1. **Check browser console for full error**:
   - F12 to open DevTools
   - Console tab
   - Look for red error messages
   - Note the file and line number

2. **Check file name is correct**:
   - Using `app.js` (offline) or `app-backend.js` (API)?
   - HTML should load the right file

3. **Check script loads in order**:
   - styles.css should load first
   - Then app.js or app-backend.js
   - HTML may load after

---

### ❌ localStorage keeps getting cleared

**Problem**: Token/user data disappears on page reload

**Possible Causes**:

1. **Browser in private/incognito mode**:
   - localStorage doesn't persist
   - Use normal browsing mode

2. **Browser clearing on close**:
   - Check browser settings
   - May need to enable localStorage persistence

3. **App logging out**:
   - Check if token verification failing
   - See browser console for errors

**Solution**:
```javascript
// Check localStorage in browser console (F12)
localStorage.getItem('authToken')
localStorage.getItem('userId')
localStorage.getItem('userName')
// Should return values (not null)
```

---

## 🐛 Advanced Debugging

### Enable Detailed Logging

**In browser** (F12 > Console):
```javascript
// Set debug flag
localStorage.setItem('DEBUG', 'true');

// View all requests
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(d => console.log('Response:', d))
  .catch(e => console.error('Error:', e));
```

### Check Network Requests

1. Open DevTools: **F12**
2. Go to **Network** tab
3. Perform action (login, send message, etc.)
4. Look for requests in list
5. Click each request to see:
   - Request headers
   - Request body
   - Response status
   - Response body

### Test API Endpoints Directly

```bash
# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123!"
  }'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'

# Test getting profile (replace TOKEN with actual token from login)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/users/profile
```

### View Server Logs

```bash
# Tail the log file
tail -f backend/logs/app.log

# Or restart and watch output
npm start
# Watch console output for errors/warnings
```

---

## 🔄 Common Workflow Issues

### ❌ Profile changes not saving

**Problem**: Edit profile but changes don't appear

**Solution**:

1. **Check you're authenticated**:
   - Should see your username in header
   - If not, need to login

2. **Verify form is being submitted**:
   - Click Save/Update button
   - Check Network tab (F12) for PUT request

3. **Check for errors**:
   - Console tab (F12) for JS errors
   - Network tab for 401/500 errors

4. **Refresh page**:
   - Changes should appear after refresh
   - Or auto-update if working correctly

---

### ❌ Messages not sending

**Problem**: Message won't send or disappears

**Solution**:

1. **Check conversation exists**:
   - Must have active conversation
   - Not just blank messaging panel

2. **Check authentication**:
   - Must be logged in
   - Token must be valid

3. **Check Network tab** (F12):
   - POST request to /api/messages/send should succeed (200)
   - Check response for errors

---

### ❌ Notifications not appearing

**Problem**: No notifications showing up

**Solution**:

1. **Check browser notifications permission**:
   - Browser may have blocked notifications
   - Check site permissions

2. **Check app notifications**:
   - Click bell icon to open notifications panel
   - Should see notification list

3. **Create notification to test**:
   - Perform action that triggers notification
   - Should see it appear

---

## 🔧 Quick Fixes Checklist

- [ ] Backend running: `npm start` works
- [ ] Port 3000 available: `lsof -i :3000` shows nothing
- [ ] Dependencies installed: `npm install` completed
- [ ] .env file exists with settings
- [ ] JWT_SECRET is set to random long string
- [ ] CORS_ORIGIN matches frontend URL
- [ ] Frontend HTML files in `frontend/` folder
- [ ] No CORS errors in browser console
- [ ] No 401 errors (if trying authenticated endpoint)
- [ ] Database file `backend/data/life.db` exists

---

## 📞 If All Else Fails

### Nuclear Option (Complete Reset)

This will delete ALL data and start fresh:

```bash
# Stop server (Ctrl+C)

# Delete everything
cd backend
rm -rf node_modules data/life.db .env package-lock.json

# Start fresh
npm install
cp .env.example .env
# Edit .env with your settings - at least set JWT_SECRET

npm start
```

Then in browser:
1. Clear cache (Ctrl+Shift+Delete)
2. Clear localStorage (F12 > Application > localStorage > Clear All)
3. Hard refresh (Ctrl+Shift+R)
4. Go to http://localhost:3000
5. Create new account

---

## 📝 Reporting Issues

If you encounter an issue not listed here:

1. **Write down the error message** exactly
2. **Note what you were doing** when it happened
3. **Check browser console** (F12 > Console) for errors
4. **Check server terminal** for error output
5. **Try the quick fixes checklist** above

---

**Last Updated**: 2024  
**Version**: 2.0.0
