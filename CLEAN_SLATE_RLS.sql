-- CLEAN SLATE: Remove everything and start fresh
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop ALL policies (including duplicates)
-- ============================================

-- Drop ALL org_invites policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'org_invites') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON org_invites', r.policyname);
    END LOOP;
END $$;

-- Drop ALL org_members policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'org_members') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON org_members', r.policyname);
    END LOOP;
END $$;

-- Drop the security definer functions (they're not needed with this approach)
DROP FUNCTION IF EXISTS user_org_ids(uuid);
DROP FUNCTION IF EXISTS is_org_admin(uuid, uuid);
DROP FUNCTION IF EXISTS is_org_member(uuid, uuid);

-- ============================================
-- STEP 2: Temporarily disable RLS to clear everything
-- ============================================

ALTER TABLE org_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Re-enable RLS
-- ============================================

ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create ONE SELECT policy for org_members
-- ============================================

-- This is the ONLY SELECT policy - uses ARRAY approach to avoid recursion
CREATE POLICY "view_org_members"
ON org_members FOR SELECT
USING (
  org_id = ANY(
    ARRAY(
      SELECT m.org_id 
      FROM org_members m 
      WHERE m.user_id = auth.uid()
    )
  )
);

-- ============================================
-- STEP 5: Create admin policies for org_members
-- ============================================

CREATE POLICY "update_org_members"
ON org_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM org_members AS my_membership
    WHERE my_membership.org_id = org_members.org_id
    AND my_membership.user_id = auth.uid()
    AND my_membership.role IN ('admin', 'owner')
  )
);

CREATE POLICY "delete_org_members"
ON org_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM org_members AS my_membership
    WHERE my_membership.org_id = org_members.org_id
    AND my_membership.user_id = auth.uid()
    AND my_membership.role IN ('admin', 'owner')
  )
  AND NOT (role = 'owner' AND user_id = auth.uid())
);

CREATE POLICY "insert_org_members"
ON org_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_members AS my_membership
    WHERE my_membership.org_id = org_members.org_id
    AND my_membership.user_id = auth.uid()
    AND my_membership.role IN ('admin', 'owner')
  )
);

-- ============================================
-- STEP 6: Create policies for org_invites
-- ============================================

CREATE POLICY "view_org_invites"
ON org_invites FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invites.org_id
    AND org_members.user_id = auth.uid()
  )
);

CREATE POLICY "insert_org_invites"
ON org_invites FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invites.org_id
    AND org_members.user_id = auth.uid()
    AND org_members.role IN ('admin', 'owner')
  )
);

CREATE POLICY "delete_org_invites"
ON org_invites FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invites.org_id
    AND org_members.user_id = auth.uid()
    AND org_members.role IN ('admin', 'owner')
  )
);

CREATE POLICY "update_org_invites"
ON org_invites FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invites.org_id
    AND org_members.user_id = auth.uid()
    AND org_members.role IN ('admin', 'owner')
  )
);

-- ============================================
-- VERIFICATION
-- ============================================

-- This should show EXACTLY 8 policies total:
-- 4 for org_members, 4 for org_invites
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('org_invites', 'org_members')
ORDER BY tablename, cmd, policyname;

-- Check functions are gone
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%org%';
