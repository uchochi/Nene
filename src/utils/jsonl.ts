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
  [key: string]: unknown
}

export function validateJSONL(content: string): { valid: boolean; errors: string[]; entries: JSONLEntry[] } {
  const errors: string[] = []
  const entries: JSONLEntry[] = []
  const lines = content.split('\n').filter(l => l.trim())

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

export function formatAsJSONL(entries: JSONLEntry[]): string {
  return entries.map(e => JSON.stringify(e)).join('\n')
}

export function downloadJSONL(content: string, filename: string): void {
  try {
    const blob = new Blob([content], { type: 'application/octet-stream' })
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
  } catch {
    window.open('data:text/plain;charset=utf-8,' + encodeURIComponent(content), '_blank')
  }
}

export function countEntries(content: string): number {
  return content.split('\n').filter(l => l.trim()).length
}

export function getStatistics(entries: JSONLEntry[]): Record<string, unknown> {
  const byLanguage: Record<string, number> = {}
  const byRegion: Record<string, number> = {}
  const byMechanic: Record<string, number> = {}

  entries.forEach(e => {
    byLanguage[e.language_code] = (byLanguage[e.language_code] || 0) + 1
    byRegion[e.region] = (byRegion[e.region] || 0) + 1
    e.humor_mechanics?.forEach(m => {
      byMechanic[m] = (byMechanic[m] || 0) + 1
    })
  })

  return {
    totalEntries: entries.length,
    byLanguage,
    byRegion,
    byMechanic,
    uniqueLanguages: Object.keys(byLanguage).length,
    uniqueRegions: Object.keys(byRegion).length,
  }
}
