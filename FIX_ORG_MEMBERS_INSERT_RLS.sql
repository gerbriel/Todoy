-- Fix RLS to allow authenticated users to insert themselves into org_members with a valid accepted invite
-- This is needed so users can join orgs after clicking invite links

-- Drop the existing insert policy
DROP POLICY IF EXISTS "insert_org_members" ON org_members;

-- Create a new policy that allows:
-- 1. Users to add themselves (for invite acceptance)
-- 2. Org owners/admins to add new members
CREATE POLICY "insert_org_members"
ON org_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can add themselves if there's a valid accepted invite for them
  (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM org_invites
      WHERE org_invites.org_id = org_members.org_id
      AND org_invites.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND org_invites.status IN ('pending', 'accepted')
      AND org_invites.expires_at > NOW()
    )
  )
  OR
  -- OR user is owner/admin of the org and can add anyone
  (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() 
      AND om.role IN ('owner', 'admin')
    )
  )
);

-- Verify the policy
SELECT 
  tablename,
  policyname,
  cmd,
  with_check::text as policy_definition
FROM pg_policies 
WHERE tablename = 'org_members'
AND policyname = 'insert_org_members';
