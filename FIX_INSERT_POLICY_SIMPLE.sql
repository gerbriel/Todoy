-- Simplify the RLS policy - just check if there's a valid invite
-- Don't try to check if they're already a member (they're not, that's why they're inserting!)

DROP POLICY IF EXISTS "insert_org_members" ON org_members;

CREATE POLICY "insert_org_members"
ON org_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can add themselves if:
  -- 1. They are inserting their own user_id
  -- 2. There's a valid invite for their email in this org
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM org_invites
    WHERE org_invites.org_id = org_members.org_id
    AND org_invites.email = get_user_email(auth.uid())
    AND org_invites.status IN ('pending', 'accepted')
    AND org_invites.expires_at > NOW()
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
