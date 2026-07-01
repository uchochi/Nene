import { create } from 'zustand'
import { supabase, setSupabaseToken } from '../lib/supabase'

export interface TgUser {
  telegram_id: number
  username: string | null
  first_name: string | null
  last_name: string | null
  phone_number: string | null
}

interface AuthState {
  user: TgUser | null
  loading: boolean
  initialized: boolean
  configError: string | null
  token: string | null
  initialize: () => Promise<void>
  signOut: () => Promise<void>
  updatePhoneNumber: (phone: string) => void
}

function getStored(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

function store(key: string, value: string | null) {
  try { if (value) localStorage.setItem(key, value); else localStorage.removeItem(key) } catch {}
}

function getInitDataFromUrl(): string | null {
  const raw = new URLSearchParams(window.location.search).get('tgWebAppData')
  if (!raw) return null
  return decodeURIComponent(raw)
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  configError: null,
  token: null,

  initialize: async () => {
    if (!supabase) {
      set({ user: null, loading: false, initialized: true, configError: 'Supabase not configured' })
      return
    }

    const storedToken = getStored('tg_token')
    const storedUser = getStored('tg_user')
    let parsedUser: TgUser | null = null
    if (storedUser) {
      try { parsedUser = JSON.parse(storedUser) } catch {}
    }

    if (storedToken) {
      await setSupabaseToken(storedToken)
      set({ token: storedToken, user: parsedUser })
    }

    const initData = getInitDataFromUrl()
    if (!initData) {
      if (storedToken && parsedUser) {
        set({ loading: false, initialized: true })
      } else {
        set({ loading: false, initialized: true, configError: 'Not running inside Telegram' })
      }
      return
    }

    try {
      const res = await fetch(`${window.location.origin}/api/tg-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Authentication failed')
      }

      const data = await res.json()
      store('tg_token', data.token)
      store('tg_user', JSON.stringify(data.user))
      await setSupabaseToken(data.token)

      set({
        token: data.token,
        user: data.user,
        loading: false,
        initialized: true,
        configError: null,
      })
    } catch (err) {
      if (storedToken && parsedUser) {
        set({ loading: false, initialized: true })
      } else {
        set({
          loading: false,
          initialized: true,
          configError: err instanceof Error ? err.message : 'Authentication failed',
        })
      }
    }
  },

  signOut: async () => {
    store('tg_token', null)
    store('tg_user', null)
    await setSupabaseToken(null)
    set({ user: null, token: null })
  },

  updatePhoneNumber: (phone: string) => {
    set(state => {
      if (!state.user) return state
      const updated = { ...state.user, phone_number: phone }
      store('tg_user', JSON.stringify(updated))
      return { user: updated }
    })
  },
}))
