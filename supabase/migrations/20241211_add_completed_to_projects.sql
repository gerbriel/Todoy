-- Add completed column to projects table
-- This tracks whether a project is marked as completed (separate from archived)

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;

-- Create index for faster filtering of completed projects
CREATE INDEX IF NOT EXISTS idx_projects_completed ON projects(completed);

-- Create combined index for filtering active vs completed vs archived
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(completed, archived);

-- Update RLS policies to handle completed status
-- The existing policies should work fine, just document the new field behavior
COMMENT ON COLUMN projects.completed IS 'Marks project as completed. Completed projects show in Recently Completed view with strike-through styling. Independent from archived status.';
