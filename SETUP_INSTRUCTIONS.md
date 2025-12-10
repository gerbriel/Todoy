# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: Todoy (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait ~2 minutes for setup to complete

## Step 2: Get Your Credentials

1. Go to **Settings** → **API** in the left sidebar
2. Copy these values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string starting with eyJ)

## Step 3: Create .env File

1. In VS Code, copy `.env.example` to `.env`
2. Paste your credentials:
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your_long_key_here
```

## Step 4: Run Database Schema

1. In Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click "New query"
3. Open `SUPABASE_MIGRATION_PLAN.md` in VS Code
4. Copy the **entire SQL schema** (starts with `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

## Step 5: Verify Tables Created

1. Click **Table Editor** in the left sidebar
2. You should see all tables:
   - profiles
   - organizations
   - org_members
   - org_invites
   - projects
   - campaigns
   - lists
   - tasks
   - labels
   - stage_dates
   - subtasks
   - comments
   - attachments
   - notifications
   - etc.

## Step 6: Test Connection

1. Restart your dev server (Ctrl+C, then `npm run dev`)
2. Open browser console (F12)
3. You should NOT see "Missing Supabase environment variables!" error
4. If you see the error, check your .env file

## What's Done So Far ✅

- ✅ Installed Supabase client (`@supabase/supabase-js`)
- ✅ Created Supabase client configuration (`src/lib/supabase.ts`)
- ✅ Created database types placeholder (`src/lib/database.types.ts`)
- ✅ Created projects service (`src/services/projects.service.ts`)
- ✅ Created campaigns service (`src/services/campaigns.service.ts`)
- ✅ Created environment variable template (`.env.example`)

## Next Steps 🚀

After you complete steps 1-6 above, we'll:

1. **Create remaining services** (tasks, lists, labels, organizations)
2. **Update AuthContext** to use Supabase Auth
3. **Replace useKV hooks** in App.tsx with service calls
4. **Set up Resend** for email invitations
5. **Configure GitHub Pages** deployment

## Need Help?

- Supabase docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Can't find something? Just ask!

---

**Current Status**: ⏳ Waiting for you to create Supabase project and run schema
