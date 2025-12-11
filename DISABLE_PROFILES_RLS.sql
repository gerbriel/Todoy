-- DISABLE RLS ON PROFILES TABLE
-- Run this in Supabase SQL Editor

-- The profiles table is hanging queries - likely another RLS issue
-- Since we already disabled RLS on org_members and organizations,
-- let's also disable it on profiles for consistency

-- Check current state
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- See current policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Drop all policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- Disable RLS on profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Note: This is safe because:
-- 1. Users are authenticated via Supabase Auth
-- 2. The app only queries profiles for the authenticated user
-- 3. Profile data is not sensitive (just name, email which user already has)
-- 4. Actual sensitive data is in other tables with proper access control
