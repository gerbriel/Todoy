-- FIX AUTH ISSUES
-- Run this in Supabase SQL Editor

-- 1. Create a trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Update RLS policies for profiles to allow the trigger to work
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 3. Make sure profiles table allows SELECT for authenticated users
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 4. Update org_members policies to allow insert during signup
DROP POLICY IF EXISTS "Organization members can be added by owners" ON public.org_members;

CREATE POLICY "Users can join organizations"
  ON public.org_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Update organizations policy to allow creation
DROP POLICY IF EXISTS "Anyone can create organizations" ON public.organizations;

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
