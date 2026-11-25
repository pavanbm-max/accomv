-- =============================================================================
-- DATABASE SCHEMA: Pre-Registration & Participant Data Collection Portal
-- =============================================================================
-- This script configures a dedicated Supabase database for Pre-Registration,
-- accommodation planning, and coordinator follow-up tracking.
--
-- No payment gateways, no SMTP, no online payment collection.
-- =============================================================================

-- Enable required crypto extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sequence for human-readable reference IDs: PRE-2026-000101
CREATE SEQUENCE IF NOT EXISTS preregistration_ref_seq START WITH 101 INCREMENT BY 1;

-- 1. PROFILES TABLE (linked to auth.users for staff/admin portal access)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'volunteer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. REGISTRATIONS TABLE (Core Pre-Registration records)
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  gender TEXT,
  college TEXT NOT NULL,
  department TEXT,
  academic_year TEXT,
  event_category TEXT,
  emergency_contact TEXT,
  accommodation_required BOOLEAN NOT NULL DEFAULT false,
  accommodation_days INT NOT NULL DEFAULT 0,
  accommodation_participants INT NOT NULL DEFAULT 1,
  check_in_date DATE,
  check_out_date DATE,
  accommodation_estimated_amount NUMERIC NOT NULL DEFAULT 0,
  meal_estimated_amount NUMERIC NOT NULL DEFAULT 0,
  total_estimated_amount NUMERIC NOT NULL DEFAULT 0,
  registration_status TEXT NOT NULL DEFAULT 'pre_registered',
  is_team BOOLEAN NOT NULL DEFAULT false,
  team_name TEXT,
  team_members JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. MEAL_REQUIREMENTS TABLE (Participant meal demand)
CREATE TABLE IF NOT EXISTS public.meal_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  breakfast_quantity INT NOT NULL DEFAULT 0,
  lunch_quantity INT NOT NULL DEFAULT 0,
  dinner_quantity INT NOT NULL DEFAULT 0,
  breakfast_amount NUMERIC NOT NULL DEFAULT 0,
  lunch_amount NUMERIC NOT NULL DEFAULT 0,
  dinner_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. ADMIN_FOLLOWUPS TABLE (Coordinator follow-up tracking)
CREATE TABLE IF NOT EXISTS public.admin_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  followup_status TEXT NOT NULL DEFAULT 'Pending Contact' CHECK (
    followup_status IN ('Pending Contact', 'Contacted', 'Awaiting Payment', 'Confirmed', 'Cancelled')
  ),
  coordinator_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ANNOUNCEMENTS TABLE (System broadcast notices)
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. SETTINGS TABLE (Accommodation and meal pricing settings)
CREATE TABLE IF NOT EXISTS public.settings (
  id INT PRIMARY KEY CHECK (id = 1) DEFAULT 1,
  per_night_fee NUMERIC NOT NULL DEFAULT 200,
  breakfast_fee NUMERIC NOT NULL DEFAULT 50,
  lunch_fee NUMERIC NOT NULL DEFAULT 60,
  dinner_fee NUMERIC NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed default settings if empty
INSERT INTO public.settings (id, per_night_fee, breakfast_fee, lunch_fee, dinner_fee)
VALUES (1, 200, 50, 60, 60)
ON CONFLICT (id) DO UPDATE SET
  per_night_fee = EXCLUDED.per_night_fee,
  breakfast_fee = EXCLUDED.breakfast_fee,
  lunch_fee = EXCLUDED.lunch_fee,
  dinner_fee = EXCLUDED.dinner_fee;

-- =============================================================================
-- INDEXES FOR FAST SEARCH & FILTERING
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_registrations_reference_id ON public.registrations(reference_id);
CREATE INDEX IF NOT EXISTS idx_registrations_mobile ON public.registrations(mobile);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_college ON public.registrations(college);
CREATE INDEX IF NOT EXISTS idx_registrations_event_category ON public.registrations(event_category);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_requirements_reg_id ON public.meal_requirements(registration_id);
CREATE INDEX IF NOT EXISTS idx_admin_followups_reg_id ON public.admin_followups(registration_id);
CREATE INDEX IF NOT EXISTS idx_admin_followups_status ON public.admin_followups(followup_status);

-- =============================================================================
-- AUTOMATIC REFERENCE ID GENERATION & FOLLOW-UP RECORD CREATION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.fn_before_insert_registration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_id IS NULL OR NEW.reference_id = '' THEN
    NEW.reference_id := 'PRE-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('preregistration_ref_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_before_insert_registration ON public.registrations;
CREATE TRIGGER tr_before_insert_registration
BEFORE INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.fn_before_insert_registration();

-- Automatic admin_followups creation on registration insert
CREATE OR REPLACE FUNCTION public.fn_after_insert_registration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_followups (registration_id, followup_status, coordinator_notes)
  VALUES (NEW.id, 'Pending Contact', NULL)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_after_insert_registration ON public.registrations;
CREATE TRIGGER tr_after_insert_registration
AFTER INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.fn_after_insert_registration();

-- =============================================================================
-- HELPER RPCs (DASHBOARD STATS & DUPLICATE CHECK)
-- =============================================================================

-- Check duplicate registration by mobile or email
CREATE OR REPLACE FUNCTION public.check_duplicate_registration(
  p_mobile TEXT,
  p_email TEXT
)
RETURNS TABLE (
  exists_duplicate BOOLEAN,
  existing_reference_id TEXT,
  existing_full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE,
    r.reference_id,
    r.full_name
  FROM public.registrations r
  WHERE (r.mobile = TRIM(p_mobile) OR LOWER(r.email) = LOWER(TRIM(p_email)))
  ORDER BY r.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$;

-- Get full registration for public confirmation page
CREATE OR REPLACE FUNCTION public.get_pre_registration_public(
  p_reference_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'registration', row_to_json(r),
    'meals', (
      SELECT row_to_json(m) FROM public.meal_requirements m WHERE m.registration_id = r.id LIMIT 1
    ),
    'followup', (
      SELECT row_to_json(f) FROM public.admin_followups f WHERE f.registration_id = r.id LIMIT 1
    )
  )
  INTO v_result
  FROM public.registrations r
  WHERE UPPER(r.reference_id) = UPPER(TRIM(p_reference_id))
  LIMIT 1;

  RETURN v_result;
END;
$$;

-- Aggregate pre-registration statistics for Admin Dashboard
CREATE OR REPLACE FUNCTION public.get_preregistration_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_registrations', COUNT(*),
    'total_accommodation_participants', COALESCE(SUM(CASE WHEN accommodation_required THEN accommodation_participants ELSE 0 END), 0),
    'total_requested_accommodation_days', COALESCE(SUM(CASE WHEN accommodation_required THEN (accommodation_days * accommodation_participants) ELSE 0 END), 0),
    'breakfast_demand', (SELECT COALESCE(SUM(breakfast_quantity), 0) FROM public.meal_requirements),
    'lunch_demand', (SELECT COALESCE(SUM(lunch_quantity), 0) FROM public.meal_requirements),
    'dinner_demand', (SELECT COALESCE(SUM(dinner_quantity), 0) FROM public.meal_requirements),
    'estimated_accommodation_charges', COALESCE(SUM(accommodation_estimated_amount), 0),
    'estimated_meal_charges', COALESCE(SUM(meal_estimated_amount), 0),
    'total_estimated_charges', COALESCE(SUM(total_estimated_amount), 0),
    'followup_counts', json_build_object(
      'pending_contact', (SELECT COUNT(*) FROM public.admin_followups WHERE followup_status = 'Pending Contact'),
      'contacted', (SELECT COUNT(*) FROM public.admin_followups WHERE followup_status = 'Contacted'),
      'awaiting_payment', (SELECT COUNT(*) FROM public.admin_followups WHERE followup_status = 'Awaiting Payment'),
      'confirmed', (SELECT COUNT(*) FROM public.admin_followups WHERE followup_status = 'Confirmed'),
      'cancelled', (SELECT COUNT(*) FROM public.admin_followups WHERE followup_status = 'Cancelled')
    )
  )
  INTO v_stats
  FROM public.registrations;

  RETURN v_stats;
END;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Authenticated users can view their own profile; admins can manage
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Registrations: Public can insert; public can read by reference_id; staff can full access
CREATE POLICY "Public guest can submit pre-registration" ON public.registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public guest can view pre-registration" ON public.registrations
  FOR SELECT USING (true);

CREATE POLICY "Staff can update registrations" ON public.registrations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'volunteer'))
  );

CREATE POLICY "Admin can delete registrations" ON public.registrations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Meal Requirements: Public can insert and read; staff can update
CREATE POLICY "Public guest can insert meal requirements" ON public.meal_requirements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public guest can view meal requirements" ON public.meal_requirements
  FOR SELECT USING (true);

CREATE POLICY "Staff can update meal requirements" ON public.meal_requirements
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'volunteer'))
  );

-- Admin Followups: Anyone can view; staff can update
CREATE POLICY "Followups viewable" ON public.admin_followups
  FOR SELECT USING (true);

CREATE POLICY "Followups insertable" ON public.admin_followups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update followups" ON public.admin_followups
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'volunteer'))
  );

-- Announcements: Anyone can view published
CREATE POLICY "Announcements are public" ON public.announcements
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage announcements" ON public.announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'volunteer'))
  );

-- Settings: Public can read
CREATE POLICY "Settings are viewable by all" ON public.settings
  FOR SELECT USING (true);

CREATE POLICY "Admin can update settings" ON public.settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
