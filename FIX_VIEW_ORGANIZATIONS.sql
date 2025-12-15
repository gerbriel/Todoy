-- Fix ALL SELECT policies - users can't see their orgs
-- This is likely because of the recursive org_members check

-- 1. Check current organizations policy
SELECT 
  tablename,
  policyname,
  cmd,
  qual::text as policy_definition
FROM pg_policies 
WHERE tablename = 'organizations'
AND cmd = 'SELECT';

-- 2. Drop and recreate organizations SELECT policy
DROP POLICY IF EXISTS "view_organizations" ON organizations;

CREATE POLICY "view_organizations"
ON organizations
FOR SELECT
TO authenticated
USING (
  -- User can see orgs they're a member of
  -- Use the security definer function to avoid recursion
  user_is_org_member(id, auth.uid())
);

-- 3. Verify it was created
SELECT 
  tablename,
  policyname,
  cmd,
  qual::text as policy_definition
FROM pg_policies 
WHERE tablename = 'organizations'
AND policyname = 'view_organizations';

-- 4. Test query (should return your orgs)
SELECT 
  'Your Organizations:' as info,
  o.*
FROM organizations o
WHERE user_is_org_member(o.id, auth.uid());
