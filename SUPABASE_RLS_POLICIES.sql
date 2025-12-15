-- Row Level Security Policies for org_invites and org_members tables
-- Run these commands in your Supabase SQL Editor

-- ============================================
-- STEP 1: Drop existing policies if they exist
-- ============================================

-- Drop org_invites policies if they exist
DROP POLICY IF EXISTS "Users can view invites for their organizations" ON org_invites;
DROP POLICY IF EXISTS "Admins and owners can create invites" ON org_invites;
DROP POLICY IF EXISTS "Admins and owners can delete invites" ON org_invites;
DROP POLICY IF EXISTS "Admins and owners can update invites" ON org_invites;

-- Drop org_members policies if they exist
DROP POLICY IF EXISTS "Users can view members of their organizations" ON org_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON org_members;
DROP POLICY IF EXISTS "Users can view org members" ON org_members;
DROP POLICY IF EXISTS "Admins and owners can update member roles" ON org_members;
DROP POLICY IF EXISTS "Admins and owners can remove members" ON org_members;
DROP POLICY IF EXISTS "Admins and owners can add members" ON org_members;

-- ============================================
-- STEP 2: Enable RLS on tables
-- ============================================

-- Enable RLS on org_invites table
ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;

-- Enable RLS on org_members table
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create policies for org_invites
-- ============================================

-- ============================================
-- STEP 3: Create policies for org_invites
-- ============================================

-- Policy: Allow users to view invites for organizations they are members of
CREATE POLICY "Users can view invites for their organizations"
ON org_invites FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invites.org_id
    AND org_members.user_id = auth.uid()
  )
);

-- Policy: Allow admins and owners to create invites
CREATE POLICY "Admins and owners can create invites"
ON org_invites FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invites.org_id
    AND org_members.user_id = auth.uid()
    AND org_members.role IN ('admin', 'owner')
  )
);

-- Policy: Allow admins and owners to delete invites
CREATE POLICY "Admins and owners can delete invites"
ON org_invites FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invites.org_id
    AND org_members.user_id = auth.uid()
    AND org_members.role IN ('admin', 'owner')
  )
);

-- Policy: Allow admins and owners to update invites
CREATE POLICY "Admins and owners can update invites"
ON org_invites FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invites.org_id
    AND org_members.user_id = auth.uid()
    AND org_members.role IN ('admin', 'owner')
  )
);

-- ============================================
-- STEP 4: Create policies for org_members
-- ============================================

-- ============================================
-- STEP 4: Create policies for org_members
-- ============================================

-- Policy: Allow users to view their own org_members record
-- This is simpler and avoids circular dependency
CREATE POLICY "Users can view their own membership"
ON org_members FOR SELECT
USING (user_id = auth.uid());

-- Policy: Allow users to view other members in same organization
-- Only after they can see their own membership
CREATE POLICY "Users can view org members"
ON org_members FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow owners and admins to update member roles
CREATE POLICY "Admins and owners can update member roles"
ON org_members FOR UPDATE
USING (
  org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Policy: Allow owners and admins to remove members
CREATE POLICY "Admins and owners can remove members"
ON org_members FOR DELETE
USING (
  org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
  -- Prevent owners from removing themselves
  AND NOT (role = 'owner' AND user_id = auth.uid())
);

-- Policy: Allow new members to be added by admins/owners
CREATE POLICY "Admins and owners can add members"
ON org_members FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- ============================================
-- OPTIONAL: Temporary policy for debugging
-- If the above policies don't work, try this simpler policy temporarily
-- ============================================

-- Uncomment these lines to allow authenticated users to view their own org_members record
-- DROP POLICY IF EXISTS "Users can view their own membership" ON org_members;
-- CREATE POLICY "Users can view their own membership"
-- ON org_members FOR SELECT
-- USING (user_id = auth.uid());

-- ============================================
-- VERIFICATION QUERIES
-- Run these to check if policies were created successfully
-- ============================================

-- Check org_invites policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'org_invites';

-- Check org_members policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'org_members';
