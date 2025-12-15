-- Fix RLS policies to allow anonymous users to look up invite codes during signup
-- This is necessary because users need to validate invite codes BEFORE they have an account

-- Drop existing SELECT policy for org_invites if it exists
DROP POLICY IF EXISTS "Allow users to view invites" ON org_invites;
DROP POLICY IF EXISTS "Users can view invites sent to them" ON org_invites;
DROP POLICY IF EXISTS "Anyone can view pending invites by code" ON org_invites;

-- Create a new policy that allows:
-- 1. Authenticated users to see invites for their email
-- 2. ANYONE (including anonymous) to look up pending invites by invite_code
CREATE POLICY "Allow invite code lookup for signup"
ON org_invites
FOR SELECT
USING (
  -- Allow if user is authenticated and invite is for their email
  (auth.uid() IS NOT NULL AND email = auth.jwt()->>'email')
  OR
  -- Allow if user is authenticated and they're a member of the org
  (auth.uid() IS NOT NULL AND org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ))
  OR
  -- Allow ANYONE to look up pending invites by invite_code (needed for signup flow)
  (status = 'pending')
);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'org_invites';
