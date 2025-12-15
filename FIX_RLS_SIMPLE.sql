-- Simplified RLS Fix - Only add the missing critical policies
-- Run this if the comprehensive fix has conflicts

-- ============================================
-- Fix org_invites to allow anonymous lookup
-- ============================================

-- Drop and recreate the anonymous lookup policies
DROP POLICY IF EXISTS "Anonymous can lookup pending invites by code" ON org_invites;
DROP POLICY IF EXISTS "Authenticated can lookup pending invites by code" ON org_invites;

-- Allow ANONYMOUS users to look up pending invites by invite_code
CREATE POLICY "Anonymous can lookup pending invites by code"
ON org_invites
FOR SELECT
TO anon
USING (status = 'pending');

-- Allow authenticated users to look up pending invites by code
CREATE POLICY "Authenticated can lookup pending invites by code"
ON org_invites
FOR SELECT
TO authenticated
USING (status = 'pending');

-- ============================================
-- Verify the policies were created
-- ============================================

SELECT 
  tablename,
  policyname,
  cmd,
  roles::text,
  qual::text
FROM pg_policies 
WHERE tablename IN ('profiles', 'org_invites', 'org_members')
ORDER BY tablename, policyname;
