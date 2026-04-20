# 🚀 Social Score - Quick Start

## What is Social Score?

A **gamification system** that:
- ⬆️ **Increases** with user activity (logins, messages, posts, products)
- 👍 **Increases/Decreases** based on community votes (upvote +10, downvote -5)
- 🏆 **Ranks** users on a leaderboard
- 🎯 **Keeps users engaged** with continuous rewards

---

## 🎯 Start Using (30 Seconds)

### 1. Your Social Score Starts at 0
```
After registration: 0 points
First login: +1 point = 1 social score
```

### 2. Earn Points Through Activity
```
Login daily:        +1 point/login
Send message:       +2 points
Update profile:     +2 points
List product:       +5 points
Write review:       +4 points
```

### 3. Get Voted On by Community
```
Upvote from user:   +10 points
Downvote from user: -5 points (watch your behavior!)
```

---

## 🏅 Check Your Score

### Via Profile
```bash
GET /api/users/profile
```
Returns your social score, rank, upvotes, downvotes, and activity level

### Via Social Score Endpoint
```bash
GET /api/social/{userId}/score
```
Shows complete breakdown: rank, recent activities, voting stats

---

## 🗳️ Vote on Users

### Upvote Someone
```bash
POST /api/social/vote/{userId}
{
  "vote_type": "upvote"
}
```
**Effect:** +10 points to their social score

### Downvote Someone  
```bash
POST /api/social/vote/{userId}
{
  "vote_type": "downvote"
}
```
**Effect:** -5 points to their social score

### Change Your Vote
```bash
POST /api/social/vote/{userId}
{
  "vote_type": "different_vote_type"
}
```
**Effect:** Points recalculated automatically

---

## 📊 View Leaderboard

### Get Top Users
```bash
GET /api/social/leaderboard/top?limit=10&offset=0
```

**Response Shows:**
```
Rank 1: john_doe        - 5,230 points  ⭐
Rank 2: jane_smith      - 4,850 points
Rank 3: bob_johnson     - 4,520 points
...
Your Rank: #127 - 152 points
```

---

## 📈 Points Breakdown Example

```
Alice's Social Score Calculation:

Daily Activity (89 logins):              +89 points
Messages sent (50):                      +100 points
Profile updates (8):                     +16 points
Products listed (3):                     +15 points
___________________________________________________
= 220 points from activities

Community Votes:
+ 35 upvotes × 10 points:                +350 points
- 5 downvotes × 5 points:                -25 points
___________________________________________________
= 325 points from votes

TOTAL SOCIAL SCORE: 545 points ✨
Global Rank: #23 🏆
Like Percentage: 87.5% 👍
```

---

## 🎮 Engagement Tips

### Earn More Points
✅ **Login daily** - Free point every day  
✅ **Send messages** - Connect with others  
✅ **Keep profile updated** - Show you're active  
✅ **List products/services** - 5 points each!  
✅ **Write reviews** - Help community  
✅ **Make connections** - Network = points  

### Get More Upvotes
✅ Provide good service  
✅ Be helpful to community  
✅ Engage positively  
✅ Build your reputation  
✅ Stay professional  

### Climb the Leaderboard
✅ Consistent daily activity  
✅ High-quality interactions  
✅ Community service  
✅ Build positive reputation  
✅ Aim for top 10!  

---

## 📱 Frontend Display Ideas

### Show on Profile Page
```html
<div class="social-score">
  <h3>Social Score</h3>
  <p class="score">520 points</p>
  <p class="rank">Global Rank: #42</p>
  <p class="votes">
    👍 45 upvotes | 👎 5 downvotes (90%)
  </p>
</div>
```

### Show on Dashboard
```html
<div class="leaderboard-preview">
  <h3>🏆 Leaderboard</h3>
  <ol>
    <li>top_user: 5,230 pts</li>
    <li>active_user: 4,850 pts</li>
    <li>you_here: 520 pts ← You are here</li>
  </ol>
</div>
```

### Show Vote Buttons on Profile
```html
<div class="user-actions">
  <button onclick="upvote(userId)">👍 Upvote</button>
  <button onclick="downvote(userId)">👎 Downvote</button>
  <p>Your vote: upvote ✓</p>
</div>
```

### Show Activity Feed
```html
<div class="activity">
  <h4>Recent Activity</h4>
  <ul>
    <li>📱 Logged in - +1 pt</li>
    <li>💬 Sent message - +2 pts</li>
    <li>📦 Listed product - +5 pts</li>
    <li>⭐ Received upvote - +10 pts</li>
  </ul>
</div>
```

---

## 🔌 API Quick Reference

| Action | Endpoint | Method | Auth |
|--------|----------|--------|------|
| Get my profile | `/api/users/profile` | GET | ✅ |
| Get any user profile | `/api/users/{id}` | GET | ❌ |
| Get my social score | `/api/social/{userId}/score` | GET | ❌ |
| Track activity | `/api/social/track-activity` | POST | ✅ |
| Vote on user | `/api/social/vote/{userId}` | POST | ✅ |
| View leaderboard | `/api/social/leaderboard/top` | GET | ❌ |
| Get user ratings | `/api/social/{userId}/ratings` | GET | ❌ |
| My activities | `/api/social/my/activity` | GET | ✅ |

---

## 💡 Smart Strategies

### Strategy 1: Daily Engagement
```
Day 1: Login (+1) = 1 point
Day 2: Login (+1) + Message (+2) = 4 points total
Day 3: Login (+1) + Message (+2) + Profile update (+2) = 9 points total
...
Month 1: 30 logins + 50 messages = 130 points
```

### Strategy 2: Quality Over Quantity
```
5 products listed (+5 each) = 25 points
vs.
100 logins (+1 each) = 100 points
→ Consistent activity > occasional big actions
```

### Strategy 3: Build Community Reputation
```
New user: 0 points
→ Provide excellent service for 1 week
→ Get 10 upvotes from satisfied users = +100 points
→ Jump to 100+ points with good reputation
→ More people trust your upvotes now
```

---

## ❓ FAQ

**Q: Can I lose points?**  
A: Yes! Downvotes cost -5 points. Focus on positive interactions.

**Q: How is rank calculated?**  
A: By social_score (highest = #1). Ties broken by upvote_count.

**Q: Can I vote on myself?**  
A: No, the system prevents self-voting.

**Q: Can I change my vote?**  
A: Yes! POST the new vote type and points recalculate.

**Q: Does voting have a cooldown?**  
A: No, vote whenever you want (but only one vote per user per target).

**Q: Are points tradeable?**  
A: No, they're personal reputation only.

**Q: What happens if I get banned?**  
A: Admin can deactivate account. Score freezes.

---

## 🎯 Your Goal

```
Week 1:     Get to 50 points (consistent logins + activities)
Week 4:     Get to 200 points (build reputation + upvotes)  
Month 3:    Reach top 100 leaderboard
Month 6:    Reach top 10 leaderboard
Year 1:     Become community leader ⭐
```

---

## 🚀 Get Started Now!

1. **Login** - Get your first +1 point ✅
2. **Send a message** - Get +2 more points ✅
3. **Update profile** - Get +2 more points ✅
4. **Check leaderboard** - See where you rank 🏆
5. **Ask friends to vote** - Get +10 per upvote ⭐

**Your social score journey starts now!**

---

For detailed technical information, see [SOCIAL_SCORE_GUIDE.md](SOCIAL_SCORE_GUIDE.md)

**Version:** 1.0  
**Status:** Ready to use ✅
