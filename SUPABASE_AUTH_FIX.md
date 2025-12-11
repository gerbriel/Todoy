# 🔐 Fix Supabase Authentication - Redirect URLs

## Problem
Getting 400 error when trying to login/create things:
```
llygmucahdxrzbzepkzg.supabase.co/auth/v1/token?grant_type=password:1 
Failed to load resource: the server responded with a status of 400
```

## Solution: Add Redirect URLs to Supabase

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/llygmucahdxrzbzepkzg

2. **Click "Authentication" in left sidebar**

3. **Click "URL Configuration"**

4. **Set Site URL:**
   ```
   https://gerbriel.github.io/Todoy/
   ```

5. **Add Redirect URLs** (click "Add URL" for each):
   ```
   http://localhost:5173/Todoy/
   http://localhost:5173/Todoy
   https://gerbriel.github.io/Todoy/
   https://gerbriel.github.io/Todoy
   ```

6. **Click "Save"**

---

### Option 2: Check Current Auth Config

You can also check your current auth config in Supabase:

1. Go to **Authentication → URL Configuration**
2. Make sure these are set:

**Site URL:**
- Main URL where your app lives
- Should be: `https://gerbriel.github.io/Todoy/`

**Redirect URLs:**
- All URLs where users can be redirected after login
- Must include both production and development URLs

---

## Why This Matters

Supabase Auth **requires** that all redirect URLs are explicitly whitelisted for security. If your app tries to redirect to a URL that's not in the list, you'll get a 400 error.

---

## After Adding URLs

1. **Wait 1-2 minutes** for changes to propagate
2. **Clear browser cache** or use incognito mode
3. **Try logging in again**
4. **Try creating a project**

---

## Test Checklist

After fixing:

- [ ] Can login on localhost:5173
- [ ] Can create project on localhost:5173
- [ ] Project persists after refresh on localhost:5173
- [ ] Can login on gerbriel.github.io
- [ ] Can create project on gerbriel.github.io
- [ ] Project persists after refresh on gerbriel.github.io

---

## Additional Check: Email Confirmation

If you're still having issues, check if **Email Confirmation** is required:

1. Go to **Authentication → Providers → Email**
2. Check if **"Confirm email"** is enabled
3. If yes, you need to confirm your email before you can use the app

To disable email confirmation (for testing):
1. Go to **Authentication → Providers → Email**
2. Uncheck **"Confirm email"**
3. Click **Save**

---

## Still Not Working?

Check these:

### 1. RLS Policies
Make sure your Row Level Security policies allow authenticated users to insert:

```sql
-- Check if INSERT policy exists for projects
SELECT * FROM pg_policies WHERE tablename = 'projects';
```

### 2. Organization Assignment
Make sure your user is assigned to an organization:

```sql
-- Check your user's organization membership
SELECT * FROM org_members WHERE user_id = 'your-user-id';
```

If you're not in any organization, create one:

```sql
-- Create an organization and add yourself
INSERT INTO organizations (name, description) 
VALUES ('My Organization', 'Default organization')
RETURNING id;

-- Add yourself to the organization (replace the IDs)
INSERT INTO org_members (user_id, org_id, role)
VALUES ('your-user-id', 'org-id-from-above', 'owner');
```

---

## Quick Fix Summary

**Most likely issue:** Missing redirect URLs in Supabase Auth config

**Fix:** Add all your app URLs to Supabase → Authentication → URL Configuration

**Time:** 2 minutes

**After fix:** Clear cache and test again
