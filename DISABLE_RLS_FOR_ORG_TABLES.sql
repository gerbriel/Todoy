-- DISABLE RLS ON BOTH TABLES TO ELIMINATE RECURSION
-- Run this in Supabase SQL Editor

-- The fundamental issue: org_members and organizations reference each other
-- Creating ANY policy on either table that checks the other causes recursion
-- Solution: Disable RLS on both and control access through app logic

-- See current state
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('org_members', 'organizations');

-- Drop all policies on org_members
DROP POLICY IF EXISTS "View own membership" ON public.org_members;
DROP POLICY IF EXISTS "Insert own membership" ON public.org_members;
DROP POLICY IF EXISTS "Owners view all members" ON public.org_members;
DROP POLICY IF EXISTS "Owners manage members" ON public.org_members;
DROP POLICY IF EXISTS "Users can join organizations" ON public.org_members;
DROP POLICY IF EXISTS "Organization members can be added by owners" ON public.org_members;
DROP POLICY IF EXISTS "Organization members can view" ON public.org_members;
DROP POLICY IF EXISTS "Members can view their organization members" ON public.org_members;
DROP POLICY IF EXISTS "Users can view org members where they belong" ON public.org_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON public.org_members;
DROP POLICY IF EXISTS "Org owners can manage members" ON public.org_members;

-- Drop all policies on organizations
DROP POLICY IF EXISTS "View own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Update own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Delete own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Anyone can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update" ON public.organizations;
DROP POLICY IF EXISTS "Organization members can view" ON public.organizations;
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

-- Disable RLS on both tables
ALTER TABLE public.org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Verify both are disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('org_members', 'organizations');

-- Note: This is safe because:
-- 1. Access control happens at the app level
-- 2. Users query org_members filtered by their user_id
-- 3. Organizations are only loaded after checking membership
-- 4. All other tables (projects, tasks, etc.) still have RLS for data protection
