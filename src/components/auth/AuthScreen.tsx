import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

type View = 'sign-in' | 'sign-up' | 'verify-otp'

export function AuthScreen() {
  const [view, setView] = useState<View>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tgAvailable, setTgAvailable] = useState(false)
  const { initialize } = useAuthStore()

  useEffect(() => {
    setTgAvailable(typeof window !== 'undefined' && !!window.Telegram?.WebApp)
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      if (!supabase) throw new Error('Supabase not configured')
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: undefined },
      })
      if (signUpError) throw signUpError
      setView('verify-otp')
      setMessage('We sent an 8-digit code to your email. Please enter it below.')
    } catch (err: any) {
      setError(err.message ?? 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      if (!supabase) throw new Error('Supabase not configured')
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError
      await initialize()
    } catch (err: any) {
      setError(err.message ?? 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      if (!supabase) throw new Error('Supabase not configured')
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      })
      if (verifyError) throw verifyError
      await initialize()
    } catch (err: any) {
      setError(err.message ?? 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleTelegramSignIn = async () => {
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const initData = window.Telegram?.WebApp?.initData
      if (!initData) throw new Error('Not running inside Telegram')

      const res = await fetch('/api/tg-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Telegram sign in failed')
      }

      const sessionData = await res.json()
      if (!supabase) throw new Error('Supabase not configured')

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
      })
      if (sessionError) throw sessionError

      await initialize()
    } catch (err: any) {
      setError(err.message ?? 'Telegram sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'n8n-input'
  const labelClass = 'n8n-label'
  const btnPrimaryClass = 'n8n-btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full'
  const linkClass = 'text-n8n-orange hover:text-n8n-orange-light transition-colors'

  return (
    <div className="min-h-screen bg-n8n-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-n8n-dark-3 rounded-2xl shadow-lg p-8 border border-n8n-dark-4">
        <h1 className="text-2xl font-bold text-center text-white mb-2">
          n8n Dataset
        </h1>
        <p className="text-sm text-center text-n8n-gray mb-8">
          {view === 'sign-in' && 'Sign in to your account'}
          {view === 'sign-up' && 'Create a new account'}
          {view === 'verify-otp' && 'Check your email for the verification code'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-n8n-red/10 border border-n8n-red/30 rounded-lg text-sm text-n8n-red">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-n8n-orange/10 border border-n8n-orange/30 rounded-lg text-sm text-n8n-orange-light">
            {message}
          </div>
        )}

        {view === 'verify-otp' ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className={labelClass}>Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className={inputClass + ' text-center text-lg tracking-widest'}
                placeholder="00000000"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 8}
              className={btnPrimaryClass}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              type="button"
              onClick={() => setView('sign-up')}
              className={'w-full text-sm ' + linkClass + ' text-center'}
            >
              Back
            </button>
          </form>
        ) : view === 'sign-up' ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="Repeat password"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={btnPrimaryClass}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
            <div className="text-center text-sm text-n8n-gray">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setView('sign-in')}
                className={linkClass}
              >
                Sign in
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={btnPrimaryClass}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <div className="text-center text-sm text-n8n-gray">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setView('sign-up')}
                className={linkClass}
              >
                Sign up
              </button>
            </div>
            {tgAvailable && (
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-n8n-dark-4" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-n8n-dark-3 px-2 text-n8n-gray">or</span>
                </div>
              </div>
            )}
            {tgAvailable && (
              <button
                type="button"
                onClick={handleTelegramSignIn}
                className="w-full py-2 px-4 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                Sign in with Telegram
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
