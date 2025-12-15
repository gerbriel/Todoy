-- Create a function to get all members of user's organization
-- This function uses SECURITY DEFINER to bypass RLS
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_my_org_members()
RETURNS SETOF org_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Return all members from orgs where the current user is a member
  RETURN QUERY
  SELECT om.*
  FROM org_members om
  WHERE om.org_id IN (
    SELECT org_id 
    FROM org_members 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_my_org_members() TO authenticated;

-- Test the function
-- SELECT * FROM get_my_org_members();
