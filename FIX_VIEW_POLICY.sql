-- FINAL FIX: Use a direct condition that doesn't recurse
-- Run this in Supabase SQL Editor

-- Drop the problematic view_org_members policy
DROP POLICY IF EXISTS "view_org_members" ON org_members;

-- Create a simple policy that only checks user_id directly
-- This means users can ONLY see their own membership record
-- To see other members, we'll need to change the app code
CREATE POLICY "view_own_membership"
ON org_members FOR SELECT
USING (user_id = auth.uid());

-- Verify
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'org_members'
ORDER BY cmd, policyname;
