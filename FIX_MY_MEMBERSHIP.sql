-- Check your current org membership and fix if missing
-- Run this as the logged-in user

-- 1. Check your current user ID and email
SELECT 'Your Info:' as info, id, email FROM auth.users WHERE id = auth.uid();

-- 2. Check your org memberships
SELECT 
  'Your Memberships:' as info,
  om.*,
  o.name as org_name
FROM org_members om
JOIN organizations o ON om.org_id = o.id
WHERE om.user_id = auth.uid();

-- 3. Check organizations you own
SELECT 
  'Organizations You Own:' as info,
  *
FROM organizations
WHERE owner_id = auth.uid();

-- 4. FIX: Add yourself as owner to any orgs you own but aren't a member of
INSERT INTO org_members (user_id, org_id, role, joined_at)
SELECT 
  auth.uid(),
  id,
  'owner',
  NOW()
FROM organizations
WHERE owner_id = auth.uid()
AND id NOT IN (
  SELECT org_id FROM org_members WHERE user_id = auth.uid()
)
ON CONFLICT DO NOTHING
RETURNING *;

-- 5. Verify the fix
SELECT 
  'After Fix:' as info,
  om.id,
  om.role,
  o.name as org_name
FROM org_members om
JOIN organizations o ON om.org_id = o.id
WHERE om.user_id = auth.uid();
