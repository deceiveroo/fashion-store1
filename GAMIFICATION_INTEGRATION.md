# 🎮 Gamification System - Integration Guide

## ✅ What's Implemented

### 1. Database Schema (Supabase)
- ✅ `user_levels` - User levels, XP, titles, coins
- ✅ `achievements` - 11 pre-seeded achievements
- ✅ `user_achievements` - Unlocked achievements tracking
- ✅ `daily_quests` - 5 daily quests
- ✅ `user_quest_progress` - Quest completion tracking
- ✅ `xp_history` - XP transaction log
- ✅ `leaderboard` - Ranking system
- ✅ Auto-trigger for creating user levels on registration
- ✅ PostgreSQL functions for XP calculation and titles

### 2. API Endpoints
- ✅ `GET /api/gamification/profile` - Get user level and stats
- ✅ `GET /api/gamification/achievements` - Get all achievements with unlock status
- ✅ `POST /api/gamification/award-xp` - Award XP to user
- ✅ `POST /api/gamification/check-achievements` - Check and unlock achievements

### 3. Components
- ✅ `GamificationProfileWidget` - Compact widget for profile page
- ✅ `GamificationDashboard` - Full dashboard with all achievements
- ✅ `GamificationWidget` - Minimal widget (can be used anywhere)
- ✅ `AchievementNotification` - Toast notification for unlocks

### 4. Pages
- ✅ `/profile` - Shows gamification widget at the top
- ✅ `/gamification` - Full gamification dashboard page

### 5. Utilities
- ✅ `lib/gamification.ts` - Core gamification logic
- ✅ `hooks/useGamification.ts` - React hook for easy integration

## 📍 Where It's Displayed

### Profile Page (`/profile`)
The gamification widget is displayed at the top of the profile page, showing:
- Current level and title
- XP progress bar
- Coins balance
- Achievement count
- Link to full dashboard

### Gamification Page (`/gamification`)
Full dashboard accessible at `/gamification` showing:
- Level card with XP progress
- Stats grid (achievements, level, XP, coins)
- All achievements with unlock status
- Rarity-based styling (common, rare, epic, legendary)

## 🔧 Setup Instructions

### Step 1: Execute SQL in Supabase
```bash
# Run this SQL file in your Supabase SQL Editor
create-gamification-tables.sql
```

This will:
- Create all 7 tables
- Add 11 achievements
- Add 5 daily quests
- Create PostgreSQL functions
- Set up auto-trigger for new users

### Step 2: Verify Tables
Check in Supabase that these tables exist:
- user_levels
- achievements
- user_achievements
- daily_quests
- user_quest_progress
- xp_history
- leaderboard

### Step 3: Test the System
1. Visit `/profile` - You should see the gamification widget
2. Visit `/gamification` - You should see the full dashboard
3. Check that your level shows as "Уровень 1" with "Новичок" title

## 🎯 How to Integrate with User Actions

### Example 1: Award XP on Purchase
```typescript
import { useGamification } from '@/hooks/useGamification';

function CheckoutPage() {
  const { trackAction } = useGamification();

  const handlePurchase = async () => {
    // ... purchase logic ...
    
    // Award XP and check achievements
    await trackAction('purchase', 50); // 50 XP for purchase
  };
}
```

### Example 2: Track Favorites
```typescript
const handleAddToFavorites = async (productId: string) => {
  // ... add to favorites logic ...
  
  await trackAction('favorite', 10); // 10 XP for adding favorite
};
```

### Example 3: Manual XP Award
```typescript
const { awardXP } = useGamification();

await awardXP(25, 'Заполнение профиля', { section: 'personal' });
```

### Example 4: Check Specific Achievement
```typescript
const { checkAchievements } = useGamification();

// After user makes a purchase
await checkAchievements('purchase');

// After user adds to favorites
await checkAchievements('favorite');

// On login
await checkAchievements('login');
```

## 🏆 Achievement List

### Shopping (Покупки)
1. **Первые шаги** - First purchase (50 XP, 10 coins)
2. **Модник** - 10 purchases (200 XP, 50 coins)
3. **Шопоголик** - 50 purchases (500 XP, 150 coins)
4. **VIP персона** - Spend 100,000₽ (1000 XP, 500 coins)

### Social (Социальные)
5. **Коллекционер** - 10 favorites (100 XP, 20 coins)
6. **Критик моды** - 5 reviews (150 XP, 30 coins)
7. **Инфлюенсер** - Invite 5 friends (300 XP, 100 coins)

### Special (Специальные)
8. **Ранняя пташка** - Login at 6 AM (50 XP, 10 coins)
9. **Сова** - Login at 2 AM (50 XP, 10 coins)
10. **Неделя подряд** - 7-day login streak (200 XP, 50 coins)
11. **С днём рождения!** - Purchase on birthday (500 XP, 200 coins)

## 🎨 Styling & Themes

### Rarity Colors
- **Common**: Gray gradient
- **Rare**: Blue-cyan gradient
- **Epic**: Purple-pink gradient
- **Legendary**: Yellow-orange gradient

### Level Titles
- Level 1-4: Новичок
- Level 5-9: Любитель моды
- Level 10-14: Модник
- Level 15-19: Стиляга
- Level 20-29: Модный эксперт
- Level 30-39: Гуру стиля
- Level 40-49: Легенда моды
- Level 50+: Икона стиля

## 🔄 XP Formula
```
XP to next level = 100 * (level ^ 1.5)

Level 1 → 2: 100 XP
Level 2 → 3: 282 XP
Level 3 → 4: 519 XP
Level 5 → 6: 1118 XP
Level 10 → 11: 3162 XP
```

## 💰 Coin Rewards
- Level up: `level * 10` coins
- Achievements: 10-500 coins depending on rarity
- Can be used for future features (discounts, exclusive items, etc.)

## 🚀 Next Steps to Make It Perfect

### 1. Add to Header
Show mini gamification indicator in the header:
```typescript
// components/Header.tsx
import { useEffect, useState } from 'react';

const [userLevel, setUserLevel] = useState(null);

useEffect(() => {
  fetch('/api/gamification/profile')
    .then(res => res.json())
    .then(data => setUserLevel(data));
}, []);

// Display: Level badge with XP bar
```

### 2. Integrate with Existing Actions
Add gamification tracking to:
- ✅ Order completion → `trackAction('purchase', 50)`
- ✅ Add to favorites → `trackAction('favorite', 10)`
- ✅ Write review → `trackAction('review', 20)`
- ✅ Profile completion → `trackAction('profile', 30)`
- ✅ Daily login → `trackAction('login', 5)`

### 3. Add Achievement Notifications
```typescript
// In your main layout or app component
import AchievementNotification from '@/components/gamification/AchievementNotification';
import { useGamification } from '@/hooks/useGamification';

const { unlockedAchievement, clearAchievement } = useGamification();

<AchievementNotification 
  achievement={unlockedAchievement} 
  onClose={clearAchievement} 
/>
```

### 4. Daily Quests (Future)
Implement daily quest tracking:
- Daily login
- View 5 products
- Add to cart
- Complete profile
- Add to favorites

### 5. Leaderboard (Future)
Create leaderboard page showing:
- Top users by level
- Top users by achievements
- Weekly/monthly rankings

## 🐛 Troubleshooting

### Issue: Widget not showing
- Check that SQL was executed in Supabase
- Verify user_levels table has entry for your user
- Check browser console for API errors

### Issue: Achievements not unlocking
- Verify achievements table has seed data
- Check that user actions are calling `checkAchievements()`
- Look at xp_history table to see if XP is being awarded

### Issue: XP not updating
- Check user_levels table directly in Supabase
- Verify API endpoints are accessible
- Check for CORS or authentication issues

## 📊 Database Queries for Testing

### Check user level
```sql
SELECT * FROM user_levels WHERE user_id = 'YOUR_USER_ID';
```

### Check unlocked achievements
```sql
SELECT a.name, ua.unlocked_at 
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = 'YOUR_USER_ID';
```

### Check XP history
```sql
SELECT * FROM xp_history 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC;
```

### Manually award XP (for testing)
```sql
UPDATE user_levels 
SET xp = xp + 100, coins = coins + 50 
WHERE user_id = 'YOUR_USER_ID';
```

## ✨ Features Summary

✅ Complete database schema with 7 tables
✅ 11 pre-seeded achievements across 3 categories
✅ 5 daily quests ready to implement
✅ Automatic level progression with XP formula
✅ Dynamic title system based on level
✅ Coin economy system
✅ Beautiful UI with rarity-based styling
✅ Profile widget integration
✅ Full dashboard page
✅ API endpoints for XP and achievements
✅ React hooks for easy integration
✅ Achievement notification component
✅ PostgreSQL functions and triggers

## 🎉 Result

You now have a fully functional, innovative gamification system that:
- Motivates users to engage with your fashion store
- Rewards purchases, social actions, and special behaviors
- Provides visual feedback with beautiful UI
- Tracks progress with levels, XP, and achievements
- Offers a coin economy for future features
- Integrates seamlessly with your existing app

The system is ready to use and can be easily extended with more achievements, quests, and features!
