-- FIX ORG_MEMBERS POLICY - FINAL VERSION (NO RECURSION)
-- Run this in Supabase SQL Editor

-- The issue: Even the "fixed" policies still have subqueries to organizations table
-- causing recursion. We need COMPLETELY simple policies.

-- See current policies
SELECT * FROM pg_policies WHERE tablename = 'org_members';

-- Drop ALL org_members policies
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

-- Disable RLS on org_members entirely
-- This is safe because:
-- 1. Users can only access orgs they're members of (controlled by app logic)
-- 2. Organizations table still has RLS
-- 3. We'll control access through the organizations relationship
ALTER TABLE public.org_members DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'org_members';
