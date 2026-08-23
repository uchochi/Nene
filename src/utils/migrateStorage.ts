/**
 * One-time migration: copy data from old "n8n-dataset-*" localStorage keys
 * to the new "ooguy-*" keys so existing users keep their state.
 *
 * Note: credits are NOT migrated here — credit balances are server-backed
 * (Supabase user_credits) and localStorage credit caches are scoped per
 * user ("ooguy-credits:{userId}") in creditStore.ts. A shared credits key
 * leaked one account's balance to every account on the same browser.
 */
export function migrateLegacyStorageKeys(): void {
  const MIGRATIONS: [string, string][] = [
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
