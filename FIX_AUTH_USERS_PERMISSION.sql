-- Fix RLS policy - the issue is querying auth.users table
-- We need to use a security definer function to get the user's email

-- Step 1: Create a helper function to get user email (security definer)
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT email FROM auth.users WHERE id = user_id;
$$;

-- Step 2: Drop the existing insert policy
DROP POLICY IF EXISTS "insert_org_members" ON org_members;

-- Step 3: Create a new policy using the function
CREATE POLICY "insert_org_members"
ON org_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can add themselves if there's a valid invite for them
  (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM org_invites
      WHERE org_invites.org_id = org_members.org_id
      AND org_invites.email = get_user_email(auth.uid())
      AND org_invites.status IN ('pending', 'accepted')
      AND org_invites.expires_at > NOW()
    )
  )
  OR
  -- OR user is owner/admin of the org and can add anyone
  (
    user_is_org_member(org_members.org_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.org_id = org_members.org_id
      AND om.role IN ('owner', 'admin')
    )
  )
);

-- Step 4: Verify the policy
SELECT 
  tablename,
  policyname,
  cmd,
  with_check::text as policy_definition
FROM pg_policies 
WHERE tablename = 'org_members'
AND policyname = 'insert_org_members';

-- Step 5: Test the insert (replace with actual values)
-- This should work now without 403 errors
/*
INSERT INTO org_members (user_id, org_id, role, joined_at)
VALUES (
  auth.uid(),
  'your-org-id-here',
  'member',
  NOW()
);
*/
