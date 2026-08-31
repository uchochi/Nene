import { useState, useEffect, useCallback, useRef } from 'react'
import { Copy, Check, Loader2, AlertCircle, Clock, ShieldCheck, Landmark, ArrowLeft } from 'lucide-react'

/* ------------------------------------------------------- */
/*  Branded Paystack Bank Transfer Checkout                */
/*  Recreates the reference checkout.html layout but in    */
/*  ooguy's dark theme with orange/red accents.            */
/* ------------------------------------------------------- */

interface BankTransferCheckoutProps {
  open: boolean
  onClose: () => void
  onBack: () => void
  email: string
  amount: number          /* in kobo (Paystack subunit) */
  currency: string        /* e.g. NGN */
  reference: string
  planId: string
  credits: number
  userId: string
  onSuccess: () => void
}

interface BankTransferDetails {
  reference: string
  status: string
  display_text: string
  account_name: string
  account_number: string
  bank_name: string
  account_expires_at: string
}

export function BankTransferCheckout({
  open, onClose, onBack, email, amount, currency, reference,
  planId, credits, userId, onSuccess,
}: BankTransferCheckoutProps) {
  const [details, setDetails] = useState<BankTransferDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [checking, setChecking] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [pollError, setPollError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── 1. Initialize the bank transfer on open ── */
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError('')
    setDetails(null)
    setConfirmed(false)
    setPollError('')

    const init = async () => {
      try {
        const res = await fetch('/api/paystack-bank-transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            amount,
            currency,
            reference,
            metadata: {
              plan_id: planId,
              credits,
              custom_fields: [
                { display_name: 'Plan', variable_name: 'plan_id', value: planId },
                { display_name: 'Credits', variable_name: 'credits', value: String(credits) },
              ],
            },
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Could not set up bank transfer')
        }
        if (cancelled) return
        setDetails(data)
        /* compute initial countdown from expiry */
        const expires = new Date(data.account_expires_at).getTime()
        setTimeLeft(Math.max(0, Math.floor((expires - Date.now()) / 1000)))
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Bank transfer setup failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()

    return () => { cancelled = true }
  }, [open, email, amount, currency, reference, planId, credits])

  /* ── 2. Countdown timer ── */
  useEffect(() => {
    if (!open || !details) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [open, details])

  /* ── 3. Poll Paystack until the transfer is confirmed ── */
  const checkingRef = useRef(false)
  const checkStatus = useCallback(async () => {
    if (!details || checkingRef.current) return
    checkingRef.current = true
    setChecking(true)
    setPollError('')
    try {
      const res = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'paystack',
          verificationType: 'charge',
          reference: details.reference,
          userId,
          planId,
          credits,
          amount,
          currency,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setConfirmed(true)
        if (pollRef.current) clearInterval(pollRef.current)
        onSuccess()
      } else if (res.status === 402) {
        /* payment not yet verified — keep waiting */
        setPollError('')
      } else {
        setPollError(data.error || 'Could not verify payment')
      }
    } catch (e) {
      setPollError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      checkingRef.current = false
      setChecking(false)
    }
  }, [details, userId, planId, credits, amount, currency, onSuccess])

  /* auto-poll every 8 seconds once details are loaded */
  useEffect(() => {
    if (!open || !details || confirmed) return
    pollRef.current = setInterval(() => { checkStatus() }, 8000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [open, details, confirmed, checkStatus])

  /* ── 4. Copy helper ── */
  const copyValue = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }, [])

  if (!open) return null

  const formatAmount = (kobo: number): string => {
    const naira = kobo / 100
    return `${currency === 'NGN' ? '₦' : ''}${naira.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  const rawAmount = (amount / 100).toFixed(2)

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const expired = timeLeft <= 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-n8n-dark-2 border border-n8n-dark-4 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">

        {/* ── Header: brand + order ref ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-n8n-dark-4 bg-n8n-dark-3/60">
          <div className="flex items-center gap-2.5">
            <button onClick={onBack} className="p-1 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors" title="Back">
              <ArrowLeft size={16} />
            </button>
            <img src="/logo.png" alt="ooguy" className="h-6" />
          </div>
          <div className="text-[11px] text-n8n-gray-light font-medium">
            REF: <span className="text-n8n-orange font-semibold">{details?.reference || reference}</span>
          </div>
        </div>

        {/* ── Amount banner ── */}
        <div className="text-center px-5 py-5 border-b border-n8n-dark-4 bg-gradient-to-b from-n8n-dark-3/40 to-transparent">
          <div className="text-[11px] text-n8n-gray-light uppercase tracking-wider font-semibold">Total to Transfer</div>
          <div className="flex items-center justify-center gap-2.5 mt-1.5">
            <span className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
              {details ? formatAmount(amount) : '—'}
            </span>
            {details && (
              <button
                onClick={() => copyValue(rawAmount, 'amount')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${copied === 'amount' ? 'bg-green-600 text-white' : 'bg-n8n-orange/15 text-n8n-orange border border-n8n-orange/30 hover:bg-n8n-orange hover:text-white'}`}
              >
                {copied === 'amount' ? <Check size={12} className="inline" /> : <Copy size={12} className="inline" />} {copied === 'amount' ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* ── Loading / Error ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 text-n8n-gray-light">
              <Loader2 size={28} className="animate-spin text-n8n-orange mb-3" />
              <p className="text-sm">Setting up your bank transfer...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 rounded-xl bg-red-900/20 border border-red-700/30">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-400 font-medium">Could not set up transfer</p>
                  <p className="text-xs text-n8n-gray-light mt-1">{error}</p>
                  <button onClick={onBack} className="text-xs text-n8n-orange hover:underline mt-2 inline-block">Go back</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Bank details ── */}
          {!loading && !error && details && (
            <>
              {/* notice */}
              <div className="p-2.5 rounded-lg bg-n8n-orange/10 border border-n8n-orange/20 text-center text-[11px] font-semibold text-n8n-orange">
                ⚠️ Transfer the exact amount including kobo ({rawAmount}) to avoid delays.
              </div>

              {/* account card */}
              <div className="bg-n8n-dark-3 border border-n8n-dark-4 rounded-xl overflow-hidden">
                {/* Bank name */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-dashed border-n8n-dark-5">
                  <span className="text-xs text-n8n-gray-light font-medium flex items-center gap-1.5">
                    <Landmark size={13} className="text-n8n-orange" /> Bank Name
                  </span>
                  <span className="text-sm font-bold text-white">{details.bank_name || '—'}</span>
                </div>

                {/* Account number */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-dashed border-n8n-dark-5">
                  <span className="text-xs text-n8n-gray-light font-medium">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-n8n-orange tracking-wider">{details.account_number || '—'}</span>
                    {details.account_number && (
                      <button
                        onClick={() => copyValue(details.account_number, 'acc')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${copied === 'acc' ? 'bg-green-600 text-white' : 'bg-n8n-orange/15 text-n8n-orange border border-n8n-orange/30 hover:bg-n8n-orange hover:text-white'}`}
                      >
                        {copied === 'acc' ? <Check size={11} className="inline" /> : <Copy size={11} className="inline" />} {copied === 'acc' ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Account name */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-dashed border-n8n-dark-5">
                  <span className="text-xs text-n8n-gray-light font-medium">Account Name</span>
                  <span className="text-xs font-bold text-white text-right">{details.account_name || '—'}</span>
                </div>

                {/* Amount to pay */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-n8n-gray-light font-medium">Amount to Pay</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-n8n-orange">{formatAmount(amount)}</span>
                    <button
                      onClick={() => copyValue(rawAmount, 'amount2')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${copied === 'amount2' ? 'bg-green-600 text-white' : 'bg-n8n-orange/15 text-n8n-orange border border-n8n-orange/30 hover:bg-n8n-orange hover:text-white'}`}
                    >
                      {copied === 'amount2' ? <Check size={11} className="inline" /> : <Copy size={11} className="inline" />} {copied === 'amount2' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Timer + status ── */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 text-xs text-n8n-gray-light">
                  <Clock size={13} className="text-n8n-orange" />
                  Expires in: <span className="font-bold tabular-nums text-n8n-red">
                    {expired ? 'Expired' : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-n8n-gray-light">
                  {confirmed ? (
                    <span className="text-green-400 font-medium flex items-center gap-1"><Check size={13} /> Payment confirmed</span>
                  ) : expired ? (
                    <span className="text-n8n-red font-bold">Expired</span>
                  ) : (
                    <>
                      <Loader2 size={12} className="animate-spin text-n8n-orange" />
                      <span>Waiting for payment...</span>
                    </>
                  )}
                </div>
              </div>

              {/* ── Confirm button ── */}
              <button
                onClick={checkStatus}
                disabled={checking || expired || confirmed}
                className="w-full py-3 rounded-xl bg-n8n-orange hover:bg-n8n-orange-light text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checking ? (
                  <><Loader2 size={16} className="animate-spin" /> Verifying transfer...</>
                ) : confirmed ? (
                  <><Check size={16} /> Payment received!</>
                ) : (
                  'I Have Sent The Exact Money'
                )}
              </button>

              {pollError && (
                <p className="text-xs text-red-400 text-center">{pollError}</p>
              )}

              {/* ── Success banner ── */}
              {confirmed && (
                <div className="p-4 rounded-xl bg-green-900/20 border border-green-700/30 text-center">
                  <Check size={24} className="mx-auto mb-2 text-green-400" />
                  <p className="text-sm text-green-400 font-medium">Payment successful!</p>
                  <p className="text-xs text-n8n-gray-light mt-1">
                    {credits.toLocaleString()} credits added to your account.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer badge ── */}
        <div className="flex items-center justify-center gap-1.5 px-4 py-3 bg-n8n-dark-3/60 border-t border-n8n-dark-4 text-[11px] text-n8n-gray-light">
          <ShieldCheck size={13} className="text-n8n-orange" />
          Processed & secured by Paystack
        </div>
      </div>
    </div>
  )
}
