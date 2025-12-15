-- Complete RLS policy for org_members INSERT
-- Allows both: invited users AND org owners/admins

DROP POLICY IF EXISTS "insert_org_members" ON org_members;

CREATE POLICY "insert_org_members"
ON org_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is adding themselves with a valid invite
  (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 
      FROM org_invites
      WHERE org_invites.org_id = org_members.org_id
      AND org_invites.email = get_user_email(auth.uid())
      AND org_invites.status IN ('pending', 'accepted')
      AND org_invites.expires_at > NOW()
    )
  )
  OR
  -- Allow if user is an owner/admin adding anyone to their org
  (
    EXISTS (
      SELECT 1 
      FROM org_members existing
      WHERE existing.user_id = auth.uid()
      AND existing.org_id = org_members.org_id
      AND existing.role IN ('owner', 'admin')
    )
  )
  OR
  -- Allow if user is creating their own organization (they become owner)
  (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM organizations
      WHERE organizations.id = org_members.org_id
      AND organizations.owner_id = auth.uid()
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
