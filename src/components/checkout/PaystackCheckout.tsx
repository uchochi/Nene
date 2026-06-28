import { useState, useCallback, useRef } from 'react'
import PaystackPop from '@paystack/inline-js'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CheckoutConfig {
  publicKey: string
  email: string
  amount: number
  currency: string
  firstName?: string
  lastName?: string
  phone?: string
  metadata?: Record<string, unknown>
}

interface Country {
  code: string
  name: string
  currency: string
  flag: string
}

type PaymentChannel = 'card' | 'bank_transfer'
type Step = 1 | 2
type Status = 'idle' | 'processing' | 'success' | 'error'

interface PaymentOption {
  channel: PaymentChannel
  label: string
  description: string
  icon: string
}

/* ------------------------------------------------------------------ */
/*  Countries — major markets from each continent                      */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Payment options per country                                        */
/* ------------------------------------------------------------------ */

function getPaymentOptions(countryCode: string): PaymentOption[] {
  if (countryCode === 'NG') {
    return [
      {
        channel: 'card',
        label: 'Pay with Credit/Debit Card',
        description: 'Visa, Mastercard, Verve',
        icon: '💳',
      },
      {
        channel: 'bank_transfer',
        label: 'Pay with Bank Transfer (PwT)',
        description: 'Pay with Transfer — instant confirmation',
        icon: '🏦',
      },
    ]
  }
  return [
    {
      channel: 'card',
      label: 'Pay with Credit/Debit Card',
      description: 'Visa, Mastercard, American Express',
      icon: '💳',
    },
  ]
}

/* ------------------------------------------------------------------ */
/*  Backend-verification mock                                          */
/* ------------------------------------------------------------------ */

async function verifyOnBackend(reference: string): Promise<void> {
  const response = await fetch('/api/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference }),
  })
  if (!response.ok) {
    throw new Error('Backend verification failed')
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface PaystackCheckoutProps {
  config: CheckoutConfig
  /** Override the default backend verification call */
  onSuccess?: (reference: string) => Promise<void> | void
  /** Called when the user closes the Paystack iframe without completing */
  onClose?: () => void
}

export function PaystackCheckout({ config, onSuccess, onClose }: PaystackCheckoutProps) {
  const [step, setStep] = useState<Step>(1)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const paystackRef = useRef<PaystackPop | null>(null)
  const processingRef = useRef(false)

  /* Step 1 — Country selection */
  const handleCountrySelect = useCallback((country: Country) => {
    setSelectedCountry(country)
    setStep(2)
    setStatus('idle')
    setErrorMessage('')
  }, [])

  /* Step 2 — Launch Paystack checkout with a single channel */
  const handlePayment = useCallback(async (channel: PaymentChannel) => {
    if (!selectedCountry) return

    setStatus('processing')
    setErrorMessage('')
    processingRef.current = true

    const paystack = paystackRef.current ?? new PaystackPop()
    paystackRef.current = paystack

    try {
      await paystack.checkout({
        key: config.publicKey,
        email: config.email,
        amount: config.amount,
        currency: selectedCountry.currency,
        channels: [channel],
        firstName: config.firstName,
        lastName: config.lastName,
        phone: config.phone,
        metadata: config.metadata,

        onSuccess: async (response: { reference: string }) => {
          if (!processingRef.current) return
          try {
            await (onSuccess ?? verifyOnBackend)(response.reference)
            if (processingRef.current) {
              setStatus('success')
            }
          } catch {
            setStatus('error')
            setErrorMessage('Backend verification failed. Contact support.')
          } finally {
            processingRef.current = false
          }
        },

        onClose: () => {
          if (processingRef.current) {
            processingRef.current = false
            setStatus('idle')
          }
          onClose?.()
        },

        onError: (error: { message: string }) => {
          if (processingRef.current) {
            processingRef.current = false
            setStatus('error')
            setErrorMessage(error.message || 'Transaction could not be loaded.')
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
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      )
    }
  }, [selectedCountry, config, onSuccess, onClose])

  /* Reset to step 1 */
  const handleBack = useCallback(() => {
    setStep(1)
    setSelectedCountry(null)
    setStatus('idle')
    setErrorMessage('')
  }, [])

  /* ── Render ── */
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress stepper */}
      <div className="flex items-center gap-2 mb-6">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            step >= 1 ? 'bg-n8n-red text-white' : 'bg-n8n-dark-4 text-n8n-gray'
          }`}
        >
          1
        </div>
        <div className={`flex-1 h-0.5 transition-colors ${step >= 2 ? 'bg-n8n-red' : 'bg-n8n-dark-4'}`} />
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            step >= 2 ? 'bg-n8n-red text-white' : 'bg-n8n-dark-4 text-n8n-gray'
          }`}
        >
          2
        </div>
      </div>

      {/* ──────── Step 1: Country Selection ──────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">Select your country</h2>
            <p className="text-sm text-n8n-gray-light mt-1">
              Payment methods are tailored to your region
            </p>
          </div>

          {/* Quick-search input */}
          <div className="relative">
            <input
              className="input-field pl-10"
              placeholder="Search countries..."
              onChange={e => {
                const q = e.target.value.toLowerCase()
                const match = countries.find(
                  c =>
                    c.name.toLowerCase().startsWith(q) ||
                    c.code.toLowerCase() === q,
                )
                if (match) handleCountrySelect(match)
              }}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-n8n-gray-light">
              🔍
            </span>
          </div>

          {/* Country grid */}
          <div className="grid grid-cols-1 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
            {countries.map(country => (
              <button
                key={country.code}
                onClick={() => handleCountrySelect(country)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-n8n-dark-3 border border-n8n-dark-4 hover:border-n8n-orange/50 hover:bg-n8n-dark-4 transition-all text-left group"
              >
                <span className="text-2xl">{country.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {country.name}
                  </div>
                  <div className="text-xs text-n8n-gray">
                    {country.code} · {country.currency}
                  </div>
                </div>
                <span className="text-n8n-gray-light opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ──────── Step 2: Payment Method ──────── */}
      {step === 2 && selectedCountry && (
        <div className="space-y-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-n8n-gray-light hover:text-white transition-colors"
          >
            ← Back to countries
          </button>

          <div className="text-center">
            <span className="text-3xl block mb-2">{selectedCountry.flag}</span>
            <h2 className="text-xl font-bold text-white">{selectedCountry.name}</h2>
            <p className="text-sm text-n8n-gray-light mt-1">
              {selectedCountry.currency} {config.amount.toLocaleString()} · Choose a method
            </p>
          </div>

          {/* Payment-option buttons */}
          <div className="grid grid-cols-1 gap-3">
            {getPaymentOptions(selectedCountry.code).map(option => (
              <button
                key={option.channel}
                onClick={() => handlePayment(option.channel)}
                disabled={status === 'processing'}
                className="flex items-center gap-4 px-5 py-4 rounded-xl bg-n8n-dark-3 border border-n8n-dark-4 hover:border-n8n-orange hover:bg-n8n-dark-4 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="text-2xl">{option.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white group-hover:text-n8n-orange transition-colors">
                    {option.label}
                  </div>
                  <div className="text-xs text-n8n-gray mt-0.5">
                    {option.description}
                  </div>
                </div>
                {status === 'processing' ? (
                  <div className="w-5 h-5 border-2 border-n8n-orange border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-n8n-gray-light group-hover:text-n8n-orange transition-colors">→</span>
                )}
              </button>
            ))}
          </div>

          {/* Success feedback */}
          {status === 'success' && (
            <div className="p-4 rounded-xl bg-green-900/20 border border-green-700/30 text-center">
              <span className="text-2xl block mb-1">✅</span>
              <p className="text-sm text-green-400 font-medium">
                Payment successful! Verifying with server...
              </p>
            </div>
          )}

          {/* Error feedback */}
          {status === 'error' && (
            <div className="p-4 rounded-xl bg-red-900/20 border border-red-700/30">
              <div className="flex items-start gap-2">
                <span className="text-lg">❌</span>
                <div>
                  <p className="text-sm text-red-400 font-medium">Payment failed</p>
                  <p className="text-xs text-n8n-gray-light mt-0.5">{errorMessage}</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-xs text-n8n-orange hover:underline mt-2 inline-block"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
