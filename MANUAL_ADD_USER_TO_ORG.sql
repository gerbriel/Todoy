-- MANUAL FIX: Add the invited user to the organization
-- Run this to manually complete what the signup flow should have done

-- First, let's check what we have
DO $$
DECLARE
    v_user_id uuid;
    v_invite_id uuid;
    v_org_id uuid;
    v_role text;
BEGIN
    -- Get the user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'gabrielriosemail@gmail.com';
    
    RAISE NOTICE 'User ID: %', v_user_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found with email gabrielriosemail@gmail.com';
    END IF;
    
    -- Get the pending invite
    SELECT id, org_id, role INTO v_invite_id, v_org_id, v_role
    FROM org_invites
    WHERE email = 'gabrielriosemail@gmail.com'
    AND status = 'pending'
    AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    RAISE NOTICE 'Invite ID: %, Org ID: %, Role: %', v_invite_id, v_org_id, v_role;
    
    IF v_invite_id IS NULL THEN
        RAISE EXCEPTION 'No pending invite found for gabrielriosemail@gmail.com';
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (SELECT 1 FROM org_members WHERE user_id = v_user_id AND org_id = v_org_id) THEN
        RAISE NOTICE 'User is already a member of this organization';
    ELSE
        -- Add user to organization
        INSERT INTO org_members (user_id, org_id, role, joined_at)
        VALUES (v_user_id, v_org_id, v_role, NOW());
        
        RAISE NOTICE 'User added to organization successfully';
    END IF;
    
    -- Mark invite as accepted
    UPDATE org_invites
    SET status = 'accepted'
    WHERE id = v_invite_id;
    
    RAISE NOTICE 'Invite marked as accepted';
    
END $$;

-- Verify the fix
SELECT 
    'Verification' as info,
    om.id,
    om.role,
    o.name as org_name,
    u.email as user_email
FROM org_members om
JOIN organizations o ON om.org_id = o.id
JOIN auth.users u ON om.user_id = u.id
WHERE u.email = 'gabrielriosemail@gmail.com';
