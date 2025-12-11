-- Add DELETE policies for projects, campaigns, tasks, and lists
-- These were missing, causing deletion failures

-- Projects: Add delete policy
DROP POLICY IF EXISTS "Org members can delete projects" ON projects;

CREATE POLICY "Org members can delete projects"
ON projects
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.user_id = auth.uid() 
    AND org_members.org_id = projects.org_id
  )
);

-- Campaigns: Add delete policy
DROP POLICY IF EXISTS "Org members can delete campaigns" ON campaigns;

CREATE POLICY "Org members can delete campaigns"
ON campaigns
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.user_id = auth.uid() 
    AND org_members.org_id = campaigns.org_id
  )
);

-- Tasks: Add delete policy (joins through campaigns)
DROP POLICY IF EXISTS "Org members can delete tasks" ON tasks;

CREATE POLICY "Org members can delete tasks"
ON tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns 
    JOIN org_members ON org_members.org_id = campaigns.org_id
    WHERE org_members.user_id = auth.uid() 
    AND campaigns.id = tasks.campaign_id
  )
);

-- Lists: Add delete policy (joins through campaigns)
DROP POLICY IF EXISTS "Org members can delete lists" ON lists;

CREATE POLICY "Org members can delete lists"
ON lists
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns 
    JOIN org_members ON org_members.org_id = campaigns.org_id
    WHERE org_members.user_id = auth.uid() 
    AND campaigns.id = lists.campaign_id
  )
);

-- Labels: Add delete policy
DROP POLICY IF EXISTS "Org members can delete labels" ON labels;

CREATE POLICY "Org members can delete labels"
ON labels
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.user_id = auth.uid() 
    AND org_members.org_id = labels.org_id
  )
);

-- Verify the delete policies were created
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('projects', 'campaigns', 'tasks', 'lists', 'labels')
  AND cmd = 'DELETE';
