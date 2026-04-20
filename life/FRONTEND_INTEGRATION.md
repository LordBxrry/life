# Frontend-Backend Integration Guide

Guide to connect the frontend HTML pages to the backend API endpoints.

---

## 📋 Overview

The frontend currently operates in **two modes**:

1. **Offline Mode** (`app.js`) - Uses localStorage only, no backend needed
2. **Online Mode** (`app-backend.js`) - Uses backend API for data persistence

This guide shows how to fully integrate them.

---

## 🔄 Integration Steps

### Step 1: Update HTML Files to Use app-backend.js

In each HTML file, change the app script reference:

**Before:**
```html
<script src="app.js"></script>
```

**After:**
```html
<script src="app-backend.js"></script>
```

Files to update:
- `index.html`
- `profile.html`
- `about.html`
- `shop.html`
- `settings.html`
- `signinorup.html`

---

### Step 2: Enhance Authentication Page

Update `signinorup.html` to call backend auth endpoints.

Add this JavaScript to the page:

```javascript
// Authentication Handler
class AuthHandler {
    constructor() {
        this.form = document.querySelector('form');
        this.setupListeners();
    }

    setupListeners() {
        this.form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const isSignup = this.form.classList.contains('signup-form');
            
            if (isSignup) {
                await this.handleSignup();
            } else {
                await this.handleLogin();
            }
        });
    }

    async handleSignup() {
        const username = document.querySelector('[name="username"]').value;
        const email = document.querySelector('[name="email"]').value;
        const password = document.querySelector('[name="password"]').value;

        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userName', data.user.username);
                localStorage.setItem('userEmail', data.user.email);
                localStorage.setItem('authToken', data.token);
                
                show Toast('Account created! Redirecting...', 'success');
                setTimeout(() => window.location.href = 'index.html', 1500);
            } else {
                showToast(data.message || 'Signup failed', 'error');
            }
        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        }
    }

    async handleLogin() {
        const email = document.querySelector('[name="email"]').value;
        const password = document.querySelector('[name="password"]').value;

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userName', data.user.username);
                localStorage.setItem('userEmail', data.user.email);
                localStorage.setItem('authToken', data.token);
                
                showToast('Login successful!', 'success');
                setTimeout(() => window.location.href = 'index.html', 1500);
            } else {
                showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        }
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    new AuthHandler();
});

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 16px 24px;
        border-radius: 4px;
        z-index: 3000;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}
```

---

### Step 3: Create API Client Module

Create `frontend/api-client.js`:

```javascript
// API Client for frontend-backend communication
class APIClient {
    constructor(baseURL = 'http://localhost:3000/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('authToken');
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Make HTTP request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired, redirect to login
                    localStorage.clear();
                    window.location.href = 'signinorup.html';
                }
                throw new Error(data.message || 'API Error');
            }

            return data;
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
    }

    // AUTH ENDPOINTS
    async register(username, email, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    }

    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async logout() {
        return this.request('/auth/logout', { method: 'POST' });
    }

    async verifyToken() {
        return this.request('/auth/verify');
    }

    // USER ENDPOINTS
    async getProfile() {
        return this.request('/users/profile');
    }

    async getUser(userId) {
        return this.request(`/users/${userId}`);
    }

    async getAllUsers(limit = 50) {
        return this.request(`/users?limit=${limit}`);
    }

    async updateProfile(username, fullName, bio, location, avatarUrl) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify({ username, full_name: fullName, bio, location, avatar_url: avatarUrl })
        });
    }

    async sendConnectionRequest(userId) {
        return this.request(`/users/connect/${userId}`, { method: 'POST' });
    }

    // NOTIFICATIONS ENDPOINTS
    async getNotifications() {
        return this.request('/notifications');
    }

    async getUnreadCount() {
        return this.request('/notifications/count/unread');
    }

    async markNotificationRead(notifId) {
        return this.request(`/notifications/${notifId}/read`, { method: 'PUT' });
    }

    async markAllRead() {
        return this.request('/notifications/read-all', { method: 'PUT' });
    }

    async deleteNotification(notifId) {
        return this.request(`/notifications/${notifId}`, { method: 'DELETE' });
    }

    // MESSAGES ENDPOINTS
    async getConversations() {
        return this.request('/messages/conversations');
    }

    async getConversation(convId) {
        return this.request(`/messages/conversation/${convId}`);
    }

    async startConversation(userId) {
        return this.request(`/messages/conversation/${userId}`, { method: 'POST' });
    }

    async sendMessage(conversationId, content) {
        return this.request('/messages/send', {
            method: 'POST',
            body: JSON.stringify({ conversation_id: conversationId, content })
        });
    }

    async getUnreadMessageCount() {
        return this.request('/messages/count/unread');
    }

    // PRODUCTS ENDPOINTS
    async getProducts(limit = 50, offset = 0) {
        return this.request(`/products?limit=${limit}&offset=${offset}`);
    }

    async getProduct(productId) {
        return this.request(`/products/${productId}`);
    }

    async getProductsByCategory(category, limit = 50) {
        return this.request(`/products/category/${category}?limit=${limit}`);
    }

    async getCategories() {
        return this.request('/products/categories/list');
    }

    // Admin only
    async createProduct(name, description, category, price, imageUrl, available = true) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify({ name, description, category, price, image_url: imageUrl, available })
        });
    }

    async updateProduct(productId, updates) {
        return this.request(`/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deleteProduct(productId) {
        return this.request(`/products/${productId}`, { method: 'DELETE' });
    }
}

// Global instance
const api = new APIClient();
```

Add to HTML files:
```html
<script src="api-client.js"></script>
```

---

### Step 4: Update Profile Page

Enhance `profile.html` to fetch real user data:

```javascript
// Initialize profile page
async function initializeProfile() {
    try {
        const data = await api.getProfile();
        
        document.querySelector('.profile-name').textContent = data.user.username;
        document.querySelector('.profile-bio').textContent = data.user.bio || 'No bio';
        document.querySelector('.profile-location').textContent = data.user.location || 'Not specified';
        document.querySelector('.stats-connections').textContent = data.stats.connections || 0;
        document.querySelector('.stats-messages').textContent = data.stats.messages || 0;
        
    } catch (err) {
        console.error('Error loading profile:', err);
        alert('Failed to load profile');
    }
}

// Update profile
async function updateProfile() {
    const username = document.querySelector('[name="username"]').value;
    const bio = document.querySelector('[name="bio"]').value;
    const location = document.querySelector('[name="location"]').value;
    
    try {
        await api.updateProfile(username, [], bio, location, '');
        alert('Profile updated successfully!');
    } catch (err) {
        alert('Error updating profile: ' + err.message);
    }
}

// On page load
window.addEventListener('DOMContentLoaded', initializeProfile);
```

---

### Step 5: Update Shop Page

Enhance `shop.html` to fetch products from backend:

```javascript
// Load products
async function loadProducts(category = null) {
    try {
        const data = category 
            ? await api.getProductsByCategory(category)
            : await api.getProducts();
        
        const productsContainer = document.querySelector('.products-grid');
        productsContainer.innerHTML = data.products.map(p => `
            <div class="product-card">
                <img src="${p.image_url}" alt="${p.name}">
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <span class="price">$${p.price}</span>
                <button onclick="addToCart('${p.id}', '${p.name}', ${p.price})">Add to Cart</button>
            </div>
        `).join('');
        
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

// Load on page start
window.addEventListener('DOMContentLoaded', () => loadProducts());
```

---

## 🧪 Testing Integration

### 1. Test Backend is Running
```bash
curl http://localhost:3000/api/health
```

### 2. Test Frontend Can Connect
Open browser console (F12) and run:
```javascript
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(d => console.log('✓ Backend connected:', d))
  .catch(e => console.error('✗ Connection failed:', e));
```

### 3. Test Full Auth Flow
1. Navigate to `signinorup.html`
2. Create new account
3. Check browser localStorage for `authToken`
4. Navigate to `index.html` - should show your username

### 4. Test API Call
In browser console:
```javascript
api.getProfile()
  .then(d => console.log('✓ Profile:', d))
  .catch(e => console.error('✗ Error:', e));
```

---

## 🔐 Security Notes

1. **Never commit .env file** - add to `.gitignore`
2. **Use HTTPS in production** - get SSL from Let's Encrypt
3. **Set strong JWT_SECRET** - min 32 characters, random
4. **Keep dependencies updated** - run `npm audit`
5. **Protect sensitive data** - never store passwords in localStorage

---

## 🐛 Debugging Integration

### Enable verbose logging in browser:

```javascript
// Add to app-backend.js
const DEBUG = true;

function debugLog(...args) {
    if (DEBUG) console.log('🔵 [App]', ...args);
}
```

### Check network requests:
1. Open DevTools (F12)
2. Go to Network tab
3. Watch API calls being made
4. Check response status and data

### Common Issues:

**Issue**: CORS error in console
**Fix**: Verify `CORS_ORIGIN` in backend `.env` matches frontend URL

**Issue**: 401 Unauthorized errors
**Fix**: Check token is being sent - check localStorage for `authToken`

**Issue**: Blank pages after login
**Fix**: Check browser console for JavaScript errors

---

## 📦 Final Checklist

- [ ] Backend running: `npm start` in backend folder
- [ ] app-backend.js added to frontend folder
- [ ] All HTML files updated to use app-backend.js
- [ ] API Client module (api-client.js) added
- [ ] Authentication page calls backend /auth/register and /auth/login
- [ ] Profile page calls backend /users/profile
- [ ] Shop page calls backend /products
- [ ] Messaging works with backend /messages endpoints
- [ ] Notifications sync with backend /notifications endpoints
- [ ] No CORS errors in browser console
- [ ] No 401 errors (token issues)

---

## 🎉 You're All Set!

Your frontend and backend are now fully integrated. All data will persist on the server and be accessible across devices on the same network.
