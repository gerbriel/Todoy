-- COMPREHENSIVE FIX: Allow new users to create orgs and join via invites
-- This fixes the issue where new signups can't create organizations

-- ===========================================
-- 1. FIX ORGANIZATIONS INSERT POLICY
-- ===========================================
DROP POLICY IF EXISTS "create_organizations" ON organizations;

CREATE POLICY "create_organizations"
ON organizations
FOR INSERT
TO authenticated
WITH CHECK (
  -- Any authenticated user can create an organization
  -- as long as they are the owner
  owner_id = auth.uid()
);

-- ===========================================
-- 2. FIX ORG_MEMBERS INSERT POLICY (Complete version)
-- ===========================================
DROP POLICY IF EXISTS "insert_org_members" ON org_members;

CREATE POLICY "insert_org_members"
ON org_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Scenario 1: User creating their own org (becomes owner)
  (
    user_id = auth.uid()
    AND role = 'owner'
    AND EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = org_members.org_id
      AND organizations.owner_id = auth.uid()
    )
  )
  OR
  -- Scenario 2: User joining via invite
  (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM org_invites
      WHERE org_invites.org_id = org_members.org_id
      AND org_invites.email = get_user_email(auth.uid())
      AND org_invites.status IN ('pending', 'accepted')
      AND org_invites.expires_at > NOW()
    )
  )
  OR
  -- Scenario 3: Existing owner/admin adding members
  (
    user_is_org_member(org_members.org_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM org_members existing
      WHERE existing.user_id = auth.uid()
      AND existing.org_id = org_members.org_id
      AND existing.role IN ('owner', 'admin')
    )
  )
);

-- ===========================================
-- 3. VERIFY ALL POLICIES
-- ===========================================
SELECT 
  tablename,
  policyname,
  cmd,
  with_check::text as policy_check
FROM pg_policies 
WHERE tablename IN ('organizations', 'org_members')
AND cmd = 'INSERT'
ORDER BY tablename, policyname;

-- ===========================================
-- 4. TEST: Try creating an org as current user
-- ===========================================
/*
-- Uncomment to test:
BEGIN;
  INSERT INTO organizations (name, description, owner_id, created_at)
  VALUES ('Test Org', 'Testing', auth.uid(), NOW())
  RETURNING *;
ROLLBACK;
*/
