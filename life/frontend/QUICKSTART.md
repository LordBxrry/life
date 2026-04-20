# Quick Start Guide

## What's New? 🎉

Your Life website has been completely refactored with:

✅ **Connected Navigation** - All pages linked and consistent  
✅ **Notifications System** - Real-time alerts with persistence  
✅ **Messaging System** - Send and receive messages  
✅ **Unified Styling** - Single shared CSS file for consistency  
✅ **Optimized Performance** - Faster loading, better UX  
✅ **Responsive Design** - Works great on mobile and desktop  
✅ **User Authentication** - Sign in/up functionality  

---

## File Structure

```
frontend/
├── styles.css          ← Shared styles (all pages use this)
├── app.js              ← Shared app logic (notifications, messaging)
├── index.html          ← Home page
├── profile.html        ← User profile page
├── about.html          ← About the company
├── shop.html           ← Products & services
├── settings.html       ← User preferences
└── signinorup.html     ← Sign in / Sign up
```

---

## Key Features Explained

### 🔔 Notifications
- Click the **bell icon** in header to see notifications
- Uses `App.addNotification('Message', 'success')`
- Toast notifications appear at bottom right
- Stores notifications in browser cache

### 💬 Messaging
- Click the **envelope icon** in header to see messages
- Shows conversation list
- Type and send messages
- Uses `App.startNewMessage()` to create new chat

### 🔐 Authentication
- Visit `signinorup.html` to sign in or create account
- Stores user info in browser
- Automatically redirects to home after login
- Click "Logout" button to sign out

### 🎨 Styling
- All pages use `styles.css`
- Color scheme: Gold (#d4a373) and Brown (#8b6f47)
- Mobile-responsive with breakpoints at 768px and 480px
- CSS variables for easy customization

---

## How to Use in Your Code

### Add a Notification
```javascript
// When button is clicked
App.addNotification('Profile updated!', 'success');
```

### Start a Conversation
```javascript
App.startNewMessage();
// User will be prompted for contact name
```

### Show Toast Alert
```javascript
App.showToast('Action completed!', 'info');
```

### Access User Data
```javascript
console.log(App.user.name);      // Get username
console.log(App.user.email);     // Get email
console.log(App.notifications);  // Get all notifications
```

---

## Navigation Setup

Every page includes:
```html
<header>
    <nav>
        <a href="index.html" class="logo"><i class="fas fa-leaf"></i> Life</a>
        <div class="nav-links">
            <a href="index.html">Home</a>
            <a href="about.html">About</a>
            <a href="shop.html">Shop</a>
            <a href="profile.html">Profile</a>
            <a href="settings.html">Settings</a>
        </div>
    </nav>
</header>
```

The current page link is **automatically highlighted** by `app.js`.

---

## Customization Checklist

- [ ] Update app name/logo in header
- [ ] Change color scheme in `styles.css` (search for #d4a373)
- [ ] Update company info in `about.html`
- [ ] Add real products to `shop.html`
- [ ] Customize settings options in `settings.html`
- [ ] Update footer/legal links
- [ ] Connect to backend API (when ready)
- [ ] Set up real user authentication

---

## Testing Checklist

- [ ] Click through all navigation links
- [ ] Test notifications (click bell icon)
- [ ] Test messaging (click envelope icon)
- [ ] Test sign in/logout on signinorup.html
- [ ] Test on mobile (open DevTools → Toggle device toolbar)
- [ ] Test form validation
- [ ] Clear browser cache and test again

---

## Performance Tips

1. **Images**: Use optimized/compressed images
2. **API Calls**: Cache responses in localStorage
3. **Heavy Scripts**: Load async if not critical
4. **CSS**: Keep styles.css flat and simple
5. **Mobile**: Test with slow 3G connection

---

## Common Tasks

### Add a New Page
1. Create `newpage.html` in frontend folder
2. Copy header from any existing page
3. Link `styles.css` and `app.js`
4. Add to nav links: `<a href="newpage.html">New Page</a>`

### Add Notification Trigger
```javascript
<button onclick="App.addNotification('Success!', 'success')">
    Click me
</button>
```

### Style a Custom Button
```html
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
```

### Create a Modal
```html
<div class="modal-overlay" id="myModal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Modal Title</h2>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        **<!-- Content here -->**
    </div>
</div>
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Styles not loading | Check styles.css exists and path is correct |
| App not working | Open DevTools console and check for errors |
| Notifications don't persist | Ensure localStorage is enabled in browser |
| Mobile layout broken | Test in DevTools device emulator |
| Links are 404 | Check file names match exactly (case-sensitive on Linux) |

---

## Next Steps

1. ✅ Review all pages
2. ✅ Test navigation and features
3. ✅ Customize colors and branding
4. ✅ Add your real content
5. ✅ Connect to backend API
6. ✅ Deploy to live server
7. ✅ Collect user feedback
8. ✅ Iterate and improve

---

## Resources

- **Font Awesome Icons**: https://fontawesome.com
- **CSS Variables Guide**: https://developer.mozilla.org/en-US/docs/Web/CSS/--*
- **localStorage Reference**: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- **Responsive Design**: https://web.dev/responsive-web-design-basics/

---

## Support

For detailed documentation, see **README.md**

Questions? Check the inline code comments in:
- `app.js` - Core functionality
- `styles.css` - Styling system
- Individual pages - Page-specific features

---

**Built with ❤️ for Life**
March 2026
