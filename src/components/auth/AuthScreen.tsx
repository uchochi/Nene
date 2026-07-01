import { useState } from 'react'
import { supabase, supabaseUrl_, supabaseAnonKey_ } from '../../lib/supabase'

interface AuthScreenProps {
  onAuthSuccess: () => void
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [awaitingCode, setAwaitingCode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!supabase) { setError('Supabase not configured'); setLoading(false); return }
    try {
      if (awaitingCode) {
        if (!supabaseUrl_ || !supabaseAnonKey_) {
          throw new Error('Supabase not configured')
        }
        const res = await fetch(`${supabaseUrl_}/auth/v1/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey_,
          },
          body: JSON.stringify({ type: 'signup', email, token: code }),
        })
        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.msg || body.error_description || 'Invalid verification code')
        }
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!sessionData.session) {
          await supabase.auth.signInWithPassword({ email, password })
        }
        onAuthSuccess()
      } else {
        const { error: authError } = isRegister
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password })

        if (authError) throw authError
        if (isRegister) {
          setAwaitingCode(true)
        } else {
          onAuthSuccess()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-n8n-dark-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="n8n Dataset" className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white">n8n Dataset</h1>
          <p className="text-sm text-n8n-gray mt-1">
            {awaitingCode ? 'Check your email' : isRegister ? 'Create your account' : 'Sign in to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {awaitingCode ? (
            <>
              <p className="text-xs text-n8n-gray">Enter the 8-digit code sent to {email}</p>
              <div>
                <label className="label text-xs">Verification Code</label>
                <input
                  className="input-field text-center tracking-[8px] font-mono"
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="00000000"
                  required
                  maxLength={8}
                  inputMode="numeric"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label text-xs">Email</label>
                <input
                  className="input-field"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="label text-xs">Password</label>
                <input
                  className="input-field"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-n8n-red bg-n8n-red/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-n8n-orange text-white font-semibold text-sm hover:bg-n8n-orange/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : awaitingCode ? 'Verify Code' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
          {awaitingCode && (
            <p className="text-center text-xs text-n8n-gray mt-4">
              <button
                onClick={() => { setAwaitingCode(false); setError('') }}
                className="text-n8n-orange hover:underline"
              >
                ← Back to sign up
              </button>
            </p>
          )}
        </form>

        {!awaitingCode && (
          <p className="text-center text-xs text-n8n-gray mt-6">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="text-n8n-orange hover:underline"
            >
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
