import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { initialize } = useAuthStore()

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
        email, password,
        options: { emailRedirectTo: undefined },
      })
      if (signUpError) throw signUpError
      setView('verify-otp')
      setMessage('We sent an 8-digit code to your email.')
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      /* set user directly from sign-in response instead of re-fetching session */
      if (data?.user) {
        useAuthStore.getState().setUser(data.user)
      } else {
        await initialize()
      }
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
      const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' })
      if (verifyError) throw verifyError
      await initialize()
    } catch (err: any) {
      setError(err.message ?? 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full pl-10 pr-4 py-3 bg-n8n-dark-2 border border-n8n-dark-5 rounded-lg text-sm text-white placeholder:text-n8n-gray outline-none focus:border-[#EA4B71] focus:ring-1 focus:ring-[#EA4B71]/20 transition-all'
  const labelClass = 'text-sm font-medium text-white mb-1.5 block'
  const btnPrimary = 'w-full py-3 bg-[#EA4B71] hover:bg-[#d23d60] text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed'
  const linkClass = 'text-[#EA4B71] hover:text-[#d23d60] font-medium transition-colors'

  function renderForm() {
    if (view === 'verify-otp') {
      return (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <label className={labelClass}>Verification Code</label>
            <input
              type="text" inputMode="numeric" pattern="[0-9]*" maxLength={8}
              value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-n8n-dark-2 border border-n8n-dark-5 rounded-lg text-center text-lg tracking-[0.5em] text-white placeholder:text-n8n-gray outline-none focus:border-[#EA4B71] focus:ring-1 focus:ring-[#EA4B71]/20 transition-all"
              placeholder="00000000" required
            />
          </div>
          <button type="submit" disabled={loading || otp.length !== 8} className={btnPrimary}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
          <button type="button" onClick={() => setView('sign-up')} className={'w-full text-sm ' + linkClass + ' text-center'}>
            Back
          </button>
        </form>
      )
    }

    if (view === 'sign-up') {
      return (
        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label className={labelClass}>Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-n8n-gray" />
              <input type="text" className={inputClass} placeholder="Alex Morgan" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-n8n-gray" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="name@company.com" required />
            </div>
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-n8n-gray" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass + ' pr-10'} placeholder="••••••••" minLength={6} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-n8n-gray hover:text-white transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-n8n-gray mt-1.5">Must be at least 6 characters.</p>
          </div>
          <div>
            <label className={labelClass}>Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-n8n-gray" />
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass + ' pr-10'} placeholder="••••••••" minLength={6} required />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-n8n-gray hover:text-white transition-colors">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? 'Creating account...' : 'Get Started'}
          </button>
          <p className="text-center text-sm text-n8n-gray">
            Already have an account?{' '}
            <button type="button" onClick={() => setView('sign-in')} className={linkClass}>Log In</button>
          </p>
        </form>
      )
    }

    return (
      <form onSubmit={handleSignIn} className="space-y-5">
        <div>
          <label className={labelClass}>Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-n8n-gray" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="name@company.com" required />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelClass + ' mb-0'}>Password</label>
            <button type="button" className="text-xs text-[#EA4B71] hover:text-[#d23d60] font-medium transition-colors">Forgot password?</button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-n8n-gray" />
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass + ' pr-10'} placeholder="••••••••" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-n8n-gray hover:text-white transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className={btnPrimary}>
          {loading ? 'Signing in...' : 'Log In'}
        </button>
        <p className="text-center text-sm text-n8n-gray">
          Don't have an account?{' '}
          <button type="button" onClick={() => setView('sign-up')} className={linkClass}>Sign up for free</button>
        </p>

      </form>
    )
  }

  return (
    <div className="min-h-screen bg-n8n-dark flex items-center justify-center p-4">
      <div className="flex w-full max-w-[960px] min-h-[600px] rounded-xl overflow-hidden shadow-2xl">
        <div className="hidden md:flex flex-1 relative bg-gradient-to-br from-[#EA4B71] to-[#040506] p-10 items-end">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:20px_20px]" />
          <div className="relative z-10 max-w-[320px]">
            <h2 className="text-3xl font-bold text-white mb-3">
              {view === 'sign-in' ? 'Automate Without Limits' : 'Build Without Boundaries'}
            </h2>
            <p className="text-[#fce7ec] text-sm leading-relaxed">
              {view === 'sign-in'
                ? 'Connect your tools, build complex operational nodes, and deploy workflows seamlessly.'
                : 'Create your account to design seamless integration architecture, spin up logic branches, and orchestrate apps.'}
            </p>
          </div>
        </div>

        <div className="flex-[1.2] bg-n8n-dark-3 p-10 md:p-14 flex flex-col justify-center">
          <div className="max-w-[420px] mx-auto w-full">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.png" alt="ooguy" className="w-9 h-9" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1.5">
                {view === 'sign-in' ? 'Log In' : view === 'sign-up' ? 'Create Account' : 'Verify Email'}
              </h1>
              <p className="text-sm text-n8n-gray">
                {view === 'sign-in' && 'Please enter your details to sign in to your dashboard.'}
                {view === 'sign-up' && 'Get started with your datasets today.'}
                {view === 'verify-otp' && 'Check your email for the verification code.'}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-[#EA4B71]/10 border border-[#EA4B71]/25 rounded-lg flex items-start gap-2.5">
                <span className="text-[#EA4B71] text-sm leading-5">{error}</span>
              </div>
            )}
            {message && (
              <div className="mb-5 p-3.5 bg-[#EA4B71]/10 border border-[#EA4B71]/25 rounded-lg flex items-start gap-2.5">
                <span className="text-[#EA4B71] text-sm leading-5">{message}</span>
              </div>
            )}

            {renderForm()}
          </div>
        </div>
      </div>
    </div>
  )
}
