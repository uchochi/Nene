const DOWNLOADER_BASE = import.meta.env.VITE_DOWNLOADER_URL || 'https://nene2u.vercel.app'

function encodeB64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

export function encodeDownloadData(content: string, filename: string): string {
  const d = encodeB64(content)
  const f = encodeB64(filename)
  return `${DOWNLOADER_BASE}/#d=${encodeURIComponent(d)}&f=${encodeURIComponent(f)}`
}
