-- Comprehensive RLS Fix for Invite Flow
-- This fixes the 406 errors by allowing necessary access during signup

-- ============================================
-- 1. FIX PROFILES TABLE RLS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow public profile reads" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- Allow users to insert their own profile (needed for signup)
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. FIX ORG_INVITES TABLE RLS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to view invites" ON org_invites;
DROP POLICY IF EXISTS "Users can view invites sent to them" ON org_invites;
DROP POLICY IF EXISTS "Anyone can view pending invites by code" ON org_invites;
DROP POLICY IF EXISTS "Allow invite code lookup for signup" ON org_invites;

-- Allow authenticated users to view invites for their email
CREATE POLICY "Users can view invites for their email"
ON org_invites
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    -- Allow org members/admins to see all invites for their org
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  )
);

-- Allow ANONYMOUS users to look up pending invites by invite_code
-- This is critical for the signup flow where users don't have an account yet
CREATE POLICY "Anonymous can lookup pending invites by code"
ON org_invites
FOR SELECT
TO anon
USING (status = 'pending');

-- Allow authenticated users to look up pending invites by code too
CREATE POLICY "Authenticated can lookup pending invites by code"
ON org_invites
FOR SELECT
TO authenticated
USING (status = 'pending');

-- ============================================
-- 3. FIX ORG_MEMBERS TABLE RLS
-- ============================================

-- Check existing policies
DROP POLICY IF EXISTS "Allow users to view org members" ON org_members;
DROP POLICY IF EXISTS "Users can view members of their orgs" ON org_members;
DROP POLICY IF EXISTS "Users can join orgs via invite" ON org_members;

-- Allow users to view members of orgs they belong to
CREATE POLICY "Users can view members of their orgs"
ON org_members
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  )
);

-- Allow users to insert themselves as org members (needed for invite acceptance)
CREATE POLICY "Users can join orgs via invite"
ON org_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. VERIFY POLICIES
-- ============================================

-- Check profiles policies
SELECT 
  'profiles' as table_name,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check org_invites policies
SELECT 
  'org_invites' as table_name,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'org_invites'
ORDER BY policyname;

-- Check org_members policies
SELECT 
  'org_members' as table_name,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'org_members'
ORDER BY policyname;
