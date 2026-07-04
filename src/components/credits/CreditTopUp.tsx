import { useState, useCallback, useRef, useEffect } from 'react'
import PaystackPop from '@paystack/inline-js'
import { useCreditStore } from '../../store/creditStore'
import { useAuthStore } from '../../store/authStore'
import {
  PLANS, getPlanPrice, fetchExchangeRates,
  paystackAmount, formatCurrency, type Plan,
} from '../../utils/credits'
import { X, Check, ChevronRight, Zap, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { CurrencySelector } from './CurrencySelector'

/* ------------------------------------------------------- */
/*  Countries                                              */
/* ------------------------------------------------------- */

interface Country {
  code: string
  name: string
  currency: string
  flag: string
}

const countries: Country[] = [
  { code: 'NG', name: 'Nigeria',               currency: 'NGN', flag: '🇳🇬' },
  { code: 'ZA', name: 'South Africa',          currency: 'ZAR', flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya',                 currency: 'KES', flag: '🇰🇪' },
  { code: 'EG', name: 'Egypt',                 currency: 'EGP', flag: '🇪🇬' },
  { code: 'GH', name: 'Ghana',                 currency: 'GHS', flag: '🇬🇭' },
  { code: 'MA', name: 'Morocco',               currency: 'MAD', flag: '🇲🇦' },
  { code: 'GB', name: 'United Kingdom',        currency: 'GBP', flag: '🇬🇧' },
  { code: 'FR', name: 'France',                currency: 'EUR', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany',               currency: 'EUR', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy',                 currency: 'EUR', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain',                 currency: 'EUR', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands',           currency: 'EUR', flag: '🇳🇱' },
  { code: 'US', name: 'United States',         currency: 'USD', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada',                currency: 'CAD', flag: '🇨🇦' },
  { code: 'MX', name: 'Mexico',                currency: 'MXN', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil',                currency: 'BRL', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina',             currency: 'ARS', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia',              currency: 'COP', flag: '🇨🇴' },
  { code: 'IN', name: 'India',                 currency: 'INR', flag: '🇮🇳' },
  { code: 'JP', name: 'Japan',                 currency: 'JPY', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea',           currency: 'KRW', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore',             currency: 'SGD', flag: '🇸🇬' },
  { code: 'AE', name: 'United Arab Emirates',  currency: 'AED', flag: '🇦🇪' },
  { code: 'CN', name: 'China',                 currency: 'CNY', flag: '🇨🇳' },
]

type PaymentChannel = 'card' | 'bank_transfer'

function getPaymentOptions(countryCode: string) {
  const card = { channel: 'card' as const, label: 'Pay with Credit/Debit Card', description: 'Visa, Mastercard, Amex', icon: '💳' }
  if (countryCode === 'NG') {
    return [
      card,
      { channel: 'bank_transfer' as const, label: 'Pay with Bank Transfer (PwT)', description: 'Instant confirmation', icon: '🏦' },
    ]
  }
  return [card]
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
  const totalPurchased = useCreditStore(s => s.totalPurchased)
  const addCredits = useCreditStore(s => s.addCredits)

  const isFirst = totalPurchased === 0

  /* steps: plan → country → payment */
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [displayCurrency, setDisplayCurrency] = useState('USD')
  const [rates, setRates] = useState<Record<string, number>>({})
  const [ratesLoading, setRatesLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const paystackRef = useRef<PaystackPop | null>(null)
  const processingRef = useRef(false)

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
      setDisplayCurrency('USD')
      setStatus('idle')
      setErrorMsg('')
    }
  }, [open])

  /* step 0 — select plan */
  const handleSelectPlan = useCallback((plan: Plan) => {
    setSelectedPlan(plan)
    setStep(1)
  }, [])

  /* step 1 — select country (for payment) */
  const handleSelectCountry = useCallback((country: Country) => {
    setSelectedCountry(country)
    setDisplayCurrency(country.currency)
    setStep(2)
  }, [])

  /* step 2 — pay */
  const handlePayment = useCallback(async (channel: PaymentChannel) => {
    if (!selectedPlan || !selectedCountry || !user?.email) return

    const rate = rates[selectedCountry.currency] || 1
    const priceUsdCents = getPlanPrice(selectedPlan, isFirst)
    const amount = paystackAmount(priceUsdCents, rate)

    setStatus('processing')
    setErrorMsg('')
    processingRef.current = true

    const paystack = paystackRef.current ?? new PaystackPop()
    paystackRef.current = paystack

    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxx'

    try {
      await paystack.checkout({
        key: publicKey,
        email: user.email,
        amount,
        currency: selectedCountry.currency,
        channels: [channel],
        metadata: {
          plan_id: selectedPlan.id,
          credits: selectedPlan.credits,
          is_first_purchase: isFirst,
          custom_fields: [
            { display_name: 'Plan', variable_name: 'plan_id', value: selectedPlan.id },
            { display_name: 'Credits', variable_name: 'credits', value: String(selectedPlan.credits) },
          ],
        },

        onSuccess: async (response: { reference: string }) => {
          if (!processingRef.current) return
          try {
            await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference: response.reference }),
            })

            await addCredits(
              selectedPlan.id,
              selectedPlan.credits,
              amount,
              selectedCountry.currency,
              response.reference,
            )

            if (processingRef.current) setStatus('success')
          } catch {
            setStatus('error')
            setErrorMsg('Backend verification failed. Contact support — your reference: ' + response.reference)
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
            setErrorMsg(err.message || 'Transaction could not be loaded.')
          }
        },

        onCancel: () => {
          processingRef.current = false
          setStatus('idle')
        },
      })
    } catch (err) {
      processingRef.current = false
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.')
    }
  }, [selectedPlan, selectedCountry, user, rates, isFirst, addCredits])

  /* display price in the selected display currency */
  const displayPrice = useCallback((plan: Plan): string => {
    const rate = rates[displayCurrency] || 1
    const usdCents = getPlanPrice(plan, isFirst)
    const localCents = paystackAmount(usdCents, rate)
    return formatCurrency(Math.round(localCents / 100), displayCurrency)
  }, [rates, displayCurrency, isFirst])

  /* close on success after a moment */
  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(() => { onClose() }, 2000)
      return () => clearTimeout(t)
    }
  }, [status, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
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
          <div className="flex items-center gap-3">
            {step < 2 && (
              <CurrencySelector selected={displayCurrency} onChange={setDisplayCurrency} />
            )}
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-n8n-dark-4 text-n8n-gray-light hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
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

          {/* currency switcher instruction */}
          {step === 0 && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-n8n-orange/10 border border-n8n-orange/20 text-sm">
              <span className="text-n8n-orange font-semibold">💱 Switch price to your local currency</span>
              <span className="text-n8n-gray-light text-xs ml-auto">Use the currency selector above</span>
            </div>
          )}

          {/* progress dots */}
          {step > 0 && (
            <div className="flex items-center gap-2">
              {[0, 1, 2].map(i => (
                <div key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${step >= i ? 'bg-n8n-orange' : 'bg-n8n-dark-4'}`} />
              ))}
            </div>
          )}

          {/* ──────── STEP 0: Choose Plan ──────── */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">Choose your plan</h2>
                <p className="text-sm text-n8n-gray-light mt-1">Each credit equals one workflow run or export.</p>
              </div>

              {isFirst && (
                <div className="p-3.5 rounded-xl bg-green-900/20 border border-green-700/30">
                  <p className="text-sm text-green-400 font-medium">🎉 75% off — first-time buyer!</p>
                  <p className="text-xs text-n8n-gray-light mt-1">Discount applied to all plans below.</p>
                </div>
              )}

              <div className="grid gap-3">
                {PLANS.map(plan => {
                  const fullPriceUsd = formatCurrency(Math.round(plan.priceUsdCents / 100), 'USD')
                  return (
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
                        <div className="text-xs text-n8n-gray">{plan.credits.toLocaleString()} credits</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-white">{displayPrice(plan)}</div>
                        {isFirst && (
                          <div className="text-xs text-n8n-gray line-through">{fullPriceUsd}</div>
                        )}
                      </div>
                      <ChevronRight size={18} className="text-n8n-gray-light group-hover:text-n8n-orange transition-colors flex-shrink-0" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ──────── STEP 1: Select Country ──────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Select your country</h2>
                  <p className="text-sm text-n8n-gray-light mt-1">Choose your country for payment options.</p>
                </div>
                {ratesLoading && <Loader2 size={16} className="animate-spin text-n8n-gray-light" />}
              </div>

              <div className="grid grid-cols-1 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
                {countries.map(c => (
                  <button
                    key={c.code}
                    onClick={() => handleSelectCountry(c)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-n8n-dark-3 border border-n8n-dark-4 hover:border-n8n-orange/50 hover:bg-n8n-dark-4 transition-all text-left group"
                  >
                    <span className="text-2xl">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{c.name}</div>
                      <div className="text-xs text-n8n-gray">{c.code} · {c.currency}</div>
                    </div>
                    {selectedPlan && (
                      <div className="text-right text-sm font-semibold text-n8n-orange tabular-nums flex-shrink-0">
                        {(() => {
                          const rate = rates[displayCurrency] || 1
                          const usdCents = getPlanPrice(selectedPlan, isFirst)
                          const localCents = paystackAmount(usdCents, rate)
                          return formatCurrency(Math.round(localCents / 100), displayCurrency)
                        })()}
                      </div>
                    )}
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
                  {selectedPlan.credits.toLocaleString()} credits for
                  {' '}
                  <span className="text-n8n-orange font-semibold">
                    {(() => {
                      const rate = rates[selectedCountry.currency] || 1
                      const usdCents = getPlanPrice(selectedPlan, isFirst)
                      const localCents = paystackAmount(usdCents, rate)
                      return formatCurrency(Math.round(localCents / 100), selectedCountry.currency)
                    })()}
                  </span>
                  {isFirst && <span className="text-xs text-green-400 ml-2">75% off</span>}
                </p>
              </div>

              <div className="grid gap-3">
                {getPaymentOptions(selectedCountry.code).map(opt => (
                  <button
                    key={opt.channel}
                    onClick={() => handlePayment(opt.channel)}
                    disabled={status === 'processing'}
                    className="flex items-center gap-4 px-5 py-4 rounded-xl bg-n8n-dark-3 border border-n8n-dark-4 hover:border-n8n-orange hover:bg-n8n-dark-4 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed group"
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white group-hover:text-n8n-orange transition-colors">
                        {opt.label}
                      </div>
                      <div className="text-xs text-n8n-gray mt-0.5">{opt.description}</div>
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
                    {selectedPlan.credits.toLocaleString()} credits added to your account.
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
  )
}
