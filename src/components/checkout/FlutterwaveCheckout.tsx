import { useState, useCallback } from 'react'
import { loadFlutterwave, makeTxRef } from '../../utils/flutterwave'
import { FLW_COUNTRIES, type FlwCountry, type FlwPaymentMethod } from '../../data/flutterwaveCountries'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CheckoutConfig {
  publicKey: string
  email: string
  /** Amount in the currency's MAIN unit (no kobo/cents) */
  amount: number
  firstName?: string
  lastName?: string
  phone?: string
  metadata?: Record<string, unknown>
}

type Status = 'idle' | 'processing' | 'success' | 'error'

/* ------------------------------------------------------------------ */
/*  Default backend verification                                       */
/* ------------------------------------------------------------------ */

async function verifyOnBackend(data: { transaction_id?: string | number; tx_ref?: string }): Promise<void> {
  const response = await fetch('/api/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionId: data.transaction_id,
      txRef: data.tx_ref,
    }),
  })
  if (!response.ok) {
    throw new Error('Backend verification failed')
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface FlutterwaveCheckoutProps {
  config: CheckoutConfig
  /** Override the default backend verification call */
  onSuccess?: (data: { transaction_id?: string | number; tx_ref?: string }) => Promise<void> | void
  /** Called when the user closes the FlutterWave modal without completing */
  onClose?: () => void
}

export function FlutterwaveCheckout({ config, onSuccess, onClose }: FlutterwaveCheckoutProps) {
  const [selectedCountry, setSelectedCountry] = useState<FlwCountry | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  /* Step 1 — Country selection */
  const handleCountrySelect = useCallback((country: FlwCountry) => {
    setSelectedCountry(country)
    setStatus('idle')
    setErrorMessage('')
  }, [])

  /* Step 2 — Launch FlutterWave checkout with the country's payment methods */
  const handlePayment = useCallback(async (country: FlwCountry, method: FlwPaymentMethod) => {
    setStatus('processing')
    setErrorMessage('')

    try {
      const openCheckout = await loadFlutterwave()

      openCheckout({
        public_key: config.publicKey,
        tx_ref: makeTxRef(),
        amount: config.amount,
        currency: country.currency,
        payment_options: method.option,
        customer: {
          email: config.email,
          phone_number: config.phone,
          name: [config.firstName, config.lastName].filter(Boolean).join(' ') || undefined,
        },
        meta: config.metadata as FlutterwaveMeta | undefined,
        customizations: {
          title: 'Buy Credits',
          description: `${country.currency} ${config.amount.toLocaleString()}`,
        },

        callback: async data => {
          try {
            await (onSuccess ?? verifyOnBackend)(data)
            setStatus('success')
          } catch {
            setStatus('error')
            setErrorMessage('Backend verification failed. Contact support.')
          }
        },

        onclose: () => {
          /* FlutterWave calls onclose after callback too — only reset if still processing */
          setStatus(s => (s === 'processing' ? 'idle' : s))
          onClose?.()
        },
      })
    } catch (err) {
      setStatus('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      )
    }
  }, [config, onSuccess, onClose])

  /* ── Render ── */
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress stepper */}
      <div className="flex items-center gap-2 mb-6">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            selectedCountry ? 'bg-n8n-red text-white' : 'bg-n8n-dark-4 text-n8n-gray'
          }`}
        >
          1
        </div>
        <div className={`flex-1 h-0.5 transition-colors ${selectedCountry ? 'bg-n8n-red' : 'bg-n8n-dark-4'}`} />
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            selectedCountry ? 'bg-n8n-red text-white' : 'bg-n8n-dark-4 text-n8n-gray'
          }`}
        >
          2
        </div>
      </div>

      {/* ──────── Step 1: Country Selection ──────── */}
      {!selectedCountry && (
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
              className="input-field pl-10 border-2 border-red-500/70 focus:border-red-400 focus:ring-1 focus:ring-red-400/50"
              placeholder="Search countries..."
              onChange={e => {
                const q = e.target.value.toLowerCase()
                const match = FLW_COUNTRIES.find(
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
            {FLW_COUNTRIES.map(country => (
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
                    {country.code} · Pay in {country.currency}
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
      {selectedCountry && (
        <div className="space-y-6">
          <button
            onClick={() => { setSelectedCountry(null); setStatus('idle') }}
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

          {/* Payment-method buttons — one per FlutterWave-reserved method */}
          <div className="grid grid-cols-1 gap-3">
            {selectedCountry.methods.map(method => (
              <button
                key={method.option}
                onClick={() => handlePayment(selectedCountry, method)}
                disabled={status === 'processing'}
                className="flex items-center gap-4 px-5 py-4 rounded-xl bg-n8n-dark-3 border-2 border-red-500/70 hover:border-red-400 hover:bg-n8n-dark-4 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="text-2xl">{method.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white group-hover:text-n8n-orange transition-colors">
                    {method.label}
                  </div>
                  <div className="text-xs text-n8n-gray mt-0.5">
                    {method.description}
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
