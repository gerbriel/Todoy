-- Check and fix DELETE policy for org_invites

-- 1. Check current DELETE policies
SELECT 
  tablename,
  policyname,
  cmd,
  qual::text as policy_definition
FROM pg_policies 
WHERE tablename = 'org_invites'
AND cmd = 'DELETE';

-- 2. Drop and recreate DELETE policy
DROP POLICY IF EXISTS "delete_org_invites" ON org_invites;

CREATE POLICY "delete_org_invites"
ON org_invites
FOR DELETE
TO authenticated
USING (
  -- Owners and admins can delete invites for their org
  org_id IN (
    SELECT om.org_id 
    FROM org_members om
    WHERE om.user_id = auth.uid() 
    AND om.role IN ('owner', 'admin')
  )
);

-- 3. Verify it was created
SELECT 
  tablename,
  policyname,
  cmd,
  qual::text as policy_definition
FROM pg_policies 
WHERE tablename = 'org_invites'
AND policyname = 'delete_org_invites';

-- 4. Test DELETE (uncomment to test with a real invite ID)
/*
DELETE FROM org_invites
WHERE id = 'your-invite-id-here'
AND org_id IN (
  SELECT om.org_id FROM org_members om
  WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
);
*/
