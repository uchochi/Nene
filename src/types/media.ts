/**
 * Media types and helpers for the multimodal workflow engine.
 *
 * This module is the shared contract imported by workflowStore, mediaUpload,
 * ConfigPanel, jsonl, and other modules. The MediaAsset interface includes
 * session-scoped ephemeral fields: uploaded files are temporary and deleted
 * when the session ends, but their metadata persists in saved workflows.
 */

import { uuid } from '../utils/uuid'

/** Supported media modalities in the workflow pipeline. */
export type MediaType = 'image' | 'audio' | 'video' | 'document'

/**
 * Lifecycle status of a media asset.
 * - 'uploaded': file exists in storage now, signedUrl is valid
 * - 'needsUpload': file metadata saved in workflow but binary was deleted;
 *   user must re-upload before the workflow can run
 */
export type MediaAssetStatus = 'uploaded' | 'needsUpload'

/**
 * A media file in the workflow pipeline. Media files are session-scoped:
 * the path includes a sessionId so they can be bulk-deleted on session end.
 * When a workflow is saved, signedUrl is stripped and status becomes 'needsUpload'.
 */
export interface MediaAsset {
  id: string
  userId: string
  sessionId: string
  type: MediaType
  bucket: string
  /** Full storage path: `${userId}/sessions/${sessionId}/${uuid}-${filename}` */
  path: string
  filename: string
  mimeType: string
  size: number
  /** Only present when status === 'uploaded' */
  signedUrl?: string
  status: MediaAssetStatus
  /** ISO timestamp */
  createdAt: string
}

/** MIME types allowed across all 4 storage buckets. */
const SUPPORTED_MIME_TYPES: ReadonlySet<string> = new Set([
  // Images
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  // Audio
  'audio/wav',
  'audio/mpeg',
  'audio/aac',
  'audio/ogg',
  'audio/flac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aiff',
  'audio/x-aiff',
  // Video
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
  // Documents
  'application/pdf',
])

/**
 * Maps a MIME type string to its pipeline MediaType.
 * Defaults to 'document' for unrecognized types.
 */
export function inferMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  return 'document'
}

/** Maps a MediaType to its Supabase Storage bucket name. */
export function mediaTypeToBucket(type: MediaType): string {
  switch (type) {
    case 'image': return 'media-images'
    case 'audio': return 'media-audio'
    case 'video': return 'media-video'
    case 'document': return 'media-docs'
  }
}

/** Returns true only for MIME types accepted by our storage buckets. */
export function isSupportedMime(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.has(mimeType)
}

/**
 * Creates a 'needsUpload' placeholder from file metadata.
 * Used when loading a saved workflow whose media files were deleted
 * from the previous session. The UI shows "Re-upload required: {filename}".
 */
export function createMediaPlaceholder(
  filename: string,
  mimeType: string,
  size: number,
  userId: string,
  sessionId: string,
): MediaAsset {
  const type = inferMediaType(mimeType)
  return {
    id: uuid(),
    userId,
    sessionId,
    type,
    bucket: mediaTypeToBucket(type),
    path: '',
    filename,
    mimeType,
    size,
    status: 'needsUpload',
    createdAt: new Date().toISOString(),
  }
}
