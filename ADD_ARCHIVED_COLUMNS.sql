-- Add archived column to projects table if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add archived column to campaigns table if it doesn't exist
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add archived column to tasks table if it doesn't exist  
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Verify the columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('projects', 'campaigns', 'tasks')
  AND column_name = 'archived';
