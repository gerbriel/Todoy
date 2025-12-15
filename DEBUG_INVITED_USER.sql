-- Debug script: Check why invited user can't see org
-- Replace 'invited-user@example.com' with the actual email

-- 1. Find the invited user
SELECT 
    'User Info:' as check_type,
    id,
    email,
    created_at
FROM auth.users
WHERE email = 'gabrielriosemail@gmail.com';

-- 2. Check their invites
SELECT 
    'User Invites:' as check_type,
    id,
    org_id,
    email,
    status,
    expires_at,
    role
FROM org_invites
WHERE email = 'gabrielriosemail@gmail.com'
ORDER BY created_at DESC;

-- 3. Check if they're in org_members
SELECT 
    'User Org Memberships:' as check_type,
    om.*,
    o.name as org_name
FROM org_members om
LEFT JOIN organizations o ON om.org_id = o.id
WHERE om.user_id IN (
    SELECT id FROM auth.users WHERE email = 'gabrielriosemail@gmail.com'
);

-- 4. Try to manually add them (will show error if RLS blocks it)
-- Replace the email and run this as a test
DO $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
    v_role text;
    v_invite_status text;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'gabrielriosemail@gmail.com';
    
    -- Get invite details
    SELECT org_id, role, status INTO v_org_id, v_role, v_invite_status
    FROM org_invites
    WHERE email = 'gabrielriosemail@gmail.com'
    AND status IN ('pending', 'accepted')
    AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    RAISE NOTICE 'User ID: %, Org ID: %, Role: %, Invite Status: %', v_user_id, v_org_id, v_role, v_invite_status;
    
    -- Try to insert (this will test the RLS policy)
    IF v_user_id IS NOT NULL AND v_org_id IS NOT NULL THEN
        INSERT INTO org_members (user_id, org_id, role, joined_at)
        VALUES (v_user_id, v_org_id, v_role, NOW())
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Successfully added user to org!';
    ELSE
        RAISE NOTICE 'Missing user_id or org_id - cannot insert';
    END IF;
END $$;

-- 5. Verify they're now a member
SELECT 
    'After Manual Add:' as check_type,
    om.id,
    om.role,
    o.name as org_name
FROM org_members om
JOIN organizations o ON om.org_id = o.id
WHERE om.user_id IN (
    SELECT id FROM auth.users WHERE email = 'gabrielriosemail@gmail.com'
);
