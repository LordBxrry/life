# 🏆 Social Score System - Complete Guide

## Overview

The **Social Score System** is a gamification feature that keeps users engaged by rewarding app usage, activity, and community recognition through votes and opinions. Users earn points through various activities and can be voted on by other users, creating a reputation and engagement system.

---

## 📊 How Social Score Works

### Points System

Users earn points through various activities:

| Activity | Points | Frequency | Notes |
|----------|--------|-----------|-------|
| **Login** | +1 | Per login | Automatic, encourages daily engagement |
| **Message Sent** | +2 | Per message | Community interaction |
| **Profile Update** | +2 | Per update | Keeps profiles fresh |
| **Product Listed** | +5 | Per product | High engagement reward |
| **Profile Viewed** | +1 | Per view | Passive engagement |
| **Connection Made** | +3 | Per connection | Network building |
| **Post Created** | +3 | Per post | Content creation |
| **Review Written** | +4 | Per review | Community contribution |
| **Daily Check-in** | +1 | Per day | Retention reward |

### Voting System

Other users can vote on your account, directly impacting your social score:

| Vote Type | Points | Total Votes | Effect |
|-----------|--------|-------------|--------|
| **Upvote** | +10 | Counted | Positive community opinion |
| **Downvote** | -5 | Counted | Negative community opinion |
| **Vote Change** | Variable | Updated | Changed votes recalculated |

### Social Score Calculation

```
Total Social Score = Base Activities Points + Vote Points
```

**Example:**
```
User logs in 30 times/month:          +30 points
User sends 50 messages:               +100 points
User lists 2 products:                +10 points
User receives 100 upvotes:            +1000 points
User receives 20 downvotes:           -100 points
_______________________________________________
Total Social Score:                   +1,040 points
```

---

## 🎯 Key Features

### 1. **Automatic Activity Tracking**
- Login activity is automatically tracked and rewarded
- Activities are logged with timestamps and descriptions
- Points accumulate over time

### 2. **Community Voting**
- Users can upvote (positive opinion) or downvote (negative opinion) other users
- One vote per user per target user (cannot vote multiple times)
- Can change votes if opinion changes
- Votes persist in database with timestamps

### 3. **Leaderboard Rankings**
- Global leaderboard shows top performers
- Ranked by social score (highest first)
- Secondary ranking by upvote count
- Includes pagination support

### 4. **Activity Level Tracking**
- Tracks total number of activities
- Different from social score (score + votes)
- Indicates user engagement frequency

### 5. **Global Rankings**
- Each user has a global rank based on social score
- Rank recalculates in real-time
- Motivates users to climb leaderboard

---

## 🔌 API Endpoints

### 1. Track Activity

**Endpoint:** `POST /api/social/track-activity`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "activity_type": "message_sent",
  "description": "Sent message to John",
  "reference_id": "msg_123"
}
```

**Supported Activity Types:**
- `login`
- `message_sent`
- `profile_update`
- `product_listed`
- `profile_viewed`
- `connection_made`
- `post_created`
- `review_written`
- `daily_check_in`

**Response:**
```json
{
  "success": true,
  "message": "Activity tracked! +2 points",
  "points_earned": 2,
  "user": {
    "id": "user_123",
    "username": "john_doe",
    "social_score": 152,
    "upvotes_count": 45,
    "downvotes_count": 5,
    "activity_level": 89
  }
}
```

---

### 2. Vote on User

**Endpoint:** `POST /api/social/vote/:targetUserId`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "vote_type": "upvote"
}
```

**Parameters:**
- `:targetUserId` - ID of user being voted on
- `vote_type` - "upvote" or "downvote"

**Response - New Vote:**
```json
{
  "success": true,
  "message": "upvote recorded!",
  "action": "created",
  "points_change": 10,
  "target_user": {
    "id": "user_456",
    "username": "jane_doe",
    "social_score": 250,
    "upvotes_count": 46,
    "downvotes_count": 5
  }
}
```

**Response - Updated Vote:**
```json
{
  "success": true,
  "message": "downvote recorded!",
  "action": "updated",
  "points_change": -15,
  "target_user": {
    "id": "user_456",
    "username": "jane_doe",
    "social_score": 235,
    "upvotes_count": 45,
    "downvotes_count": 6
  }
}
```

**Error Responses:**
```json
// Cannot vote on self
{
  "error": true,
  "message": "Cannot vote on your own account"
}

// Invalid vote type
{
  "error": true,
  "message": "vote_type must be \"upvote\" or \"downvote\""
}

// User not found
{
  "error": true,
  "message": "User not found"
}
```

---

### 3. Get User Social Score

**Endpoint:** `GET /api/social/:userId/score`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "bio": "Software developer",
    "location": "San Francisco",
    "social_score": 152,
    "upvotes_count": 45,
    "downvotes_count": 5,
    "activity_level": 89,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-04-01T14:22:35Z",
    "stats": {
      "social_score": 152,
      "upvotes": 45,
      "downvotes": 5,
      "total_votes": 50,
      "like_percentage": 90,
      "activity_level": 89,
      "global_rank": 42
    },
    "recent_activities": [
      {
        "activity_type": "login",
        "points_earned": 1,
        "description": "User logged in",
        "created_at": "2026-04-01T14:22:00Z"
      },
      {
        "activity_type": "message_sent",
        "points_earned": 2,
        "description": "Sent message to Jane",
        "created_at": "2026-04-01T13:15:00Z"
      }
    ]
  }
}
```

---

### 4. Get Leaderboard

**Endpoint:** `GET /api/social/leaderboard/top`

**Authentication:** Not required

**Query Parameters:**
- `limit` - Number of results (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "id": "user_001",
      "username": "top_scorer",
      "avatar_url": "https://...",
      "bio": "Top user on the platform",
      "social_score": 5230,
      "upvotes_count": 450,
      "downvotes_count": 20,
      "activity_level": 1200,
      "like_percentage": 95.7,
      "created_at": "2025-06-10T08:00:00Z"
    },
    {
      "rank": 2,
      "id": "user_002",
      "username": "active_user",
      "avatar_url": "https://...",
      "bio": "Regular contributor",
      "social_score": 4850,
      "upvotes_count": 420,
      "downvotes_count": 15,
      "activity_level": 1100,
      "like_percentage": 96.6,
      "created_at": "2025-07-20T12:45:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 2345,
    "pages": 47
  }
}
```

---

### 5. Get User Ratings

**Endpoint:** `GET /api/social/:userId/ratings`

**Authentication:** Not required

**Query Parameters:**
- `limit` - Number of results (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "ratings": [
    {
      "id": "rating_123",
      "vote_type": "upvote",
      "reason": null,
      "created_at": "2026-03-28T10:15:00Z",
      "rater_id": "user_789",
      "rater_username": "jane_smith",
      "rater_avatar": "https://..."
    },
    {
      "id": "rating_124",
      "vote_type": "downvote",
      "reason": null,
      "created_at": "2026-03-27T15:42:00Z",
      "rater_id": "user_790",
      "rater_username": "bob_jones",
      "rater_avatar": "https://..."
    }
  ],
  "summary": {
    "upvotes": 45,
    "downvotes": 5
  }
}
```

---

### 6. Get My Activity Stats

**Endpoint:** `GET /api/social/my/activity`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "activity_summary": [
    {
      "activity_type": "message_sent",
      "count": 127,
      "total_points": 254
    },
    {
      "activity_type": "login",
      "count": 89,
      "total_points": 89
    },
    {
      "activity_type": "product_listed",
      "count": 8,
      "total_points": 40
    },
    {
      "activity_type": "profile_update",
      "count": 12,
      "total_points": 24
    }
  ],
  "stats": {
    "social_score": 407,
    "upvotes_count": 45,
    "downvotes_count": 5,
    "activity_level": 236
  }
}
```

---

## 🔐 Permission & Authentication

- **Track Activity:** Requires authentication (user can only track for themselves)
- **Vote on User:** Requires authentication (user can vote on any other user)
- **Get User Score:** Public (no authentication required)
- **Get Leaderboard:** Public (no authentication required)
- **Get User Ratings:** Public (no authentication required)
- **Get My Activity:** Requires authentication (personal endpoint)

---

## 📈 User Profile Integration

### Profile Endpoint Returns Social Score

**Endpoint:** `GET /api/users/profile`

**Response Includes:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "stats": {
      "connections": 45,
      "unreadMessages": 3,
      "social_score": 152,
      "upvotes": 45,
      "downvotes": 5,
      "like_percentage": 90,
      "activity_level": 89,
      "global_rank": 42
    }
  }
}
```

### Get Any User Profile

**Endpoint:** `GET /api/users/:id`

**Response Includes Social Score:**
```json
{
  "success": true,
  "user": {
    "id": "user_456",
    "username": "jane_doe",
    "full_name": "Jane Doe",
    "stats": {
      "social_score": 389,
      "upvotes": 78,
      "downvotes": 8,
      "like_percentage": 90.7,
      "activity_level": 156,
      "global_rank": 18
    }
  }
}
```

---

## 🚀 Frontend Integration

### Display Social Score on Profile

```javascript
// Fetch user profile with social score
const response = await fetch('/api/users/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
const socialScore = data.user.stats.social_score;
const rank = data.user.stats.global_rank;
const likePercentage = data.user.stats.like_percentage;

// Display in UI
document.getElementById('socialScore').textContent = socialScore;
document.getElementById('globalRank').textContent = `#${rank}`;
document.getElementById('likePercentage').textContent = `${likePercentage}%`;
```

### Vote on User

```javascript
async function voteOnUser(userId, voteType) {
  const response = await fetch(`/api/social/vote/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ vote_type: voteType })
  });
  const data = await response.json();
  console.log(`${voteType} recorded!`, data);
}

// Usage
await voteOnUser('user_456', 'upvote');
```

### Show Leaderboard

```javascript
// Fetch top 10 users
const response = await fetch('/api/social/leaderboard/top?limit=10&offset=0');
const data = await response.json();

// Display leaderboard
data.leaderboard.forEach(user => {
  console.log(`${user.rank}. ${user.username} - ${user.social_score} points`);
});
```

### Track Activity

```javascript
async function trackActivity(activityType, description) {
  const response = await fetch('/api/social/track-activity', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      activity_type: activityType,
      description: description
    })
  });
  const data = await response.json();
  console.log(`Activity tracked: +${data.points_earned} points`);
}

// Usage
await trackActivity('message_sent', 'Sent message to Jane');
```

---

## 💡 Best Practices

### For Users
- **Stay Active:** Log in daily to earn consistent points (1 point per login)
- **Engage with Community:** Message, create posts, and list products for points
- **Build Reputation:** Earn upvotes from community to boost score significantly
- **Check Leaderboard:** See where you rank and aim higher
- **Update Profile:** Keep your profile fresh for points and better connections

### For Developers
- **Track Meaningful Activities:** Only track activities that add value
- **Call `/track-activity` at Right Time:** After user completes action
- **Handle Vote Errors:** Inform user when they try to vote on themselves
- **Cache Leaderboard:** Consider caching leaderboard in frontend for performance
- **Monitor Downvotes:** Implement moderation if downvote counts get too high

### For Moderators (Admins)
- **Monitor Activity:** Use admin dashboard to check suspicious activity patterns
- **Prevent Gaming:** Watch for scripts auto-tracking activities
- **Review Downvotes:** Check if user is being unfairly targeted
- **Seasonal Resets:** Consider resetting scores seasonally if desired
- **Highlight Top Users:** Feature top users in app marketing

---

## 🎮 Engagement Strategy

### Short-term (Daily - 1 week)
- Daily login rewards (+1 point)
- Quick activities (messages, profile views)
- Early leaderboard competition

### Medium-term (Weekly - 1 month)
- Sustained activity accumulation
- Community voting engaging users
- Product listings rewarded
- Building connections

### Long-term (Monthly - Quarterly)
- Top performers become influential
- Leaderboard goals motivate users
- Reputation becomes currency
- High-score users get badges/recognition

---

## 📊 Database Schema

### Users Table Additions
```sql
social_score INTEGER DEFAULT 0        -- Total accumulated points
upvotes_count INTEGER DEFAULT 0       -- Total upvotes received
downvotes_count INTEGER DEFAULT 0     -- Total downvotes received
activity_level INTEGER DEFAULT 0      -- Total activities performed
```

### User Ratings Table
```sql
CREATE TABLE user_ratings (
  id TEXT PRIMARY KEY,
  rater_id TEXT NOT NULL,              -- User who voted
  rated_user_id TEXT NOT NULL,         -- User being voted on
  vote_type TEXT NOT NULL,             -- 'upvote' or 'downvote'
  reason TEXT,                         -- Optional reason
  created_at DATETIME,
  updated_at DATETIME,
  UNIQUE(rater_id, rated_user_id),
  FOREIGN KEY (rater_id) REFERENCES users(id),
  FOREIGN KEY (rated_user_id) REFERENCES users(id)
);
```

### User Activities Table
```sql
CREATE TABLE user_activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,               -- User performing activity
  activity_type TEXT NOT NULL,         -- Type of activity
  points_earned INTEGER DEFAULT 0,     -- Points earned
  description TEXT,                    -- Activity description
  reference_id TEXT,                   -- Reference to related object
  created_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 📲 Example Use Cases

### Use Case 1: Engagement Retention
```
User A plays for 2 weeks but hasn't checked social score
→ Show "You have 42 points! Rank #127"
→ Compare to friend's score (98 points, Rank #45)
→ Motivates return + competition
```

### Use Case 2: Community Recognition
```
User B receives many upvotes
→ Score jumps from 50 to 150 points
→ Appears on leaderboard
→ Gets recognition → stays engaged
```

### Use Case 3: Feedback Mechanism
```
User C provides poor service
→ Gets downvoted by customers
→ Score drops + visible in profile
→ Incentive to improve service quality
```

---

## 🔧 Configuration

### Activity Points (Customizable)

Edit `backend/routes/social.js` to adjust points:

```javascript
const activityPoints = {
  'login': 1,              // Change to 2 for more login incentive
  'message_sent': 2,       // Change to 3 for messaging focus
  'profile_update': 2,
  'product_listed': 5,     // High value activity
  'profile_viewed': 1,
  'connection_made': 3,
  'post_created': 3,
  'review_written': 4,
  'daily_check_in': 1
};
```

### Vote Points (Hard-coded in logic)

- Upvote: +10 points
- Downvote: -5 points
- Change from upvote to downvote: -15 points total
- Change from downvote to upvote: +15 points total

---

## 🎊 Summary

The **Social Score System** creates a gamified experience that:

✅ **Rewards Activity:** Users earn points through engagement  
✅ **Empowers Community:** Users vote on other users  
✅ **Drives Retention:** Daily logins + point accumulation  
✅ **Builds Reputation:** High scores = trusted community members  
✅ **Increases Engagement:** Leaderboard competition motivates users  
✅ **Creates Feedback Loop:** Community votes improve behavior  

**Result:** Users stay active, engaged, and invested in the platform! 🚀

---

**Version:** 1.0.0  
**Last Updated:** April 1, 2026  
**Status:** Ready for Production ✅
