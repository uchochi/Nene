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

let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null

function ensureAuthListener(set: (partial: Partial<AuthState>) => void): void {
  if (authListener || !supabase) return
  authListener = supabase.auth.onAuthStateChange((_event, session) => {
    set({ user: session?.user ?? null })
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
        AUTH_STORAGE_KEYS.forEach(k => {
          try { localStorage.removeItem(k) } catch { /* ignore */ }
        })
        localStorage.removeItem(TG_USER_KEY)
        set({ user: null, loading: false, initialized: true })
        return
      }

      /* persist current Telegram user so we can detect switches */
      if (tgUserId) {
        localStorage.setItem(TG_USER_KEY, String(tgUserId))
      }

      const { data: { session } } = await supabase.auth.getSession()
      set({ user: session?.user ?? null, loading: false, initialized: true })

      ensureAuthListener(set)
    } catch {
      set({ user: null, loading: false, initialized: true })
    }
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
