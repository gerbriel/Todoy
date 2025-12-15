-- TEMPORARY: Disable RLS to debug the issue
-- Run this in Supabase SQL Editor to temporarily disable RLS

-- Disable RLS on org_members to see if app works without it
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;

-- Disable RLS on org_invites to see if app works without it
ALTER TABLE org_invites DISABLE ROW LEVEL SECURITY;

-- After running this, check if your app loads the organization data
-- This will help us confirm the issue is with RLS policies

-- IMPORTANT: This is NOT secure for production!
-- Only use this temporarily to diagnose the issue
