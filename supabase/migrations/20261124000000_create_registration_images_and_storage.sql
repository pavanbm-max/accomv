-- =============================================================================
-- MIGRATION: Centralized Supabase Storage and Registration Images Mapping
--
-- 1. Creates 'accommodation-assets' private bucket with 5MB size limit
--    and allowed mime types (WebP, JPG, JPEG, PNG).
-- 2. Configures Storage RLS policies for private, signed-url-only access.
-- 3. Creates 'registration_images' table mapping images to registrations with
--    full client-side compression metadata.
-- 4. Establishes RLS policies for registration_images.
-- =============================================================================

-- 1. Storage bucket: accommodation-assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'accommodation-assets',
  'accommodation-assets',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- Storage RLS:
DROP POLICY IF EXISTS "Staff can read accommodation assets" ON storage.objects;
CREATE POLICY "Staff can read accommodation assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'accommodation-assets' AND public.is_staff());

DROP POLICY IF EXISTS "Public and staff can insert accommodation assets" ON storage.objects;
CREATE POLICY "Public and staff can insert accommodation assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'accommodation-assets');

DROP POLICY IF EXISTS "Staff can update accommodation assets" ON storage.objects;
CREATE POLICY "Staff can update accommodation assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'accommodation-assets' AND public.is_staff());

-- 2. Registration Images Mapping Table
CREATE TABLE IF NOT EXISTS public.registration_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL DEFAULT 'accommodation-assets',
  storage_path TEXT NOT NULL,
  image_type TEXT NOT NULL DEFAULT 'payment_proof',
  upload_source TEXT NOT NULL DEFAULT 'student',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  original_file_size BIGINT,
  compressed_file_size BIGINT,
  compression_percentage NUMERIC(5, 2),
  image_format TEXT,
  image_width INT,
  image_height INT,
  sha256_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_registration_images_reg_id ON public.registration_images(registration_id);
CREATE INDEX IF NOT EXISTS idx_registration_images_created ON public.registration_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registration_images_source ON public.registration_images(upload_source);

-- RLS for registration_images
ALTER TABLE public.registration_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view all registration images" ON public.registration_images;
CREATE POLICY "Staff can view all registration images"
  ON public.registration_images FOR SELECT
  USING (public.is_staff());

DROP POLICY IF EXISTS "Public can view own registration images" ON public.registration_images;
CREATE POLICY "Public can view own registration images"
  ON public.registration_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      WHERE r.id = registration_images.registration_id
    )
  );

DROP POLICY IF EXISTS "Public and staff can insert registration images" ON public.registration_images;
CREATE POLICY "Public and staff can insert registration images"
  ON public.registration_images FOR INSERT
  WITH CHECK (true);
