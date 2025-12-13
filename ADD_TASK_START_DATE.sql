-- Add start_date column to tasks table to enable multi-day task spans
-- This allows tasks to have a start date and end date (dueDate) just like campaigns and projects
-- Note: start_date and due_date can be the same date for single-day tasks

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;

-- Create an index on start_date for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('start_date', 'due_date');
