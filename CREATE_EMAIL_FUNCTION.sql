-- Create a database function to handle invite emails
-- This will be called by a Supabase Edge Function
-- Run this in Supabase SQL Editor

-- First, make sure you have the pg_net extension enabled for HTTP requests
-- You may need to enable this in Supabase Dashboard under Database > Extensions

CREATE OR REPLACE FUNCTION send_invite_email(
  invite_id uuid,
  recipient_email text,
  invite_link text,
  org_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- This is a placeholder function
  -- In production, you would integrate with an email service like:
  -- 1. Resend (recommended - has Supabase integration)
  -- 2. SendGrid
  -- 3. Postmark
  -- 4. AWS SES
  
  -- For now, we'll just log the email details
  -- You'll need to replace this with actual email API calls
  
  RAISE NOTICE 'Email would be sent to: %', recipient_email;
  RAISE NOTICE 'Invite link: %', invite_link;
  RAISE NOTICE 'Organization: %', org_name;
  
  -- Return success
  result := json_build_object(
    'success', true,
    'message', 'Email queued for sending',
    'recipient', recipient_email
  );
  
  RETURN result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION send_invite_email(uuid, text, text, text) TO authenticated;
