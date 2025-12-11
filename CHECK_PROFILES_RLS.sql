-- Check profiles table RLS status and policies
-- Run this in Supabase SQL Editor

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- See all policies on profiles table
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- If there are problematic policies, disable RLS on profiles too
-- (Uncomment if needed)
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
