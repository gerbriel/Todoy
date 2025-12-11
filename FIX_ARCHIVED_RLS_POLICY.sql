-- Check current RLS policies on projects table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'projects';

-- The update is failing because RLS policy doesn't allow updating the 'archived' column
-- We need to update the RLS policy to allow users to update the archived field

-- Drop and recreate the update policy for projects
DROP POLICY IF EXISTS "Users can update projects in their organization" ON projects;

CREATE POLICY "Users can update projects in their organization"
ON projects
FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT org_id 
    FROM org_members 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id 
    FROM org_members 
    WHERE user_id = auth.uid()
  )
);

-- Do the same for campaigns
DROP POLICY IF EXISTS "Users can update campaigns in their organization" ON campaigns;

CREATE POLICY "Users can update campaigns in their organization"
ON campaigns
FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT org_id 
    FROM org_members 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id 
    FROM org_members 
    WHERE user_id = auth.uid()
  )
);

-- Do the same for tasks
DROP POLICY IF EXISTS "Users can update tasks in their organization" ON tasks;

CREATE POLICY "Users can update tasks in their organization"
ON tasks
FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT org_id 
    FROM org_members 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id 
    FROM org_members 
    WHERE user_id = auth.uid()
  )
);

-- Verify the policies were updated
SELECT tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename IN ('projects', 'campaigns', 'tasks')
  AND cmd = 'UPDATE';
