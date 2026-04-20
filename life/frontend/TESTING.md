# Testing & Troubleshooting Guide

## ✅ Testing Checklist

### Navigation Testing
```
□ index.html → click all nav links
□ profile.html → click all nav links
□ about.html → click all nav links
□ shop.html → click all nav links
□ settings.html → click all nav links
□ signinorup.html → click sign in link in header

Expected: All links work, page changes, current page highlighted
```

### Notifications Testing
```
□ Click bell icon in header
□ Notification panel appears
□ Click "Clear" button → notifications cleared
□ Trigger a notification (click buttons with App.addNotification)
□ Badge shows unread count
□ Close and reopen → data persists

Expected: All notification features work, data saved
```

### Messaging Testing
```
□ Click envelope icon in header
□ Messaging panel appears
□ Click "+ New" button
□ Enter contact name → conversation created
□ Type message and click send
□ Message appears in conversation
□ Badge updates when new message
□ Close and reopen → conversations persist

Expected: All messaging features work smoothly
```

### Authentication Testing
```
□ Visit signinorup.html
□ See login form
□ Click "Create one" link → signup form appears
□ Fill signup form with test data
□ Click "Create Account"
□ Redirected to home.html
□ User name appears in header
□ Logout button available
□ Click logout → back to signinorup.html

Expected: Auth flow works end-to-end
```

### Responsive Design Testing
```
□ Open DevTools (F12)
□ Click device toolbar (top left)
□ Test at iPhone SE (375px width)
□ Test at iPad (768px width)
□ Test at Desktop (1920px width)
□ Check all pages look good
□ Test on real phone if possible

Expected: No layout breaks, text readable, buttons clickable
```

### Form Testing
```
□ settings.html → toggle switches work
□ settings.html → dropdown selects work
□ profile.html → Edit Profile button works
□ signinorup.html → form validation works
□ signinorup.html → password match check works

Expected: All form interactions work properly
```

### Button Testing
```
□ All .btn elements clickable
□ Hover effects show
□ Logout button works (clears storage)
□ Add to cart buttons trigger notifications
□ All onclick handlers execute

Expected: All buttons functional with smooth interactions
```

### DataPersistence Testing
```
□ Add notification
□ Refresh page (F5)
□ Notification still shows
□ Logout and login
□ User info restored
□ Messages still in conversation list

Expected: All localStorage data persists across refreshes
```

---

## 🐛 Common Issues & Solutions

### Issue: Styles not loading (page looks broken)
```
❌ Problem: CSS not applied
✅ Solution:
  1. Check styles.css exists in same folder
  2. Check file path is correct
  3. Check file is not corrupted
  4. Clear browser cache (Ctrl+Shift+Delete)
  5. Check browser console for errors (F12)
```

### Issue: App.addNotification() not working
```
❌ Problem: Notifications don't appear
✅ Solution:
  1. Check app.js is loaded (DevTools → Network tab)
  2. Check for JavaScript errors (DevTools → Console)
  3. Check localStorage is enabled (DevTools → Application)
  4. Verify script tag exists: <script src="app.js"></script>
```

### Issue: Navigation links broken (404 errors)
```
❌ Problem: Clicking links shows 404
✅ Solution:
  1. Check HTML file names match exactly
  2. File names are case-sensitive on Linux!
  3. Verify all HTML files in same folder
  4. Check href paths don't have extra ../ or /
  5. Example: href="profile.html" (not "/profile.html")
```

### Issue: Storage not working (data disappears)
```
❌ Problem: Notifications/messages disappear on refresh
✅ Solution:
  1. Enable localStorage in browser (usually on by default)
  2. Check you're not in Private/Incognito mode
  3. Clear SessionStorage (DevTools → Application)
  4. Check browser privacy settings
  5. Test in different browser to isolate issue
```

### Issue: Mobile layout broken
```
❌ Problem: Page looks wrong on phone
✅ Solution:
  1. Check viewport meta tag exists:
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
  2. Test with DevTools device emulator first
  3. Check for fixed widths in CSS (should be max-width)
  4. Test on real phone (browser might render differently)
```

### Issue: Header icons not showing
```
❌ Problem: Bell and envelope icons are missing
✅ Solution:
  1. Check Font Awesome CDN link is loaded:
     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/.../all.min.css">
  2. Check internet connection (CDN requires online)
  3. Check console for 404 errors (DevTools → Network)
  4. Try using local Font Awesome files instead
```

### Issue: Notifications panel not opening
```
❌ Problem: Bell icon clicked but nothing happens
✅ Solution:
  1. Check app.js is loaded (DevTools → Sources)
  2. Try clicking envelope icon (test if JS works at all)
  3. Open console (F12) and type: App.toggleNotificationsPanel()
  4. Check for JavaScript errors
  5. Verify app.js is not corrupted
```

### Issue: Form not submitting
```
❌ Problem: Submit button doesn't work
✅ Solution:
  1. Check onsubmit handler exists in form
  2. Check JavaScript function is defined
  3. Check console for JavaScript errors
  4. Verify form inputs have required attributes if needed
  5. Test in different browser
```

---

## 🔍 Debugging Tips

### Using Browser DevTools

**Console Tab:**
```javascript
// Check user data
console.log(App.user);

// Manually trigger notification
App.addNotification('Test', 'success');

// Check stored data
console.log(JSON.parse(localStorage.getItem('notifications')));
```

**Application Tab:**
```
1. Expand "Local Storage"
2. Find your domain
3. Check stored values:
   - userId
   - userName
   - userEmail
   - notifications
   - conversations
```

**Network Tab:**
```
1. Reload page (F5)
2. Check all requests completed
3. Look for 404 errors (red X)
4. Check styles.css loaded successfully
5. Check app.js loaded successfully
```

**Elements Tab:**
```
1. Right-click element → Inspect
2. Check computed styles applied correctly
3. Check element hierarchy correct
4. Look for inline styles overriding CSS
```

### Testing in Console

```javascript
// Test if app is loaded
typeof App !== 'undefined'  // Should be: true

// Check current user
App.user.name
App.user.email

// Manually test notification
App.addNotification('Manual test', 'success')

// Check notifications stored
App.notifications.length

// Total conversations
App.conversations.length

// Clear all data for fresh start
localStorage.clear()
```

---

## 📋 Browser Compatibility Checklist

- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] iPhone Safari
- [ ] Chrome Mobile
- [ ] Opera

---

## 🔧 File Integrity Check

```bash
# Check all files exist
ls -la frontend/*.html
ls -la frontend/styles.css
ls -la frontend/app.js

# Check file sizes are reasonable
wc -l frontend/*.html frontend/*.css frontend/*.js

# Look for common errors
grep -n "alert(" frontend/*.html
grep -n "var " frontend/app.js  # Should use const/let
grep -n "element.href" frontend/*.html
```

---

## ⚡ Performance Testing

### Load Time Testing
```
1. Open Network tab (DevTools → Network)
2. Check "Disable cache"
3. Reload page (Ctrl+Shift+R for hard refresh)
4. See how long each file takes to load
5. Total time should be < 2 seconds
```

### Memory Testing
```
1. Open Memory tab (DevTools → Memory)
2. Click "Take heap snapshot"
3. Reload page
4. Take another snapshot
5. Compare memory usage
6. Should not continuously increase
```

### Responsiveness Testing
```
1. Open DevTools → Network
2. Set throttling to "Slow 3G"
3. Reload page
4. Should still be usable (though slower)
5. No white screen or crashes
```

---

## 🧪 Unit Testing Examples

```javascript
// Test 1: User data saves correctly
localStorage.setItem('testKey', 'testValue');
assert(localStorage.getItem('testKey') === 'testValue');

// Test 2: Notification adds to list
let initialCount = App.notifications.length;
App.addNotification('Test', 'success');
assert(App.notifications.length === initialCount + 1);

// Test 3: Clear notifications works
App.clearNotifications();
assert(App.notifications.length === 0);

// Test 4: User logout clears data
App.logout();
assert(localStorage.getItem('userName') === null);
```

---

## 📊 QA Sign-Off Checklist

- [ ] All pages load without errors
- [ ] All navigation links work
- [ ] Notifications system functional
- [ ] Messaging system functional
- [ ] Authentication flow complete
- [ ] User data persists correctly
- [ ] Responsive design working
- [ ] No console errors
- [ ] Forms validate correctly
- [ ] Performance acceptable
- [ ] No broken links
- [ ] All buttons functional
- [ ] Mobile testing passed
- [ ] Cross-browser testing passed
- [ ] Accessibility standards met

---

## 🚀 Pre-Deployment Checklist

- [ ] All files present and intact
- [ ] No hardcoded test URLs
- [ ] Analytics tracking configured
- [ ] Error reporting configured
- [ ] API endpoints configured
- [ ] SSL certificate installed
- [ ] DNS records updated
- [ ] Cache busting configured
- [ ] Monitoring active
- [ ] Backup system ready
- [ ] Rollback plan documented

---

## 📞 When Something Breaks

1. **Check console first** (F12 → Console tab)
2. **Look for red/pink error messages**
3. **Check network tab for failed requests**
4. **Clear cache and try again** (Ctrl+Shift+Delete)
5. **Test in different browser**
6. **Check file paths are correct**
7. **Verify HTML syntax** (copy to HTML validator)
8. **Search error message online**
9. **Check GitHub issues**
10. **Ask for help with error message**

---

## 🎯 Success Criteria

✅ Page loads completely  
✅ No console errors  
✅ All links working  
✅ Data persists  
✅ Mobile responsive  
✅ Navigation smooth  
✅ Buttons functional  
✅ Forms validating  
✅ Notifications working  
✅ Messages working  
✅ Performance good  
✅ Cross-browser compatible  

---

**If all checks pass, your website is ready for deployment!** 🚀
