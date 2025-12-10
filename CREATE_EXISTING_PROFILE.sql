-- CREATE MISSING PROFILE FOR EXISTING USER
-- Run this in Supabase SQL Editor

-- This will create the profile for the user that signed up before the trigger was added
-- User ID: bd86f5d2-75c2-4286-9a7c-bc764f6ff2f2

-- First, check if profile exists
SELECT * FROM public.profiles WHERE id = 'bd86f5d2-75c2-4286-9a7c-bc764f6ff2f2';

-- If no results, create the profile manually
INSERT INTO public.profiles (id, email, name, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
  created_at
FROM auth.users
WHERE id = 'bd86f5d2-75c2-4286-9a7c-bc764f6ff2f2'
ON CONFLICT (id) DO NOTHING;

-- Verify the profile was created
SELECT * FROM public.profiles WHERE id = 'bd86f5d2-75c2-4286-9a7c-bc764f6ff2f2';
