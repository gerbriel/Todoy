-- Check the status of the invite and see if the user was added

-- 1. Check the invite status
SELECT 
    'Invite Status' as info,
    id,
    email,
    invite_code,
    status,
    expires_at,
    created_at,
    org_id
FROM org_invites
WHERE email = 'gabrielriosemail@gmail.com'
ORDER BY created_at DESC;

-- 2. Check if the user exists in auth.users
SELECT 
    'User Account' as info,
    id,
    email,
    created_at,
    confirmed_at
FROM auth.users
WHERE email = 'gabrielriosemail@gmail.com';

-- 3. Check if user is in org_members
SELECT 
    'User Org Membership' as info,
    om.*,
    o.name as org_name
FROM org_members om
LEFT JOIN organizations o ON om.org_id = o.id
WHERE om.user_id IN (
    SELECT id FROM auth.users WHERE email = 'gabrielriosemail@gmail.com'
);

-- 4. Check if there's a pending invite that should have been processed
SELECT 
    'Pending Invites to Process' as info,
    oi.*
FROM org_invites oi
WHERE oi.email = 'gabrielriosemail@gmail.com'
AND oi.status = 'pending'
AND oi.expires_at > NOW();
