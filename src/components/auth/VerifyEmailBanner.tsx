import { useEffect, useState } from 'react'
import { MailWarning, X, RefreshCw, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

/**
 * Recurring "verify your email" banner.
 *
 * Shows for signed-in users whose email is still unconfirmed
 * (many couldn't confirm due to the SMTP incident). Dismissible,
 * but reappears periodically until the email is verified.
 */

const DISMISS_KEY = 'ooguy-verify-email-dismissed-at'
const REAPPEAR_AFTER_MS = 15 * 60 * 1000 // come back 15 min after dismissal
const RECHECK_INTERVAL_MS = 30 * 1000 // re-evaluate visibility periodically

export function VerifyEmailBanner() {
  const user = useAuthStore(s => s.user)
  const [visible, setVisible] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const needsVerification = !!user && !user.email_confirmed_at

  useEffect(() => {
    if (!needsVerification) {
      setVisible(false)
      return
    }

    const evaluate = () => {
      try {
        const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
        setVisible(Date.now() - dismissedAt > REAPPEAR_AFTER_MS)
      } catch {
        setVisible(true)
      }
    }

    evaluate()
    const timer = setInterval(evaluate, RECHECK_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [needsVerification])

  if (!needsVerification || !visible || !supabase || !user?.email) return null

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* ignore */ }
    setVisible(false)
  }

  const resend = async () => {
    if (!supabase || !user?.email) return
    setSending(true)
    setSendError(null)
    setSent(false)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not resend — please try again later.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-amber-500/15 backdrop-blur-sm border-b border-amber-500/30">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-start sm:items-center gap-3">
        <MailWarning className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1 min-w-0 text-sm leading-5 text-amber-100/90">
          <span className="font-semibold text-amber-200">Verify your email.</span>{' '}
          Our email service had an issue, so your confirmation email may never have arrived —{' '}
          <button onClick={resend} disabled={sending} className="underline underline-offset-2 hover:text-white font-medium disabled:opacity-50 inline-flex items-center gap-1">
            {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            {sending ? 'Sending…' : 'tap to resend it'}
          </button>
          {' '}and try the code again.
          {sent && <span className="ml-2 text-emerald-300 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" />Sent — check your inbox.</span>}
          {sendError && <span className="ml-2 text-red-300">{sendError}</span>}
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="text-amber-200/70 hover:text-white transition-colors shrink-0 mt-0.5 sm:mt-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
