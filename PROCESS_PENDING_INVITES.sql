-- Function to process pending invites for a user
-- This will find any pending invites by email and add the user to the organization

CREATE OR REPLACE FUNCTION process_pending_invites(user_email text, user_id uuid)
RETURNS TABLE (
  org_id uuid,
  org_name text,
  role text,
  invite_id uuid
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  invite_record RECORD;
  org_name_var text;
BEGIN
  -- Loop through all pending OR accepted invites for this email
  -- (accepted means they clicked the link but weren't logged in yet)
  FOR invite_record IN
    SELECT 
      oi.id as invite_id,
      oi.org_id,
      oi.role,
      oi.email
    FROM org_invites oi
    WHERE oi.email = user_email
    AND oi.status IN ('pending', 'accepted')
    AND (oi.expires_at IS NULL OR oi.expires_at > NOW())
  LOOP
    -- Get organization name
    SELECT o.name INTO org_name_var
    FROM organizations o
    WHERE o.id = invite_record.org_id;
    
    -- Check if user is already a member
    IF NOT EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = invite_record.org_id
      AND om.user_id = user_id
    ) THEN
      -- Add user to organization
      INSERT INTO org_members (org_id, user_id, role)
      VALUES (invite_record.org_id, user_id, invite_record.role)
      ON CONFLICT (org_id, user_id) DO NOTHING;
      
      -- Update invite status to accepted
      UPDATE org_invites
      SET status = 'accepted'
      WHERE id = invite_record.invite_id;
      
      -- Return the processed invite info
      RETURN QUERY
      SELECT 
        invite_record.org_id,
        org_name_var,
        invite_record.role,
        invite_record.invite_id;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_pending_invites(text, uuid) TO authenticated;

-- Create a helper function that users can call to check and process their own invites
CREATE OR REPLACE FUNCTION check_my_invites()
RETURNS TABLE (
  org_id uuid,
  org_name text,
  role text,
  invite_id uuid
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_email text;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Process invites and return results
  RETURN QUERY
  SELECT * FROM process_pending_invites(user_email, auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION check_my_invites() TO authenticated;

-- Test the function (uncomment to test as current user)
/*
SELECT * FROM check_my_invites();
*/

-- Also create a trigger to automatically process invites when a profile is created
CREATE OR REPLACE FUNCTION auto_process_invites_on_profile_create()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_email text;
BEGIN
  -- Get user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;
  
  -- Process any pending invites
  PERFORM process_pending_invites(user_email, NEW.id);
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_process_invites ON profiles;

-- Create trigger on profiles table
CREATE TRIGGER trigger_auto_process_invites
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION auto_process_invites_on_profile_create();

-- Verify trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_process_invites';
