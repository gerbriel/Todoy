-- First, let's see what columns exist in the projects table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- And check what the current policies look like
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('projects', 'campaigns', 'tasks');
