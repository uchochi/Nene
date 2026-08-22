const DOWNLOADER_BASE = import.meta.env.VITE_DOWNLOADER_URL || 'https://nene2u.vercel.app'

/** True for structural comment lines (header/footer/separators). */
function isCommentLine(line: string): boolean {
  return line.trimStart().startsWith('#')
}

function encodeB64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

/** Encodes text content as a download link for the downloader bridge. */
export function encodeDownloadData(content: string, filename: string): string {
  const d = encodeB64(content)
  const f = encodeB64(filename)
  return `${DOWNLOADER_BASE}/?d=${encodeURIComponent(d)}&f=${encodeURIComponent(f)}`
}

/**
 * Encodes a media reference download link.
 * For media files hosted in Supabase Storage, we generate a link that points
 * to the signed URL rather than base64-encoding the binary (which would be
 * impractical for large files).
 *
 * @param signedUrl The Supabase Storage signed URL
 * @param filename The original filename
 */
export function encodeMediaDownloadLink(signedUrl: string, filename: string): string {
  const u = encodeB64(signedUrl)
  const f = encodeB64(filename)
  return `${DOWNLOADER_BASE}/?media=${encodeURIComponent(u)}&f=${encodeURIComponent(f)}`
}

/**
 * Generates a JSON manifest for a multimodal dataset.
 * The manifest links the JSONL data file with its associated media files,
 * useful when exporting a complete dataset package.
 */
export function generateMediaManifest(
  jsonlContent: string,
  mediaEntries: Array<{ id: string; type: string; filename: string; signedUrl?: string }>,
): string {
  const manifest = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    datasetFormat: 'jsonl',
    entryCount: jsonlContent.split('\n').filter(l => l.trim() && !isCommentLine(l)).length,
    media: mediaEntries.map(m => ({
      id: m.id,
      type: m.type,
      filename: m.filename,
      url: m.signedUrl || '[ephemeral — re-upload required]',
    })),
    note: 'Media files are session-scoped and ephemeral. URLs expire when the session ends.',
  }
  return JSON.stringify(manifest, null, 2)
}
