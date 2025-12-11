# 🚀 Deployment Instructions

## Critical: DELETE Policies Migration Required

### ⚠️ Why You Need This
Projects, campaigns, tasks, lists, and labels **cannot be deleted** until you run this migration. The DELETE RLS (Row Level Security) policies are missing from your Supabase database.

---

## 📋 Step-by-Step Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy the Migration SQL**
   - Open the file: `supabase/migrations/20241211_add_delete_policies.sql`
   - Select all content (Cmd+A)
   - Copy (Cmd+C)

4. **Run the Migration**
   - Paste the SQL into the query editor
   - Click "Run" or press Cmd+Enter
   - Wait for success message

5. **Verify Policies Created**
   - Scroll down to see the verification query results
   - You should see 5 new DELETE policies listed

---

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to project directory
cd "/Users/gabrielrios/Desktop/Project Management"

# Run the migration
supabase db push

# Or run the specific migration file
supabase migration up
```

---

## ✅ What This Migration Does

Creates 5 DELETE policies for:
- ✅ **Projects** - Allows org members to delete projects
- ✅ **Campaigns** - Allows org members to delete campaigns  
- ✅ **Tasks** - Allows org members to delete tasks (via campaigns)
- ✅ **Lists** - Allows org members to delete lists (via campaigns)
- ✅ **Labels** - Allows org members to delete labels

### Security Pattern
Each policy checks:
1. User is authenticated (`auth.uid()`)
2. User is a member of the organization (`org_members` table)
3. The resource belongs to their organization

---

## 🧪 Testing After Migration

### Test Deletions

1. **Delete a Task**
   - Open any project → campaign
   - Click delete (trash icon) on a task
   - Should delete immediately ✓

2. **Delete a List**
   - Go to a campaign
   - Delete a list from the kanban view
   - Should remove immediately ✓

3. **Delete a Campaign**
   - Open a project
   - Delete a campaign
   - Should remove immediately ✓

4. **Delete a Project**
   - Go to All Projects
   - Click delete on a project
   - Should remove immediately ✓

5. **Delete a Label**
   - Go to Labels view
   - Delete a label
   - Should remove immediately ✓

---

## 🐛 Troubleshooting

### "Still can't delete after migration"

**Check if migration ran successfully:**
```sql
-- Run this in SQL Editor
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('projects', 'campaigns', 'tasks', 'lists', 'labels')
  AND cmd = 'DELETE';
```

**Expected Result:** 5 rows showing DELETE policies

---

### "Error: permission denied for table"

**Check your role:**
```sql
-- Run this in SQL Editor
SELECT * FROM org_members WHERE user_id = auth.uid();
```

**Expected Result:** At least one row showing your org membership

---

### "Items disappear but reappear on refresh"

This means:
- ✅ Frontend is working
- ❌ Backend DELETE policy is missing

**Solution:** Re-run the migration SQL

---

## 📝 Migration File Location

```
supabase/migrations/20241211_add_delete_policies.sql
```

---

## 🎯 Summary

**Before Migration:**
- ❌ Cannot delete projects
- ❌ Cannot delete campaigns
- ❌ Cannot delete tasks
- ❌ Cannot delete lists
- ❌ Cannot delete labels

**After Migration:**
- ✅ All deletions work
- ✅ Proper permission checks
- ✅ Organization isolation
- ✅ Real-time updates

---

## ✨ Recent Updates Deployed

### Dark Mode (Complete) ✅
- Light/Dark/System theme switcher in user dropdown
- GitHub-style dark colors
- Persists across devices
- Smooth transitions

### Completed Projects (Complete) ✅
- Clickable checkboxes on project cards
- Real-time updates (no reload needed)
- Recently Completed view
- Auto-filtering from All Projects

### Mobile Responsive (Complete) ✅
- Better touch targets
- Proper spacing on mobile
- Text wrapping and truncation
- Responsive layouts throughout

---

**Need help?** Check the console for any error messages and include them when asking for support.
