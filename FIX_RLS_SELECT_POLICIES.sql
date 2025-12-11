-- Fix the SELECT policies to allow reading archived items
-- The current SELECT policies might be filtering out archived items

-- Projects: Ensure SELECT policy allows reading archived items
DROP POLICY IF EXISTS "Org members can view projects" ON projects;

CREATE POLICY "Org members can view projects"
ON projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.user_id = auth.uid() 
    AND org_members.org_id = projects.org_id
  )
);

-- Campaigns: Ensure SELECT policy allows reading archived items
DROP POLICY IF EXISTS "Org members can view campaigns" ON campaigns;

CREATE POLICY "Org members can view campaigns"
ON campaigns
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.user_id = auth.uid() 
    AND org_members.org_id = campaigns.org_id
  )
);

-- Tasks: Ensure SELECT policy allows reading archived items (joins through campaigns)
DROP POLICY IF EXISTS "Org members can view tasks" ON tasks;

CREATE POLICY "Org members can view tasks"
ON tasks
FOR SELECT
TO authenticated
USING (
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
  AND cmd = 'SELECT';
