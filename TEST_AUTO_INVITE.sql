-- Test the auto-invite flow
-- This will help us test if the feature is working

-- 1. Check current state
SELECT 
    'Current Invites' as check_type,
    email,
    status,
    expires_at,
    invite_code
FROM org_invites
WHERE email = 'gabrielriosemail@gmail.com'
ORDER BY created_at DESC;

-- 2. Reset one invite back to pending for testing
-- (We can test if login will auto-accept it)
UPDATE org_invites
SET status = 'pending'
WHERE email = 'gabrielriosemail@gmail.com'
AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 1
RETURNING *;

-- 3. Verify it's now pending
SELECT 
    'After Reset' as check_type,
    email,
    status,
    invite_code
FROM org_invites
WHERE email = 'gabrielriosemail@gmail.com'
AND status = 'pending';
