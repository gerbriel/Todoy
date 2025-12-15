-- DEBUG: Check what's in the database and fix membership
-- This will show us what's wrong and fix it

-- ============================================
-- 1. CHECK YOUR USER INFO
-- ============================================
SELECT 
    'Your User ID:' as info,
    id as user_id,
    email,
    created_at
FROM auth.users 
WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
LIMIT 1;

-- ============================================
-- 2. CHECK ALL ORGANIZATIONS
-- ============================================
SELECT 
    'All Organizations:' as info,
    id as org_id,
    name,
    owner_id,
    created_at
FROM organizations
ORDER BY created_at DESC;

-- ============================================
-- 3. CHECK ALL ORG MEMBERS
-- ============================================
SELECT 
    'All Org Members:' as info,
    om.id,
    om.user_id,
    om.org_id,
    om.role,
    o.name as org_name,
    u.email as user_email
FROM org_members om
LEFT JOIN organizations o ON om.org_id = o.id
LEFT JOIN auth.users u ON om.user_id = u.id
ORDER BY om.joined_at DESC;

-- ============================================
-- 4. CHECK IF YOU'RE IN ANY ORG
-- ============================================
SELECT 
    'Your Memberships:' as info,
    om.*,
    o.name as org_name
FROM org_members om
JOIN organizations o ON om.org_id = o.id
WHERE om.user_id = auth.uid();

-- ============================================
-- 5. FIX: Add you to your organization if missing
-- ============================================

-- First, let's see if there's an organization owned by you
DO $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
    v_org_name text;
    v_member_exists boolean;
BEGIN
    -- Get current user ID
    SELECT auth.uid() INTO v_user_id;
    
    -- Find organization owned by this user
    SELECT id, name INTO v_org_id, v_org_name
    FROM organizations 
    WHERE owner_id = v_user_id
    LIMIT 1;
    
    IF v_org_id IS NOT NULL THEN
        -- Check if user is already a member
        SELECT EXISTS(
            SELECT 1 FROM org_members 
            WHERE user_id = v_user_id AND org_id = v_org_id
        ) INTO v_member_exists;
        
        IF NOT v_member_exists THEN
            -- Add user as owner to their organization
            INSERT INTO org_members (user_id, org_id, role, joined_at)
            VALUES (v_user_id, v_org_id, 'owner', NOW());
            
            RAISE NOTICE 'FIXED: Added you as owner to organization: %', v_org_name;
        ELSE
            RAISE NOTICE 'You are already a member of: %', v_org_name;
        END IF;
    ELSE
        RAISE NOTICE 'No organization found owned by you';
    END IF;
END $$;

-- ============================================
-- 6. VERIFY THE FIX
-- ============================================
SELECT 
    'After Fix - Your Memberships:' as info,
    om.id,
    om.role,
    o.name as org_name,
    o.id as org_id
FROM org_members om
JOIN organizations o ON om.org_id = o.id
WHERE om.user_id = auth.uid();
