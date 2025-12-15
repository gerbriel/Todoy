-- RESTORE PROPER RLS POLICIES
-- This will fix the access issues and restore proper permissions

-- ============================================
-- 1. FIX ORG_MEMBERS TABLE - CRITICAL
-- ============================================

-- Drop ALL existing org_members policies to start fresh
DROP POLICY IF EXISTS "Users can join orgs via invite" ON org_members;
DROP POLICY IF EXISTS "Users can view members of their orgs" ON org_members;
DROP POLICY IF EXISTS "view_own_membership" ON org_members;
DROP POLICY IF EXISTS "delete_org_members" ON org_members;
DROP POLICY IF EXISTS "insert_org_members" ON org_members;
DROP POLICY IF EXISTS "update_org_members" ON org_members;

-- Allow users to view members of orgs they belong to
CREATE POLICY "view_org_members"
ON org_members
FOR SELECT
TO authenticated
USING (
  -- User can see members of orgs they're part of
  org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  )
);

-- Allow org owners and admins to insert new members
CREATE POLICY "insert_org_members"
ON org_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can add themselves (for invite acceptance)
  user_id = auth.uid()
  OR
  -- OR user is owner/admin of the org
  org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Allow org owners and admins to update member roles
CREATE POLICY "update_org_members"
ON org_members
FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Allow org owners and admins to delete members
CREATE POLICY "delete_org_members"
ON org_members
FOR DELETE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- ============================================
-- 2. FIX ORGANIZATIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;

-- Users can view orgs they're a member of
CREATE POLICY "view_organizations"
ON organizations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  )
);

-- Any authenticated user can create an organization
CREATE POLICY "create_organizations"
ON organizations
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Owners and admins can update their organizations
CREATE POLICY "update_organizations"
ON organizations
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- ============================================
-- 3. FIX ORG_INVITES TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view invites for their email" ON org_invites;
DROP POLICY IF EXISTS "Anonymous can lookup pending invites by code" ON org_invites;
DROP POLICY IF EXISTS "Authenticated can lookup pending invites by code" ON org_invites;

-- Allow authenticated users to view invites for orgs they're in
CREATE POLICY "view_org_invites"
ON org_invites
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  )
);

-- CRITICAL: Allow ANONYMOUS users to look up pending invites by code (for signup)
CREATE POLICY "anon_lookup_invites_by_code"
ON org_invites
FOR SELECT
TO anon
USING (status = 'pending');

-- Allow authenticated users to look up pending invites by code too
CREATE POLICY "auth_lookup_invites_by_code"
ON org_invites
FOR SELECT
TO authenticated
USING (status = 'pending');

-- Allow org owners/admins to insert invites
CREATE POLICY "insert_org_invites"
ON org_invites
FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Allow org owners/admins to update invites
CREATE POLICY "update_org_invites"
ON org_invites
FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- ============================================
-- 4. FIX PROFILES TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Users can view their own profile
CREATE POLICY "view_own_profile"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "update_own_profile"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "insert_own_profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- ============================================
-- 5. VERIFY ALL POLICIES
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text[],
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename IN ('profiles', 'org_invites', 'org_members', 'organizations')
ORDER BY tablename, policyname;
