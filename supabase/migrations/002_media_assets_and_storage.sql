-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: Media Assets Table, Storage Buckets, and RLS Policies
-- 
-- Supports the multimodal workflow upgrade: images, audio, video, and PDFs.
-- Media files are SESSION-SCOPED and EPHEMERAL — they are deleted when the
-- user's session ends. The media_assets table tracks metadata; the actual
-- binaries live in Supabase Storage under userId/sessions/sessionId/ paths.
-- ─────────────────────────────────────────────────────────────────────────────

-- Section 1: media_assets metadata table

CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'audio', 'video', 'document')),
  bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'needsUpload')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON public.media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_session ON public.media_assets(user_id, session_id);

-- Section 2: RLS on media_assets (users can only access their own metadata)

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_assets_owner_read"
  ON public.media_assets FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "media_assets_owner_insert"
  ON public.media_assets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "media_assets_owner_delete"
  ON public.media_assets FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Section 3: Private storage buckets (one per media type, all 50MB limit)
-- Public = false: media is user-private, accessed via signed URLs only.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('media-images', 'media-images', false, 52428800,
    ARRAY['image/png','image/jpeg','image/webp','image/gif']),
  ('media-audio', 'media-audio', false, 52428800,
    ARRAY['audio/wav','audio/mpeg','audio/aac','audio/ogg','audio/flac','audio/mp4','audio/x-m4a','audio/aiff','audio/x-aiff']),
  ('media-video', 'media-video', false, 52428800,
    ARRAY['video/mp4','video/mpeg','video/quicktime','video/webm']),
  ('media-docs', 'media-docs', false, 52428800,
    ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Section 4: RLS policies on storage.objects for the 4 media buckets
-- CRITICAL: Every INSERT policy MUST be paired with a SELECT policy because
-- Supabase Storage upload runs INSERT...RETURNING — a missing SELECT causes 403.
-- NOTE: In this Supabase version, storage.objects.owner is type UUID (not text).

CREATE POLICY "media_buckets_owner_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('media-images','media-audio','media-video','media-docs')
    AND owner = auth.uid()
  );

CREATE POLICY "media_buckets_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('media-images','media-audio','media-video','media-docs')
    AND owner = auth.uid()
  );

CREATE POLICY "media_buckets_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('media-images','media-audio','media-video','media-docs')
    AND owner = auth.uid()
  );

-- Section 5: Session cleanup function
-- Uses auth.uid() internally (SECURITY DEFINER) so users can't delete others' media.
-- search_path is pinned for security. anon role is revoked.

CREATE OR REPLACE FUNCTION public.delete_session_media(p_session_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete storage objects matching the session path pattern
  DELETE FROM storage.objects
  WHERE bucket_id IN ('media-images','media-audio','media-video','media-docs')
    AND owner = v_uid
    AND name LIKE v_uid::text || '/sessions/' || p_session_id || '/%';

  -- Delete metadata rows
  DELETE FROM public.media_assets
  WHERE user_id = v_uid AND session_id = p_session_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_session_media(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_session_media(TEXT) TO authenticated;
