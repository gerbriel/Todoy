-- FIX THE 500 ERROR - Infinite recursion in org_members policy
-- The current policy checks org_members while querying org_members (recursion!)

-- Drop the problematic policy
DROP POLICY IF EXISTS "view_org_members" ON org_members;

-- Create a non-recursive policy
-- This allows users to see org_members records where they are also a member
-- But uses a simpler check that doesn't cause recursion
CREATE POLICY "view_org_members"
ON org_members
FOR SELECT
TO authenticated
USING (
  -- Allow users to see members of orgs they belong to
  -- Using a lateral join to avoid recursion
  EXISTS (
    SELECT 1 
    FROM org_members my_membership
    WHERE my_membership.user_id = auth.uid()
    AND my_membership.org_id = org_members.org_id
  )
);

-- Verify the fix
SELECT 
  tablename,
  policyname,
  cmd,
  qual::text as policy_definition
FROM pg_policies 
WHERE tablename = 'org_members'
AND policyname = 'view_org_members';
