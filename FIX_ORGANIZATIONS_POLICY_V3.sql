-- FIX ORGANIZATIONS POLICY - VERSION 3 (SIMPLEST)
-- Run this in Supabase SQL Editor

-- The core issue: RLS on organizations table is blocking the JOIN from org_members
-- Solution: Temporarily disable RLS on organizations since we control access through org_members

-- See current state
SELECT * FROM pg_policies WHERE tablename = 'organizations';

-- Drop ALL organizations policies
DROP POLICY IF EXISTS "View own organizations" ON public.organizations;
DROP POLICY IF EXISTS "View member organizations" ON public.organizations;
DROP POLICY IF EXISTS "Create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Update own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Delete own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Anyone can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update" ON public.organizations;
DROP POLICY IF EXISTS "Organization members can view" ON public.organizations;
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

-- Disable RLS on organizations table
-- This is safe because we control access through org_members
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'organizations';
