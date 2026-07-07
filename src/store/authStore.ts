import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { initTMA } from '../utils/tma'

const TG_USER_KEY = 'n8n_tg_uid'

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
    const tma = initTMA()
    return tma.userId
  } catch {
    return null
  }
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

      /* Telegram account switched — sign out */
      if (tgUserId && storedTgUserId && String(tgUserId) !== storedTgUserId) {
        await supabase.auth.signOut()
        /* clear any leftover supabase session in storage */
        const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'))
        keys.forEach(k => localStorage.removeItem(k))
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
