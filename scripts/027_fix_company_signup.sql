-- Fix company signup profile creation by properly extracting role and company details from meta data
-- and updating the set_admin_role trigger to respect explicitly provided roles.

-- 1. Update the function that fires BEFORE INSERT on profiles to respect the provided role
CREATE OR REPLACE FUNCTION set_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user (make them admin)
  IF (SELECT COUNT(*) FROM profiles) = 0 THEN
    NEW.role := 'admin';
  -- Or check if email matches admin email from environment
  ELSIF NEW.email = current_setting('app.admin_email', true) THEN
    NEW.role := 'admin';
  -- If role was not explicitly provided, default to user
  ELSIF NEW.role IS NULL THEN
    NEW.role := 'user';
  -- Otherwise, keep the explicitly provided role ('company', 'user', etc.)
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the auth.users trigger function to copy ALL metadata fields into the profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    avatar_url, 
    role,
    company_name,
    company_registration_number,
    company_website,
    company_phone,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'company_registration_number',
    NEW.raw_user_meta_data->>'company_website',
    NEW.raw_user_meta_data->>'company_phone',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
