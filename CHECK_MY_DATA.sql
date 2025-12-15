-- Quick verification of your current state
-- Run this to see if everything is set up correctly

SELECT 'Current User' as check_type, 
       email, 
       id,
       created_at
FROM auth.users 
WHERE id = auth.uid();

SELECT 'User Profile' as check_type,
       *
FROM profiles
WHERE id = auth.uid();

SELECT 'User Org Memberships' as check_type,
       om.*,
       o.name as org_name
FROM org_members om
JOIN organizations o ON om.org_id = o.id
WHERE om.user_id = auth.uid();

SELECT 'User Organizations' as check_type,
       o.*
FROM organizations o
WHERE id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid());
