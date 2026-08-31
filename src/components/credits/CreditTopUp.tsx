import { useState, useCallback, useRef, useEffect } from 'react'
import PaystackPop from '@paystack/inline-js'
import { useCreditStore } from '../../store/creditStore'
import { useAuthStore } from '../../store/authStore'
import {
  PLANS, getPlanPrice, fetchExchangeRates,
  paystackAmount, flutterwaveAmount, formatCurrency, planTokenLabel, type Plan,
} from '../../utils/credits'
import { loadFlutterwave, makeTxRef } from '../../utils/flutterwave'
import { PAYMENT_COUNTRIES, type PaymentCountry, type PaymentMethod } from '../../data/paymentCountries'
import { BankTransferCheckout } from './BankTransferCheckout'
import { X, Check, ChevronRight, Zap, Loader2, AlertCircle, ArrowLeft, Tag } from 'lucide-react'

/* ------------------------------------------------------- */
/*  Countries come from src/data/paymentCountries.ts       */
/*  NG → Paystack (NGN). All others → FlutterWave.         */
/* ------------------------------------------------------- */

/* ------------------------------------------------------- */
/*  Coupon codes                                           */
/* ------------------------------------------------------- */

const COUPONS: Record<string, { discount: number; label: string; newUsersOnly?: boolean }> = {
  'new2026set': { discount: 0.75, label: '75% off — new2026set', newUsersOnly: true },
}

/* ------------------------------------------------------- */
/*  Component                                              */
/* ------------------------------------------------------- */

interface CreditTopUpProps {
  open: boolean
  onClose: () => void
  reason?: string
}

export function CreditTopUp({ open, onClose, reason }: CreditTopUpProps) {
  const user = useAuthStore(s => s.user)
  const balance = useCreditStore(s => s.balance)
  const transactions = useCreditStore(s => s.transactions)
  const syncWithServer = useCreditStore(s => s.syncWithServer)

  const isFirst = !transactions.some(t => t.status === 'completed')

  /* steps: plan → country → payment */
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<PaymentCountry | null>(null)
  const [rates, setRates] = useState<Record<string, number>>({})
  const [ratesLoading, setRatesLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  /* coupon */
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ discount: number; label: string } | null>(null)
  const [couponError, setCouponError] = useState('')

  const paystackRef = useRef<PaystackPop | null>(null)
  const processingRef = useRef(false)

  /* branded bank-transfer checkout state */
  const [bankTransferOpen, setBankTransferOpen] = useState(false)
  const [bankTransferRef, setBankTransferRef] = useState('')

  /* derived: discount only via coupon */
  const effectiveDiscount = appliedCoupon?.discount ?? 0
  const hasDiscount = effectiveDiscount > 0

  /* fetch exchange rates on mount */
  useEffect(() => {
    if (!open) return
    setRatesLoading(true)
    fetchExchangeRates().then(r => { setRates(r); setRatesLoading(false) }).catch(() => setRatesLoading(false))
  }, [open])

  /* reset when opened */
  useEffect(() => {
    if (open) {
      setStep(0)
      setSelectedPlan(null)
      setSelectedCountry(null)
      setStatus('idle')
      setErrorMsg('')
      setCouponCode('')
      setAppliedCoupon(null)
      setCouponError('')
    }
  }, [open])

  /* apply coupon */
  const handleApplyCoupon = useCallback(() => {
    const code = couponCode.trim().toLowerCase()
    const coupon = COUPONS[code]
    if (!coupon) {
      setAppliedCoupon(null)
      setCouponError('Invalid coupon code')
      return
    }
    if (coupon.newUsersOnly && !isFirst) {
      setAppliedCoupon(null)
      setCouponError('This code is only valid for first-time buyers')
      return
    }
    setAppliedCoupon({ discount: coupon.discount, label: coupon.label })
    setCouponError('')
  }, [couponCode, isFirst])

  /* compute price in a given currency — provider decides the unit */
  const priceInCurrency = useCallback((plan: Plan, country: PaymentCountry): number => {
    const rate = rates[country.currency] || 1
    const usdCents = getPlanPrice(plan, isFirst)
    const discountedCents = hasDiscount ? Math.round(usdCents * (1 - effectiveDiscount)) : usdCents
    return country.provider === 'paystack'
      ? Math.round(paystackAmount(discountedCents, rate) / 100)
      : flutterwaveAmount(discountedCents, rate)
  }, [rates, isFirst, hasDiscount, effectiveDiscount])

  /* format price for display */
  const formatPrice = useCallback((plan: Plan, country: PaymentCountry): string => {
    return formatCurrency(priceInCurrency(plan, country), country.currency)
  }, [priceInCurrency])

  /* original (non-discounted) price */
  const originalPrice = useCallback((plan: Plan, country: PaymentCountry): string => {
    const rate = rates[country.currency] || 1
    const usdCents = getPlanPrice(plan, isFirst)
    return country.provider === 'paystack'
      ? formatCurrency(Math.round(paystackAmount(usdCents, rate) / 100), country.currency)
      : formatCurrency(flutterwaveAmount(usdCents, rate), country.currency)
  }, [rates, isFirst])

  /* step 0 — select plan */
  const handleSelectPlan = useCallback((plan: Plan) => {
    setSelectedPlan(plan)
    setStep(1)
  }, [])

  /* step 1 — select country */
  const handleSelectCountry = useCallback((country: PaymentCountry) => {
    setSelectedCountry(country)
    setStep(2)
  }, [])

  /* Paystack flow — NG only, amounts in kobo */
  const payWithPaystack = useCallback(async (method: PaymentMethod, amount: number, currency: string) => {
    const paystack = paystackRef.current ?? new PaystackPop()
    paystackRef.current = paystack

    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxx'

    await paystack.checkout({
      key: publicKey,
      email: user!.email!,
      amount,
      currency,
      channels: [method.key as 'card' | 'bank_transfer'],
      metadata: {
        plan_id: selectedPlan!.id,
        credits: selectedPlan!.credits,
        is_first_purchase: isFirst,
        coupon_code: appliedCoupon ? couponCode.trim().toLowerCase() : null,
        custom_fields: [
          { display_name: 'Plan', variable_name: 'plan_id', value: selectedPlan!.id },
          { display_name: 'Credits', variable_name: 'credits', value: String(selectedPlan!.credits) },
        ],
      },

      onSuccess: async (response: { reference: string }) => {
        if (!processingRef.current) return
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'paystack',
              reference: response.reference,
              userId: user!.id,
              planId: selectedPlan!.id,
              credits: selectedPlan!.credits,
              amount,
              currency,
            }),
          })

          const verifyData = await verifyRes.json()

          if (!verifyData.success) {
            throw new Error(verifyData.error || 'Verification failed')
          }

          await syncWithServer(user!.id)

          if (processingRef.current) setStatus('success')
        } catch (err) {
          setStatus('error')
          const msg = err instanceof Error ? err.message : 'Verification failed'
          setErrorMsg(msg + ' — Reference: ' + response.reference)
        } finally {
          processingRef.current = false
        }
      },

      onClose: () => {
        if (processingRef.current) {
          processingRef.current = false
          setStatus('idle')
        }
      },

      onError: (err: { message: string }) => {
        if (processingRef.current) {
          processingRef.current = false
          setStatus('error')
          const msg = err.message || 'Transaction could not be loaded.'
          /* Surface the exact Paystack error and add an actionable hint when the
             account/channel configuration is the likely cause. */
          const channelHint = /no active channel|channel/i.test(msg)
            ? ' This usually means the payment channel is not enabled on your Paystack account — check the Paystack dashboard (Settings → Payment Channels) and enable Card.'
            : ''
          setErrorMsg(msg + channelHint)
        }
      },

      onCancel: () => {
        processingRef.current = false
        setStatus('idle')
      },
    })
  }, [user, selectedPlan, isFirst, appliedCoupon, couponCode, syncWithServer])

  /* FlutterWave flow — all non-NG countries, amounts in main units */
  const payWithFlutterwave = useCallback(async (method: PaymentMethod, amount: number, currency: string) => {
    const txRef = makeTxRef()

    const openCheckout = await loadFlutterwave()

    const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxx-X'

    openCheckout({
      public_key: publicKey,
      tx_ref: txRef,
      amount,
      currency,
      /* restrict the modal to the chosen method; enforce so the
         dashboard's payment-options override cannot widen it */
      payment_options: method.key,
      enforce_payment_options: true,
      customer: {
        email: user!.email!,
        name: (user!.user_metadata?.full_name as string) || (user!.user_metadata?.first_name as string) || undefined,
      },
      meta: {
        plan_id: selectedPlan!.id,
        credits: selectedPlan!.credits,
        is_first_purchase: isFirst,
        coupon_code: appliedCoupon ? couponCode.trim().toLowerCase() : null,
      },
      customizations: {
        title: 'Buy Credits',
        description: `${selectedPlan!.label} — ${selectedPlan!.credits.toLocaleString()} credits`,
      },

      callback: async (response: { transaction_id?: string | number; tx_ref?: string }) => {
        if (!processingRef.current) return
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'flutterwave',
              transactionId: response.transaction_id,
              txRef: response.tx_ref || txRef,
              userId: user!.id,
              planId: selectedPlan!.id,
              credits: selectedPlan!.credits,
              amount,
              currency,
            }),
          })

          const verifyData = await verifyRes.json()

          if (!verifyData.success) {
            throw new Error(verifyData.error || 'Verification failed')
          }

          await syncWithServer(user!.id)

          if (processingRef.current) setStatus('success')
        } catch (err) {
          setStatus('error')
          const msg = err instanceof Error ? err.message : 'Verification failed'
          setErrorMsg(`${msg} — Reference: ${response.transaction_id ?? txRef}`)
        } finally {
          processingRef.current = false
        }
      },

      onclose: () => {
        /* fires after callback too — only reset when still mid-processing */
        if (processingRef.current) {
          processingRef.current = false
          setStatus('idle')
        }
      },
    })
  }, [user, selectedPlan, isFirst, appliedCoupon, couponCode, syncWithServer])

  /* step 2 — pay (branch by provider) */
  const handlePayment = useCallback(async (method: PaymentMethod) => {
    if (!selectedPlan || !selectedCountry || !user?.email) return

    const currency = selectedCountry.currency
    const rate = rates[currency] || 1
    const usdCents = getPlanPrice(selectedPlan, isFirst)
    const discountedCents = hasDiscount ? Math.round(usdCents * (1 - effectiveDiscount)) : usdCents
    const amount = selectedCountry.provider === 'paystack'
      ? paystackAmount(discountedCents, rate)
      : flutterwaveAmount(discountedCents, rate)

    /* Branded Paystack Bank Transfer checkout (NG only) */
    if (selectedCountry.provider === 'paystack' && method.key === 'bank_transfer') {
      setBankTransferRef(makeTxRef('ooguy'))
      setBankTransferOpen(true)
      return
    }

    setStatus('processing')
    setErrorMsg('')
    processingRef.current = true

    try {
      if (selectedCountry.provider === 'paystack') {
        await payWithPaystack(method, amount, currency)
      } else {
        await payWithFlutterwave(method, amount, currency)
      }
    } catch (err) {
      processingRef.current = false
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.')
    }
  }, [selectedPlan, selectedCountry, user, rates, isFirst, hasDiscount, effectiveDiscount, payWithPaystack, payWithFlutterwave])

  /* close on success after a moment */
  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(() => { onClose() }, 2000)
      return () => clearTimeout(t)
    }
  }, [status, onClose])

  if (!open) return null

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-n8n-dark-2 border border-n8n-dark-4 rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-n8n-dark-4">
          <div className="flex items-center gap-2.5">
            {step > 0 ? (
              <button
                onClick={() => setStep(s => (s - 1) as 0 | 1 | 2)}
                className="p-1 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <Zap size={20} className="text-n8n-orange" />
            )}
            <span className="font-bold text-white text-sm">
              {step === 0 ? 'Buy Credits' : step === 1 ? 'Select Country' : 'Payment'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* reason banner */}
          {reason && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-n8n-orange/10 border border-n8n-orange/20 text-sm text-n8n-orange">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{reason}</span>
            </div>
          )}

          {/* current balance */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-n8n-gray-light">Current balance</span>
            <span className="font-semibold text-white tabular-nums">{balance.toLocaleString()} credits</span>
          </div>

          {/* progress dots */}
          {step > 0 && (
            <div className="flex items-center gap-2">
              {[0, 1, 2].map(i => (
                <div key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${step >= i ? 'bg-n8n-orange' : 'bg-n8n-dark-4'}`} />
              ))}
            </div>
          )}

          {/* ──────── STEP 0: Choose Plan + Coupon ──────── */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">Choose your plan</h2>
                <p className="text-sm text-n8n-gray-light mt-1">
                  1 credit = 100 AI tokens. You're billed for the tokens you actually use.
                </p>
              </div>

              {/* coupon code — always visible */}
              <div className="p-3.5 rounded-xl bg-n8n-dark-3 border border-n8n-dark-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={14} className="text-n8n-orange" />
                  <span className="text-xs font-semibold text-white">Have a coupon?</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value); setCouponError(''); setAppliedCoupon(null) }}
                    placeholder="Enter coupon code"
                    className="input-field flex-1 text-xs border-2 border-red-500/70 bg-n8n-dark-2 placeholder:text-n8n-gray focus:border-red-400 focus:ring-1 focus:ring-red-400/50"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim()}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-400 mt-1.5">{couponError}</p>
                )}
                {appliedCoupon && (
                  <p className="text-xs text-green-400 mt-1.5">✓ {appliedCoupon.label}</p>
                )}
              </div>

              <div className="grid gap-3">
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-n8n-dark-3 border border-n8n-dark-4 hover:border-n8n-orange/50 hover:bg-n8n-dark-4 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-n8n-orange/10 flex items-center justify-center text-lg flex-shrink-0">
                      <Zap size={20} className="text-n8n-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{plan.label}</div>
                      <div className="text-xs text-n8n-gray">
                        {plan.credits.toLocaleString()} credits
                      </div>
                      <div className="text-[10px] text-n8n-orange/80 mt-0.5">
                        {planTokenLabel(plan.credits)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-white">
                        ${Math.round(plan.priceUsdCents / 100)}
                      </div>
                      {hasDiscount && (
                        <div className="text-xs text-green-400 font-medium">
                          {Math.round(effectiveDiscount * 100)}% off
                        </div>
                      )}
                    </div>
                    <ChevronRight size={18} className="text-n8n-gray-light group-hover:text-n8n-orange transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ──────── STEP 1: Select Country ──────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Select your country</h2>
                  <p className="text-sm text-n8n-gray-light mt-1">Nigeria pays in Naira via Paystack; other countries pay via FlutterWave.</p>
                </div>
                {ratesLoading && <Loader2 size={16} className="animate-spin text-n8n-gray-light" />}
              </div>

              <div className="grid grid-cols-1 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
                {PAYMENT_COUNTRIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => handleSelectCountry(c)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-n8n-dark-3 border border-n8n-dark-4 hover:border-n8n-orange/50 hover:bg-n8n-dark-4 transition-all text-left group"
                  >
                    <span className="text-2xl">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{c.name}</div>
                      <div className="text-xs text-n8n-gray">{c.code} · Pay in {c.currency}</div>
                    </div>
                    <ChevronRight size={16} className="text-n8n-gray-light group-hover:text-n8n-orange transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ──────── STEP 2: Payment Method ──────── */}
          {step === 2 && selectedPlan && selectedCountry && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-3xl block mb-2">{selectedCountry.flag}</span>
                <h2 className="text-lg font-bold text-white">{selectedPlan.label}</h2>
                <p className="text-sm text-n8n-gray-light mt-1">
                  {selectedPlan.credits.toLocaleString()} credits
                  <span className="text-n8n-orange/80 mx-1.5">·</span>
                  <span className="text-n8n-orange font-medium">{planTokenLabel(selectedPlan.credits)}</span>
                  {' '}for{' '}
                  <span className={`font-semibold ${hasDiscount ? 'text-green-400' : 'text-n8n-orange'}`}>
                    {formatPrice(selectedPlan, selectedCountry)}
                  </span>
                  {hasDiscount && (
                    <span className="text-n8n-gray line-through ml-2">
                      {originalPrice(selectedPlan, selectedCountry)}
                    </span>
                  )}
                </p>
                {hasDiscount && (
                  <p className="text-xs text-green-400 mt-1">
                    {appliedCoupon?.label} applied
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                {selectedCountry.methods.map(method => (
                  <button
                    key={method.key}
                    onClick={() => handlePayment(method)}
                    disabled={status === 'processing'}
                    className="flex items-center gap-4 px-5 py-4 rounded-xl bg-n8n-dark-3 border-2 border-red-500/70 hover:border-red-400 hover:bg-n8n-dark-4 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed group"
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white group-hover:text-n8n-orange transition-colors">
                        {method.label}
                      </div>
                      <div className="text-xs text-n8n-gray mt-0.5">{method.description}</div>
                    </div>
                    {status === 'processing' ? (
                      <Loader2 size={20} className="animate-spin text-n8n-orange" />
                    ) : (
                      <ChevronRight size={18} className="text-n8n-gray-light group-hover:text-n8n-orange transition-colors" />
                    )}
                  </button>
                ))}
              </div>

              {/* success */}
              {status === 'success' && (
                <div className="p-4 rounded-xl bg-green-900/20 border border-green-700/30 text-center">
                  <Check size={24} className="mx-auto mb-2 text-green-400" />
                  <p className="text-sm text-green-400 font-medium">Payment successful!</p>
                  <p className="text-xs text-n8n-gray-light mt-1">
                    {selectedPlan.credits.toLocaleString()} credits ({planTokenLabel(selectedPlan.credits)}) added to your account.
                  </p>
                </div>
              )}

              {/* error */}
              {status === 'error' && (
                <div className="p-4 rounded-xl bg-red-900/20 border border-red-700/30">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-red-400 font-medium">Payment failed</p>
                      <p className="text-xs text-n8n-gray-light mt-1">{errorMsg}</p>
                      <button onClick={() => setStatus('idle')} className="text-xs text-n8n-orange hover:underline mt-2 inline-block">
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Branded Paystack Bank Transfer checkout */}
    {selectedPlan && selectedCountry && user && (
      <BankTransferCheckout
        open={bankTransferOpen}
        onClose={() => setBankTransferOpen(false)}
        onBack={() => setBankTransferOpen(false)}
        email={user.email!}
        amount={selectedCountry.provider === 'paystack'
          ? paystackAmount(hasDiscount ? Math.round(getPlanPrice(selectedPlan, isFirst) * (1 - effectiveDiscount)) : getPlanPrice(selectedPlan, isFirst), rates[selectedCountry.currency] || 1)
          : 0}
        currency={selectedCountry.currency}
        reference={bankTransferRef}
        planId={selectedPlan.id}
        credits={selectedPlan.credits}
        userId={user.id}
        onSuccess={() => {
          setBankTransferOpen(false)
          syncWithServer(user.id).then(() => {
            setStatus('success')
          })
        }}
      />
    )}
    </>
  )
}
