# 🔍 Level Update Issue - Diagnosis & Fix

## 🎯 Problem:
Achievements are unlocking (you can see "Avatar setter" and "Phone verified" with dates), but the **level is not updating** even though XP should have been awarded.

---

## 📊 Step 1: Check Current Status

### Open the debug page:
1. Go to http://localhost:3000/gamification
2. Click the blue button **"🔍 Проверить уровень и XP"**
3. Review the debug panel that appears

### What to look for:

#### ✅ If you see this:
```
⚠️ Таблица user_levels не найдена! Выполните SQL миграцию.
```
**Problem:** The gamification tables don't exist in your database yet.

**Solution:** Execute the SQL migration (see Step 2 below).

---

#### ✅ If you see level data:
Check these values:
- **Уровень (Level):** Should be 1 or higher
- **Текущий XP (Current XP):** Should show accumulated XP
- **До следующего (To next level):** How much XP needed for next level
- **Всего заработано XP (Total XP earned):** Total XP from all sources

**Example of correct behavior:**
```
Level: 1
Current XP: 100
To next level: 100
Total XP earned: 100
```

If Current XP >= To next level, you should have leveled up automatically.

---

## 🔧 Step 2: Execute SQL Migration (if needed)

If the debug panel shows "Таблица user_levels не найдена", you need to run the migration:

### Option A: Use Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the entire content of `create-gamification-tables.sql`
5. Click **Run**

### Option B: Use psql command line

```bash
psql -h your-project.supabase.co -U postgres -d postgres -f create-gamification-tables.sql
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Achievements unlock but XP doesn't accumulate

**Symptoms:**
- You see achievements with dates
- But Current XP = 0 or very low
- Level stays at 1

**Possible causes:**
1. Database trigger not working
2. XP history table missing
3. AwardXP function failing silently

**Fix:**
1. Check browser console for errors
2. Look at XP History section in debug panel
3. If empty, the awardXP function isn't being called

---

### Issue 2: XP accumulates but level doesn't increase

**Symptoms:**
- Current XP: 150
- To next level: 100
- But Level still shows 1

**This shouldn't happen** if the code is working correctly. The `awardXP()` function checks:
```typescript
if (userLevel.xp >= userLevel.xp_to_next_level) {
  await levelUp(userId, userLevel.level);
}
```

**Possible fix:**
1. Refresh the page
2. Try triggering another achievement
3. Check if there's a database constraint preventing updates

---

### Issue 3: Level resets after update

**Symptoms:**
- You reach level 2
- After refresh, back to level 1

**Cause:** The `levelUp()` function resets XP to 0 (line 62 in gamification.ts):
```typescript
SET level = ${newLevel},
    xp = 0,  // ← This resets XP
    xp_to_next_level = ${newXpRequired},
```

**This is intentional** - when you level up, XP resets and you start earning toward the next level.

---

## 📝 Expected Flow

When you set avatar and phone:

1. **Profile check triggers** → calls `/api/gamification/check-all`
2. **checkAchievements() runs** → detects avatar_setter and phone_verified
3. **unlockAchievement() called** → inserts into user_achievements table
4. **awardXP() called** → adds 50 XP to user_levels
5. **Level check happens** → if XP >= xp_to_next_level, level up!

**Expected result:**
- Avatar setter: +50 XP
- Phone verified: +50 XP
- **Total: 100 XP** → Should trigger level up to Level 2!

---

## 🔍 Debug Checklist

Run through this checklist:

- [ ] Visit http://localhost:3000/gamification
- [ ] Click "🔍 Проверить уровень и XP"
- [ ] Check if userLevel data exists
- [ ] Verify Current XP value
- [ ] Check XP History for entries
- [ ] Look for "Достижение:" entries in history
- [ ] Verify achievements list shows unlocked ones
- [ ] Compare Current XP vs To next level

---

## 🚀 Quick Fix Commands

If everything looks correct but level still won't update, try forcing a re-check:

### In browser console (F12):
```javascript
// Force check all achievements
fetch('/api/gamification/check-all', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(d => console.log('Unlocked:', d));
```

### Or manually add XP (for testing):
```javascript
// Add 100 XP manually
fetch('/api/gamification/debug', {
  method: 'GET',
  credentials: 'include'
})
.then(r => r.json())
.then(d => console.log('Current status:', d));
```

---

## 📞 Still Not Working?

Share the debug panel output:
1. Take a screenshot of the debug panel
2. Copy the console logs (F12 → Console tab)
3. Share what you see in:
   - Уровень (Level)
   - Текущий XP (Current XP)
   - До следующего (To next level)
   - Всего заработано XP (Total XP earned)
   - История XP (XP History) - first 5 entries
   - Разблокированные достижения (Unlocked achievements)

---

## 💡 Pro Tip

After executing the SQL migration, **log out and log back in** to ensure the user_levels entry is created properly by the database trigger.

The trigger in `create-gamification-tables.sql` automatically creates a level entry when a new user registers:
```sql
CREATE TRIGGER trigger_create_user_level
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_level();
```

But for existing users, you might need to create it manually:
```sql
INSERT INTO user_levels (user_id, level, xp, xp_to_next_level, title, coins)
SELECT id, 1, 0, 100, 'Новичок', 0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_levels)
ON CONFLICT (user_id) DO NOTHING;
```
