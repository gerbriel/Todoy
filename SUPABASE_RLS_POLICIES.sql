-- Row Level Security Policies for org_invites table
-- Run these commands in your Supabase SQL Editor

-- Enable RLS on org_invites table
ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view invites for organizations they are members of
CREATE POLICY "Users can view invites for their organizations"
ON org_invites FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invites.org_id
    AND org_members.user_id = auth.uid()
  )
);

-- Policy: Allow admins and owners to create invites
CREATE POLICY "Admins and owners can create invites"
ON org_invites FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invites.org_id
    AND org_members.user_id = auth.uid()
    AND org_members.role IN ('admin', 'owner')
  )
);

-- Policy: Allow admins and owners to delete invites
CREATE POLICY "Admins and owners can delete invites"
ON org_invites FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invites.org_id
    AND org_members.user_id = auth.uid()
    AND org_members.role IN ('admin', 'owner')
  )
);

-- Policy: Allow admins and owners to update invites
CREATE POLICY "Admins and owners can update invites"
ON org_invites FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invites.org_id
    AND org_members.user_id = auth.uid()
    AND org_members.role IN ('admin', 'owner')
  )
);

-- Also check if org_members table has RLS enabled
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view org members for organizations they belong to
CREATE POLICY "Users can view members of their organizations"
ON org_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.org_id = org_members.org_id
    AND om.user_id = auth.uid()
  )
);

-- Policy: Allow owners and admins to update member roles
CREATE POLICY "Admins and owners can update member roles"
ON org_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.org_id = org_members.org_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
  )
);

-- Policy: Allow owners and admins to remove members
CREATE POLICY "Admins and owners can remove members"
ON org_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.org_id = org_members.org_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
  )
  -- Prevent owners from removing themselves
  AND NOT (
    org_members.role = 'owner' 
    AND org_members.user_id = auth.uid()
  )
);

-- Policy: Allow new members to be added by admins/owners
CREATE POLICY "Admins and owners can add members"
ON org_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.org_id = org_members.org_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
  )
);
