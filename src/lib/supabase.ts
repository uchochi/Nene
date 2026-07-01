import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured = !!(supabaseUrl && supabaseAnonKey)

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export async function setSupabaseToken(token: string | null) {
  if (!supabase) return
  if (token) {
    await supabase.auth.setSession({ access_token: token, refresh_token: '' })
  } else {
    await supabase.auth.signOut()
  }
}

export const supabaseUrl_ = supabaseUrl
export const supabaseAnonKey_ = supabaseAnonKey

export function requireSupabase(): void {
  if (!isConfigured) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
    )
  }
}
