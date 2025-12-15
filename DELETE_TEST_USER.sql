-- Delete Test User and Related Data
-- WARNING: This will permanently delete the user and all their data
-- Replace 'test@example.com' with the actual email you want to delete

-- Step 1: Get the user ID (run this first to see what will be deleted)
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'test@example.com';

-- Step 2: Delete org_members records for this user
DELETE FROM org_members 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'test@example.com'
);

-- Step 3: Delete profile
DELETE FROM profiles 
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'test@example.com'
);

-- Step 4: Delete the auth user (this also cascades to other auth tables)
DELETE FROM auth.users 
WHERE email = 'test@example.com';

-- Verify deletion
SELECT 
    id,
    email
FROM auth.users 
WHERE email = 'test@example.com';
-- Should return no rows

-- Also check if any org_members remain
SELECT * FROM org_members 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'test@example.com'
);
-- Should return no rows
