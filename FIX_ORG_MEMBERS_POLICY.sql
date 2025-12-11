-- FIX INFINITE RECURSION IN ORG_MEMBERS POLICY
-- Run this in Supabase SQL Editor

-- The problem is the policy is checking org_members while querying org_members
-- This creates infinite recursion

-- First, disable RLS temporarily to see all policies
SELECT * FROM pg_policies WHERE tablename = 'org_members';

-- Drop ALL org_members policies (all possible names)
DROP POLICY IF EXISTS "Users can join organizations" ON public.org_members;
DROP POLICY IF EXISTS "Organization members can be added by owners" ON public.org_members;
DROP POLICY IF EXISTS "Organization members can view" ON public.org_members;
DROP POLICY IF EXISTS "Members can view their organization members" ON public.org_members;
DROP POLICY IF EXISTS "Users can view org members where they belong" ON public.org_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON public.org_members;
DROP POLICY IF EXISTS "Org owners can manage members" ON public.org_members;

-- Create simpler, non-recursive policies

-- Allow users to view their own membership records
CREATE POLICY "View own membership"
  ON public.org_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to insert themselves as members (for signup)
CREATE POLICY "Insert own membership"
  ON public.org_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow org owners to view all members in their orgs
CREATE POLICY "Owners view all members"
  ON public.org_members
  FOR SELECT
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Allow org owners to manage members (insert, update, delete)
CREATE POLICY "Owners manage members"
  ON public.org_members
  FOR ALL
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'org_members';
