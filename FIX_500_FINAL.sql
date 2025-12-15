-- ULTIMATE FIX - Use security definer function to avoid recursion
-- This creates a function that bypasses RLS to check membership

-- Step 1: Create a helper function that runs with security definer
CREATE OR REPLACE FUNCTION user_is_org_member(check_org_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM org_members
    WHERE org_id = check_org_id 
    AND user_id = check_user_id
  );
$$;

-- Step 2: Drop the problematic recursive policy
DROP POLICY IF EXISTS "view_org_members" ON org_members;

-- Step 3: Create a simple, non-recursive policy using the function
CREATE POLICY "view_org_members"
ON org_members
FOR SELECT
TO authenticated
USING (
  -- User can see members of orgs they belong to
  user_is_org_member(org_members.org_id, auth.uid())
);

-- Step 4: Verify the policy
SELECT 
  tablename,
  policyname,
  cmd,
  qual::text as policy_definition
FROM pg_policies 
WHERE tablename = 'org_members'
AND policyname = 'view_org_members';

-- Step 5: Test the query that was failing
SELECT * 
FROM org_members 
WHERE user_id = auth.uid()
LIMIT 5;
