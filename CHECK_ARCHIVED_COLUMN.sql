-- Check if the archived column exists in the tables
SELECT 
    table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('projects', 'campaigns', 'tasks')
  AND column_name = 'archived'
ORDER BY table_name;

-- If the above returns no rows, the column doesn't exist!
-- Run the ADD_ARCHIVED_COLUMNS.sql script to add it.

-- You can also check a specific project's archived value:
-- SELECT id, title, archived FROM projects WHERE id = '254675d2-942f-4a0a-9eef-10cfdbc1dadf';
