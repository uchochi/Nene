import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const TG_USER_KEY = 'n8n_tg_uid'

const AUTH_STORAGE_KEYS = [
  'supabase.auth.token',
  'supabase.auth.token-code-verifier',
  'supabase.auth.token-user',
]

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  configError: string | null
  setUser: (user: User | null) => void
  initialize: () => Promise<void>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

function getCurrentTelegramUserId(): number | null {
  try {
    const tg = window.Telegram?.WebApp as Record<string, unknown> | undefined
    if (!tg) return null
    const unsafeData = tg.initDataUnsafe as Record<string, unknown> | undefined
    if (!unsafeData) return null
    const user = unsafeData.user as Record<string, unknown> | undefined
    return (user?.id as number) ?? null
  } catch {
    return null
  }
}

function clearSupabaseStorage(): void {
  AUTH_STORAGE_KEYS.forEach(k => {
    try { localStorage.removeItem(k) } catch { /* ignore */ }
  })
}

let tgWatchRegistered = false

function registerTgWatch(set: (partial: Partial<AuthState>) => void): void {
  if (tgWatchRegistered) return
  tgWatchRegistered = true
  if (typeof document === 'undefined') return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    const currentUserId = getCurrentTelegramUserId()
    const storedId = localStorage.getItem(TG_USER_KEY)
    if (currentUserId && storedId && String(currentUserId) !== storedId) {
      supabase?.auth.signOut().catch(() => {})
      clearSupabaseStorage()
      localStorage.removeItem(TG_USER_KEY)
      set({ user: null })
    }
  })
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  configError: null,

  setUser: (user) => set({ user, loading: false, initialized: true }),

  initialize: async () => {
    if (!supabase) {
      set({ user: null, loading: false, initialized: true, configError: 'Supabase not configured' })
      return
    }
    try {
      const tgUserId = getCurrentTelegramUserId()
      const storedTgUserId = localStorage.getItem(TG_USER_KEY)

      /* Telegram account switched — sign out and clear storage */
      if (tgUserId && storedTgUserId && String(tgUserId) !== storedTgUserId) {
        await supabase.auth.signOut()
        clearSupabaseStorage()
        set({ user: null, loading: false, initialized: true })
        return
      }

      /* persist current Telegram user so we can detect switches */
      if (tgUserId) {
        localStorage.setItem(TG_USER_KEY, String(tgUserId))
      }

      const { data: { session } } = await supabase.auth.getSession()
      set({ user: session?.user ?? null, loading: false, initialized: true })

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null })
      })
    } catch {
      set({ user: null, loading: false, initialized: true })
    }

    registerTgWatch(set)
  },

  signOut: async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    set({ user: null })
  },

  updatePassword: async (newPassword: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },
}))
