/**
 * Supabase Storage utilities for uploading, accessing, and cleaning up
 * session-scoped media files (images, audio, video, PDFs).
 *
 * EPHEMERAL DESIGN: All files are stored under `${userId}/sessions/${sessionId}/`
 * paths. When a session ends, deleteSessionMedia() bulk-removes everything.
 * Workflows persist; media files do not.
 */

import { supabase, requireSupabase } from '../lib/supabase'
import type { MediaAsset, MediaType } from '../types/media'
import { inferMediaType, mediaTypeToBucket, isSupportedMime } from '../types/media'
import { uuid } from './uuid'

/**
 * Uploads a file to session-scoped Supabase Storage and records its metadata.
 * The file is stored at `${userId}/sessions/${sessionId}/${uuid}-${filename}`.
 *
 * @throws Error if the MIME type is unsupported, the upload fails, or the
 *   signed URL or metadata insert fails.
 */
export async function uploadMedia(
  file: File,
  userId: string,
  sessionId: string,
): Promise<MediaAsset> {
  requireSupabase()

  if (!isSupportedMime(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`)
  }

  const type = inferMediaType(file.type)
  const bucket = mediaTypeToBucket(type)
  const path = `${userId}/sessions/${sessionId}/${uuid()}-${file.name}`

  const { error: uploadError } = await supabase!
    .storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  // Mint a 1-hour signed URL for private bucket access
  const { data: urlData, error: urlError } = await supabase!
    .storage
    .from(bucket)
    .createSignedUrl(path, 3600)

  if (urlError || !urlData?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${urlError?.message ?? 'unknown'}`)
  }

  // Record metadata in the media_assets table
  const { data: metaRow, error: metaError } = await supabase!
    .from('media_assets')
    .insert({
      user_id: userId,
      session_id: sessionId,
      type,
      bucket,
      storage_path: path,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      status: 'uploaded',
    })
    .select('id, created_at')
    .single()

  if (metaError || !metaRow) {
    throw new Error(`Failed to record media metadata: ${metaError?.message ?? 'unknown'}`)
  }

  return {
    id: metaRow.id as string,
    userId,
    sessionId,
    type,
    bucket,
    path,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    signedUrl: urlData.signedUrl,
    status: 'uploaded',
    createdAt: metaRow.created_at as string,
  }
}

/**
 * Refreshes or creates a signed URL for an existing media asset.
 * @param expiresIn URL validity in seconds (default 3600 = 1 hour)
 */
export async function getSignedUrl(asset: MediaAsset, expiresIn: number = 3600): Promise<string> {
  requireSupabase()

  const { data, error } = await supabase!
    .storage
    .from(asset.bucket)
    .createSignedUrl(asset.path, expiresIn)

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? 'unknown'}`)
  }
  return data.signedUrl
}

/** Deletes a single media file from storage and its metadata row. */
export async function deleteMedia(asset: MediaAsset): Promise<void> {
  requireSupabase()

  const { error: storageError } = await supabase!
    .storage
    .from(asset.bucket)
    .remove([asset.path])

  if (storageError) {
    throw new Error(`Failed to delete storage object: ${storageError.message}`)
  }

  const { error: metaError } = await supabase!
    .from('media_assets')
    .delete()
    .eq('id', asset.id)

  if (metaError) {
    throw new Error(`Failed to delete metadata: ${metaError.message}`)
  }
}

/**
 * Bulk-deletes ALL media files for the current user's session.
 * Called when a session ends — media is ephemeral and should not persist.
 * Uses auth.uid() server-side, so no user_id parameter needed.
 */
export async function deleteSessionMedia(userId: string, sessionId: string): Promise<void> {
  requireSupabase()
  void userId // auth.uid() is used server-side, kept for API compatibility

  const { error } = await supabase!.rpc('delete_session_media', {
    p_session_id: sessionId,
  })

  if (error) {
    throw new Error(`Session cleanup failed: ${error.message}`)
  }
}

/**
 * Lists all uploaded media assets for a user/session, optionally filtered by type.
 * Only returns assets with status='uploaded' (active in current session).
 */
export async function listSessionMedia(
  userId: string,
  sessionId: string,
  type?: MediaType,
): Promise<MediaAsset[]> {
  requireSupabase()

  let query = supabase!
    .from('media_assets')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .eq('status', 'uploaded')
    .order('created_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list media: ${error.message}`)
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    userId: row.user_id as string,
    sessionId: row.session_id as string,
    type: row.type as MediaType,
    bucket: row.bucket as string,
    path: row.storage_path as string,
    filename: row.filename as string,
    mimeType: row.mime_type as string,
    size: row.size_bytes as number,
    status: 'uploaded' as const,
    createdAt: row.created_at as string,
  }))
}
