/* ------------------------------------------------------------------ */
/*  Credit System — pricing, discount, exchange rates, calculations    */
/*  10,000 credits = 1M tokens (1 credit = 100 tokens)                 */
/* ------------------------------------------------------------------ */

export interface Plan {
  id: string
  credits: number
  label: string
  priceUsdCents: number
}

/* Token ↔ credit conversion constants */
export const TOKENS_PER_CREDIT = 100
export const CREDITS_PER_MILLION_TOKENS = 10000

export const PLANS: Plan[] = [
  { id: '10000', credits: 10000, label: 'Starter',  priceUsdCents: 1000 },  // 1M tokens, $10
  { id: '20000', credits: 20000, label: 'Pro',      priceUsdCents: 2000 },  // 2M tokens, $20
  { id: '40000', credits: 40000, label: 'Business', priceUsdCents: 4000 },  // 4M tokens, $40
]

/* first-time buyers get 75 % off */
export const FIRST_TIME_DISCOUNT = 0.75  // 75 %

/* ── Token conversion helpers ── */

export function tokensToCredits(tokens: number): number {
  return Math.ceil(tokens / TOKENS_PER_CREDIT)
}

export function creditsToTokens(credits: number): number {
  return credits * TOKENS_PER_CREDIT
}

/** Format token counts compactly: 1.2M, 350K, 800 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M tokens`
  }
  if (tokens >= 1_000) {
    const k = tokens / 1_000
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K tokens`
  }
  return `${tokens} tokens`
}

/** Shorthand token label for a plan (e.g. "1M tokens") */
export function planTokenLabel(credits: number): string {
  return formatTokens(creditsToTokens(credits))
}

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

/* Fallback estimate: a typical workflow run uses ~2000 tokens (20 credits).
   Used for pre-run balance checks when actual token count is unknown. */
export const ESTIMATED_CREDITS_PER_RUN = 20
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
    BRL: 5.1,
    INR: 83, JPY: 150, KRW: 1320, SGD: 1.34, AED: 3.67, CNY: 7.24,
    /* FlutterWave African currencies */
    UGX: 3700, TZS: 2500, RWF: 1300, ZMW: 26, ETB: 120, TND: 3.1,
    XOF: 600, XAF: 600, GNF: 8600, GMD: 70, SLE: 22, LRD: 190,
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

/**
 * FlutterWave amount in the currency's MAIN unit (e.g. ₦2,500 → 2500).
 * No ×100 subunit conversion — divide USD cents by 100, convert,
 * and round to a whole number.
 */
export function flutterwaveAmount(usdCents: number, rate: number): number {
  const usdMain = usdCents / 100
  return Math.round(usdMain * rate)
}
