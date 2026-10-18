-- =========================================================================
-- CIVICSNAP DATABASE SCHEMA & SECURITY RULES (SUPABASE / POSTGRESQL)
-- =========================================================================
-- Execute this entire script in your Supabase SQL Editor.
-- It configures:
-- 1. profiles table linked to Supabase auth.users
-- 2. reports table linked to user_id
-- 3. Automatic profile creation trigger on signup (strictly defaulting to 'citizen')
-- 4. Role-based helper functions (is_admin)
-- 5. Strict Row Level Security (RLS) policies preventing privilege escalation
-- =========================================================================

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- 2. HELPER FUNCTION: Check if current user is admin (SECURITY DEFINER)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- -------------------------------------------------------------------------
-- 3. PROFILES RLS POLICIES
-- -------------------------------------------------------------------------

-- Policy: All authenticated users can read their own profile directly (zero recursion)
DROP POLICY IF EXISTS "Users can view their own profile or admins view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
  );

-- Policy: Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
  );

-- Policy: Users can update their own profile EXCEPT the role field (prevents self-promotion)
DROP POLICY IF EXISTS "Users can update own basic profile details" ON public.profiles;
CREATE POLICY "Users can update own basic profile details"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR public.is_admin()
  )
  WITH CHECK (
    -- If non-admin, the role MUST remain unchanged!
    (id = auth.uid() AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
    OR public.is_admin()
  );

-- Policy: Profiles can only be inserted by system trigger (or admin)
DROP POLICY IF EXISTS "System trigger or admin inserts profiles" ON public.profiles;
CREATE POLICY "System trigger or admin inserts profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id OR public.is_admin()
  );

-- -------------------------------------------------------------------------
-- 4. AUTOMATIC NEW USER SIGNUP TRIGGER
-- Creates a profile for every new user in auth.users
-- CRITICAL SECURITY: Always sets role to 'citizen', ignoring client-sent metadata!
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    'citizen' -- Strictly forced default role!
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------
-- 5. REPORTS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('pothole', 'trash', 'water_leak', 'other')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'in_progress', 'resolved', 'rejected')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  neighborhood TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  assigned_department TEXT,
  admin_notes TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- 6. REPORTS RLS POLICIES
-- -------------------------------------------------------------------------

-- Policy: Everyone (public + authenticated) can view civic reports on Explore
-- Private profile data (like email/phone) is NOT in this table, preserving citizen privacy
DROP POLICY IF EXISTS "Anyone can view civic reports" ON public.reports;
CREATE POLICY "Anyone can view civic reports"
  ON public.reports
  FOR SELECT
  TO public
  USING (true);

-- Policy: Authenticated users can insert their own reports (with user_id = auth.uid())
DROP POLICY IF EXISTS "Authenticated citizens can submit reports" ON public.reports;
CREATE POLICY "Authenticated citizens can submit reports"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
  );

-- Policy: Anonymous users can submit reports if allowed
DROP POLICY IF EXISTS "Anonymous can submit reports with null user_id" ON public.reports;
CREATE POLICY "Anonymous can submit reports with null user_id"
  ON public.reports
  FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
  );

-- Policy: Only municipal Admins can update reports (status, priority, department, admin_notes)
DROP POLICY IF EXISTS "Only admins can update reports" ON public.reports;
CREATE POLICY "Only admins can update reports"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
  );

-- Policy: Only municipal Admins can delete reports
DROP POLICY IF EXISTS "Only admins can delete reports" ON public.reports;
CREATE POLICY "Only admins can delete reports"
  ON public.reports
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
  );

-- -------------------------------------------------------------------------
-- 7. HOW TO CREATE / PROMOTE THE FIRST ADMIN ACCOUNT SAFELY
-- Run this in Supabase SQL editor after the admin user signs up:
-- -------------------------------------------------------------------------
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@civicsnap.org');
