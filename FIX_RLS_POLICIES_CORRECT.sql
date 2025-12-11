-- Fix the UPDATE policies to allow archiving
-- Projects and Campaigns have org_id, but Tasks must join through campaigns

-- Projects: Recreate the update policy
DROP POLICY IF EXISTS "Org members can update projects" ON projects;

CREATE POLICY "Org members can update projects"
ON projects
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.user_id = auth.uid() 
    AND org_members.org_id = projects.org_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.user_id = auth.uid() 
    AND org_members.org_id = projects.org_id
  )
);

-- Campaigns: Recreate the update policy
DROP POLICY IF EXISTS "Org members can update campaigns" ON campaigns;

CREATE POLICY "Org members can update campaigns"
ON campaigns
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.user_id = auth.uid() 
    AND org_members.org_id = campaigns.org_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.user_id = auth.uid() 
    AND org_members.org_id = campaigns.org_id
  )
);

-- Tasks: Recreate the update policy (joins through campaigns)
DROP POLICY IF EXISTS "Org members can update tasks" ON tasks;

CREATE POLICY "Org members can update tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns 
    JOIN org_members ON org_members.org_id = campaigns.org_id
    WHERE org_members.user_id = auth.uid() 
    AND campaigns.id = tasks.campaign_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaigns 
    JOIN org_members ON org_members.org_id = campaigns.org_id
    WHERE org_members.user_id = auth.uid() 
    AND campaigns.id = tasks.campaign_id
  )
);

-- Verify the policies were updated
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('projects', 'campaigns', 'tasks')
  AND cmd = 'UPDATE';
