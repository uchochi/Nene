/**
 * One-time migration: copy data from old "n8n-dataset-*" localStorage keys
 * to the new "ooguy-*" keys so existing users keep their credits & state.
 */
export function migrateLegacyStorageKeys(): void {
  const MIGRATIONS: [string, string][] = [
    ['n8n-dataset-credits', 'ooguy-credits'],
    ['n8n-dataset-onboarding-seen', 'ooguy-onboarding-seen'],
  ]

  for (const [oldKey, newKey] of MIGRATIONS) {
    try {
      const existing = localStorage.getItem(newKey)
      if (existing) continue
      const legacy = localStorage.getItem(oldKey)
      if (legacy !== null) {
        localStorage.setItem(newKey, legacy)
      }
    } catch { /* ignore */ }
  }
}
