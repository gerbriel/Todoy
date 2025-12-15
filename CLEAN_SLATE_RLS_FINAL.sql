-- CLEAN SLATE - Drop ALL policies and recreate them properly
-- This ensures a fresh start regardless of what exists

-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================

-- Drop all org_members policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'org_members') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON org_members';
    END LOOP;
END $$;

-- Drop all organizations policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organizations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON organizations';
    END LOOP;
END $$;

-- Drop all org_invites policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'org_invites') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON org_invites';
    END LOOP;
END $$;

-- Drop all profiles policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
END $$;

-- ============================================
-- CREATE FRESH POLICIES
-- ============================================

-- ORG_MEMBERS POLICIES
CREATE POLICY "view_org_members"
ON org_members FOR SELECT TO authenticated
USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "insert_org_members"
ON org_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "update_org_members"
ON org_members FOR UPDATE TO authenticated
USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "delete_org_members"
ON org_members FOR DELETE TO authenticated
USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- ORGANIZATIONS POLICIES
CREATE POLICY "view_organizations"
ON organizations FOR SELECT TO authenticated
USING (id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "create_organizations"
ON organizations FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "update_organizations"
ON organizations FOR UPDATE TO authenticated
USING (id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- ORG_INVITES POLICIES
CREATE POLICY "view_org_invites"
ON org_invites FOR SELECT TO authenticated
USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "anon_lookup_invites_by_code"
ON org_invites FOR SELECT TO anon
USING (status = 'pending');

CREATE POLICY "auth_lookup_invites_by_code"
ON org_invites FOR SELECT TO authenticated
USING (status = 'pending');

CREATE POLICY "insert_org_invites"
ON org_invites FOR INSERT TO authenticated
WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "update_org_invites"
ON org_invites FOR UPDATE TO authenticated
USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- PROFILES POLICIES
CREATE POLICY "view_own_profile"
ON profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid());

CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- ============================================
-- VERIFY
-- ============================================
SELECT 
  tablename,
  policyname,
  cmd,
  roles::text[]
FROM pg_policies 
WHERE tablename IN ('profiles', 'org_invites', 'org_members', 'organizations')
ORDER BY tablename, policyname;
