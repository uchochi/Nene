/* ------------------------------------------------------------------ */
/*  Credit System — pricing, discount, exchange rates, calculations    */
/* ------------------------------------------------------------------ */

export interface Plan {
  id: string
  credits: number
  label: string
  priceUsdCents: number
}

export const PLANS: Plan[] = [
  { id: '1250', credits: 1250, label: 'Starter',  priceUsdCents: 1000 },  // $10
  { id: '2500', credits: 2500, label: 'Pro',      priceUsdCents: 2000 },  // $20
  { id: '5000', credits: 5000, label: 'Business', priceUsdCents: 4000 },  // $40
]

/* first-time buyers get 75 % off */
export const FIRST_TIME_DISCOUNT = 0.75  // 75 %

export function getPlanPrice(plan: Plan, isFirstPurchase: boolean): number {
  if (isFirstPurchase) {
    return plan.priceUsdCents * (1 - FIRST_TIME_DISCOUNT)  // 25 % of base
  }
  return plan.priceUsdCents
}

export function getCreditCost(credits: number, isFirstPurchase: boolean): number {
  /* cost for a custom amount of credits at the same rate */
  const basePlan = PLANS[0]
  const perCreditUsd = basePlan.priceUsdCents / basePlan.credits
  const raw = credits * perCreditUsd
  if (isFirstPurchase) return Math.round(raw * (1 - FIRST_TIME_DISCOUNT))
  return Math.round(raw)
}

/* how many runs can the user afford ? */
export function runsRemaining(balance: number): number {
  return Math.max(0, balance)
}

/* cost per single run in credits */
export const COST_PER_RUN = 1
export const COST_PER_EXPORT = 1

/* ------------------------------------------------------- */
/*  Exchange Rate API ( live rates from open exchange API ) */
/* ------------------------------------------------------- */

interface RatesCache {
  rates: Record<string, number>
  timestamp: number
}

let ratesCache: RatesCache | null = null
const CACHE_TTL = 30 * 60 * 1000  // 30 minutes

export async function fetchExchangeRates(): Promise<Record<string, number>> {
  if (ratesCache && Date.now() - ratesCache.timestamp < CACHE_TTL) {
    return ratesCache.rates
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) throw new Error('Failed to fetch rates')
    const data = await res.json()
    if (data.result !== 'success') throw new Error('API returned error')

    ratesCache = { rates: data.rates, timestamp: Date.now() }
    return data.rates
  } catch {
    /* fallback static rates */
    return fallbackRates()
  }
}

function fallbackRates(): Record<string, number> {
  return {
    USD: 1, NGN: 1540, ZAR: 18.2, KES: 145, EGP: 48, GHS: 14.5, MAD: 10,
    GBP: 0.79, EUR: 0.92,
    CAD: 1.36, MXN: 17.5,
    BRL: 5.1, ARS: 870, COP: 4000,
    INR: 83, JPY: 150, KRW: 1320, SGD: 1.34, AED: 3.67, CNY: 7.24,
  }
}

export function convertUsdCents(usdCents: number, rate: number): number {
  return Math.round(usdCents * rate)
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

export function paystackAmount(usdCents: number, rate: number): number {
  /* Paystack requires amounts in the lowest currency unit (cents, kobo, etc.) */
  return convertUsdCents(usdCents, rate)
}
