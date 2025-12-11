-- FIX INFINITE RECURSION IN ORGANIZATIONS POLICY
-- Run this in Supabase SQL Editor

-- The organizations table also has recursive policies causing issues

-- See current policies
SELECT * FROM pg_policies WHERE tablename = 'organizations';

-- Drop ALL organizations policies
DROP POLICY IF EXISTS "Anyone can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update" ON public.organizations;
DROP POLICY IF EXISTS "Organization members can view" ON public.organizations;
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

-- Create simpler, non-recursive policies

-- Allow users to view organizations they own
CREATE POLICY "View own organizations"
  ON public.organizations
  FOR SELECT
  USING (owner_id = auth.uid());

-- Allow users to create organizations
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
