-- SIMPLIFIED RLS Policies - No functions, no recursion
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop all existing policies
-- ============================================

DROP POLICY IF EXISTS "Users can view invites for their organizations" ON org_invites;
DROP POLICY IF EXISTS "Admins and owners can create invites" ON org_invites;
DROP POLICY IF EXISTS "Admins and owners can delete invites" ON org_invites;
DROP POLICY IF EXISTS "Admins and owners can update invites" ON org_invites;

DROP POLICY IF EXISTS "Users can view members of their organizations" ON org_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON org_members;
DROP POLICY IF EXISTS "Users can view org members" ON org_members;
DROP POLICY IF EXISTS "Admins and owners can update member roles" ON org_members;
DROP POLICY IF EXISTS "Admins and owners can remove members" ON org_members;
DROP POLICY IF EXISTS "Admins and owners can add members" ON org_members;

-- ============================================
-- STEP 2: Enable RLS
-- ============================================

ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create policies for org_members
-- ============================================

-- Policy: Users can view members in organizations where they are members
-- Uses a CTE-style subquery to avoid recursion
CREATE POLICY "Users can view org members"
ON org_members FOR SELECT
USING (
  -- First, PostgreSQL evaluates this for the CURRENT authenticated user
  -- It finds their org_id(s), then allows viewing all members of those orgs
  org_id = ANY(
    ARRAY(
      SELECT m.org_id 
      FROM org_members m 
      WHERE m.user_id = auth.uid()
    )
  )
);

-- Policy: Allow admins and owners to update member roles
-- This uses a subquery but only checks the CURRENT USER's role
CREATE POLICY "Admins and owners can update member roles"
ON org_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM org_members AS my_membership
    WHERE my_membership.org_id = org_members.org_id
    AND my_membership.user_id = auth.uid()
    AND my_membership.role IN ('admin', 'owner')
  )
);

-- Policy: Allow admins and owners to remove members
CREATE POLICY "Admins and owners can remove members"
ON org_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM org_members AS my_membership
    WHERE my_membership.org_id = org_members.org_id
    AND my_membership.user_id = auth.uid()
    AND my_membership.role IN ('admin', 'owner')
  )
  AND NOT (role = 'owner' AND user_id = auth.uid())
);

-- Policy: Allow admins and owners to add members
CREATE POLICY "Admins and owners can add members"
ON org_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_members AS my_membership
    WHERE my_membership.org_id = org_members.org_id
    AND my_membership.user_id = auth.uid()
    AND my_membership.role IN ('admin', 'owner')
  )
);

-- ============================================
-- STEP 4: Create SIMPLE policies for org_invites
-- ============================================

-- Policy: Users can view invites for orgs they're members of
CREATE POLICY "Users can view invites for their organizations"
ON org_invites FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invites.org_id
    AND org_members.user_id = auth.uid()
  )
);

-- Policy: Admins and owners can create invites
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

-- Policy: Admins and owners can delete invites
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

-- Policy: Admins and owners can update invites
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
-- VERIFICATION
-- ============================================

-- Check policies were created
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('org_invites', 'org_members')
ORDER BY tablename, policyname;
