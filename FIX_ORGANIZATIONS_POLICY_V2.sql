-- FIX ORGANIZATIONS POLICY - VERSION 2
-- Run this in Supabase SQL Editor

-- The issue: When querying org_members with a JOIN to organizations,
-- the RLS policy on organizations needs to allow viewing orgs where
-- the user is a MEMBER, not just the owner.

-- See current policies
SELECT * FROM pg_policies WHERE tablename = 'organizations';

-- Drop ALL organizations policies
DROP POLICY IF EXISTS "View own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Update own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Delete own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Anyone can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update" ON public.organizations;
DROP POLICY IF EXISTS "Organization members can view" ON public.organizations;
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

-- Create new policies that allow viewing through membership OR ownership

-- Allow users to view organizations where they are members OR owners
-- This uses a simple subquery that should not cause recursion
CREATE POLICY "View member organizations"
  ON public.organizations
  FOR SELECT
  USING (
    owner_id = auth.uid() 
    OR 
    id IN (
      SELECT org_id 
      FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

-- Allow authenticated users to create organizations
CREATE POLICY "Create organizations"
  ON public.organizations
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Allow owners to update their organizations
CREATE POLICY "Update own organizations"
  ON public.organizations
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Allow owners to delete their organizations
CREATE POLICY "Delete own organizations"
  ON public.organizations
  FOR DELETE
  USING (owner_id = auth.uid());

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'organizations';
