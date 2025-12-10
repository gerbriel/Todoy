-- CREATE ORGANIZATION FOR EXISTING USER
-- Run this if profile exists but still seeing timeout

-- Check current user's organizations
SELECT om.*, o.* 
FROM org_members om
JOIN organizations o ON om.org_id = o.id
WHERE om.user_id = 'bd86f5d2-75c2-4286-9a7c-bc764f6ff2f2';

-- If no results, create a workspace for this user
INSERT INTO public.organizations (name, description, owner_id, created_at)
VALUES (
  'My Workspace',
  'Personal workspace',
  'bd86f5d2-75c2-4286-9a7c-bc764f6ff2f2',
  NOW()
)
RETURNING *;

-- Get the organization ID from the result above, then add user as member
-- Replace 'YOUR_ORG_ID_HERE' with the actual ID from the previous query
INSERT INTO public.org_members (user_id, org_id, role, joined_at)
VALUES (
  'bd86f5d2-75c2-4286-9a7c-bc764f6ff2f2',
  (SELECT id FROM organizations WHERE owner_id = 'bd86f5d2-75c2-4286-9a7c-bc764f6ff2f2' ORDER BY created_at DESC LIMIT 1),
  'owner',
  NOW()
);

-- Verify
SELECT om.*, o.* 
FROM org_members om
JOIN organizations o ON om.org_id = o.id
WHERE om.user_id = 'bd86f5d2-75c2-4286-9a7c-bc764f6ff2f2';
