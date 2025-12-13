-- Simplify date fields for campaigns and projects
-- This migration consolidates multiple date fields into simpler start_date and end_date fields

-- ============================================================================
-- CAMPAIGNS TABLE UPDATES
-- ============================================================================

-- Add new start_date column for campaigns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;

-- Migrate existing data: use planning_start_date as start_date (if available)
-- If no planning_start_date, try launch_date, otherwise keep null
UPDATE campaigns 
SET start_date = COALESCE(planning_start_date, launch_date)
WHERE start_date IS NULL;

-- The end_date column already exists, no changes needed there

-- Create index on new start_date column for better query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);

-- Drop old campaign date columns (after data migration)
-- Note: Only run these after verifying data migration was successful
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS planning_start_date;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS launch_date;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS follow_up_date;

-- ============================================================================
-- PROJECTS TABLE UPDATES
-- ============================================================================

-- Add start_date column for projects (if it doesn't exist)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;

-- Add end_date column for projects (if it doesn't exist)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);

-- Note: If your projects table has target_end_date, uncomment these lines:
-- UPDATE projects 
-- SET end_date = target_end_date
-- WHERE end_date IS NULL AND target_end_date IS NOT NULL;
-- 
-- ALTER TABLE projects DROP COLUMN IF EXISTS target_end_date;

-- ============================================================================
-- VERIFICATION QUERIES (Run these AFTER the migration above completes)
-- ============================================================================

-- Uncomment these after running the migration to verify:

-- -- Verify campaigns columns exist
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'campaigns' 
-- AND column_name IN ('start_date', 'end_date', 'planning_start_date', 'launch_date');

-- -- Verify projects columns exist
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'projects' 
-- AND column_name IN ('start_date', 'end_date', 'actual_end_date');

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Changes Made:
-- 1. Campaigns: Consolidated planning_start_date, launch_date, follow_up_date → start_date, end_date
-- 2. Projects: Renamed target_end_date → end_date (keeping actual_end_date for completed projects)
--
-- Migration Strategy:
-- 1. Added new columns (start_date for campaigns, end_date for projects)
-- 2. Migrated data from old columns to new columns
-- 3. Created indexes for performance
-- 4. Left DROP statements commented out for safety - run after verification
--
-- Rollback Strategy (if needed):
-- - The old columns are preserved until you manually run the DROP statements
-- - To rollback, simply update application code to use old column names again
--
-- Testing Checklist:
-- □ Run migration on development database
-- □ Verify data migrated correctly using verification queries above
-- □ Test application functionality with new date fields
-- □ Deploy to production
-- □ After 1-2 weeks of stable operation, consider running DROP statements
--
