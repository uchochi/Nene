import {
  computeStats,
  generateDatasetSignature,
  isDatasetCommentLine,
  buildJSONLHeader,
  buildJSONLFooter,
  buildJSONLSeparator,
  signEntry,
} from './datasetSignature'

export interface JSONLEntry {
  id: string
  language_code: string
  region: string
  format: string
  setup: string
  punchline: string
  literal_english_translation?: string
  humor_mechanics: string[]
  cultural_context: string
  linguistic_context: string
  explanation_for_ai: string

  /* ── Multimodal fields (optional — present when media was processed) ── */
  /** Type of media: 'image' | 'audio' | 'video' | 'document' */
  media_type?: string
  /** Unique ID of the media asset */
  media_id?: string
  /** Original filename of the uploaded media */
  media_filename?: string
  /** Signed URL to the image in Supabase Storage (session-scoped, ephemeral) */
  image_url?: string
  /** AI-generated description of the image (from Caption or Vision AI node) */
  image_description?: string
  /** Text extracted from the image via OCR */
  image_text?: string
  /** Signed URL to audio in Supabase Storage (session-scoped, ephemeral) */
  audio_ref?: string
  /** Signed URL to video in Supabase Storage */
  video_ref?: string
  /** Signed URL to document in Supabase Storage */
  doc_ref?: string
  /** Text transcribed from audio */
  transcript?: string
  /** Full structured vision AI analysis (JSON string) */
  vision_analysis?: string
  /** Raw extracted text (from OCR) */
  extracted_text?: string

  [key: string]: unknown
}

export function validateJSONL(content: string): { valid: boolean; errors: string[]; entries: JSONLEntry[] } {
  const errors: string[] = []
  const entries: JSONLEntry[] = []
  /* Skip blank lines and structural comment lines (header/footer/separators) */
  const lines = content.split('\n').filter(l => l.trim() && !isDatasetCommentLine(l))

  for (let i = 0; i < lines.length; i++) {
    try {
      const parsed = JSON.parse(lines[i])
      entries.push(parsed as JSONLEntry)

      if (!parsed.id) errors.push(`Line ${i + 1}: missing "id"`)
      if (!parsed.language_code) errors.push(`Line ${i + 1}: missing "language_code"`)
      if (!parsed.setup && !parsed.punchline) errors.push(`Line ${i + 1}: missing both "setup" and "punchline"`)
    } catch {
      errors.push(`Line ${i + 1}: invalid JSON`)
    }
  }

  return { valid: errors.length === 0, errors, entries }
}

/**
 * Renders entries in the unique dataset structure:
 * signature header block, `_dataset_sig`-stamped entries separated by
 * comment rules, and a statistics footer block.
 */
export function formatAsJSONL(entries: JSONLEntry[]): string {
  const sig = generateDatasetSignature()
  const stats = computeStats(entries as unknown as Array<Record<string, unknown>>)
  const body = entries.map(e => JSON.stringify(signEntry(e as Record<string, unknown>, sig)))
  return [
    buildJSONLHeader(sig, stats),
    body.join('\n' + buildJSONLSeparator() + '\n'),
    buildJSONLFooter(sig, stats),
  ].join('\n')
}

export function downloadJSONL(content: string, filename: string): void {
  // Strategy 1: blob URL + anchor click
  const tryBlob = (): boolean => {
    try {
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 5000)
      return true
    } catch { return false }
  }

  // Strategy 2: data URI fallback
  const tryDataUri = (): boolean => {
    try {
      const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content)
      const a = document.createElement('a')
      a.href = dataUri
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return true
    } catch { return false }
  }

  // Strategy 3: open in new window
  const tryNewWindow = (): boolean => {
    try {
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      window.open(url)
      return true
    } catch { return false }
  }

  if (tryBlob()) return
  if (tryDataUri()) return
  if (tryNewWindow()) return
  throw new Error('All download strategies failed')
}

export function countEntries(content: string): number {
  return content.split('\n').filter(l => l.trim() && !isDatasetCommentLine(l)).length
}

export function getStatistics(entries: JSONLEntry[]): Record<string, unknown> {
  const byLanguage: Record<string, number> = {}
  const byRegion: Record<string, number> = {}
  const byMechanic: Record<string, number> = {}
  const byMediaType: Record<string, number> = {}

  entries.forEach(e => {
    byLanguage[e.language_code] = (byLanguage[e.language_code] || 0) + 1
    byRegion[e.region] = (byRegion[e.region] || 0) + 1
    e.humor_mechanics?.forEach(m => {
      byMechanic[m] = (byMechanic[m] || 0) + 1
    })
    if (e.media_type) {
      byMediaType[e.media_type] = (byMediaType[e.media_type] || 0) + 1
    }
  })

  const totalMedia = entries.filter(e => e.media_type).length

  return {
    totalEntries: entries.length,
    byLanguage,
    byRegion,
    byMechanic,
    byMediaType,
    uniqueLanguages: Object.keys(byLanguage).length,
    uniqueRegions: Object.keys(byRegion).length,
    multimodalEntries: totalMedia,
    textOnlyEntries: entries.length - totalMedia,
    hasImages: (byMediaType.image || 0) > 0,
    hasAudio: (byMediaType.audio || 0) > 0,
    hasVideo: (byMediaType.video || 0) > 0,
    hasDocuments: (byMediaType.document || 0) > 0,
  }
}
