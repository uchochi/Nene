/**
 * FlutterWave supported countries with their currencies and the payment
 * methods FlutterWave reserves for each country.
 *
 * Sources (developer.flutterwave.com):
 *  - Card payments: all countries below.
 *  - Pay With Bank Transfer (PWBT): NGN + GHS only.
 *  - USSD: NGN only.
 *  - Pay with Bank Account ("account"): NGN only.
 *  - OPay wallet: NGN only.
 *  - Mobile money: country-specific option keys
 *    (mobilemoneyghana, mobilemoneykenya, mobilemoneyrwanda,
 *     mobilemoneyuganda, mobilemoneyzambia).
 *
 * `paymentOptions` is the comma-joined string passed to the inline
 * checkout's `payment_options` config.
 */

export interface FlwPaymentMethod {
  /** FlutterWave payment_options key */
  option: string
  label: string
  description: string
  icon: string
}

export interface FlwCountry {
  code: string
  name: string
  currency: string
  flag: string
  /** Comma-joined payment_options string for the checkout call */
  paymentOptions: string
  /** Human-readable methods rendered as UI buttons */
  methods: FlwPaymentMethod[]
}

/* ── Reusable method definitions ── */

const CARD: FlwPaymentMethod = {
  option: 'card',
  label: 'Pay with Card',
  description: 'Visa, Mastercard, Verve',
  icon: '💳',
}

const BANK_TRANSFER: FlwPaymentMethod = {
  option: 'banktransfer',
  label: 'Pay with Bank Transfer',
  description: 'Transfer to a virtual account — instant confirmation',
  icon: '🏦',
}

const USSD: FlwPaymentMethod = {
  option: 'ussd',
  label: 'Pay with USSD',
  description: 'Dial a code from your phone — no internet needed',
  icon: '📱',
}

const BANK_ACCOUNT_NG: FlwPaymentMethod = {
  option: 'account',
  label: 'Pay with Bank Account',
  description: 'Debit your Nigerian bank account directly',
  icon: '🏛️',
}

const OPAY: FlwPaymentMethod = {
  option: 'opay',
  label: 'Pay with OPay',
  description: 'Authorize from your OPay wallet',
  icon: '👛',
}

const MOMO_GH: FlwPaymentMethod = {
  option: 'mobilemoneyghana',
  label: 'Pay with Mobile Money',
  description: 'MTN, Telecel, AirtelTigo',
  icon: '📲',
}

const MOMO_KE: FlwPaymentMethod = {
  option: 'mobilemoneykenya',
  label: 'Pay with M-Pesa',
  description: 'Kenya mobile money',
  icon: '📲',
}

const MOMO_RW: FlwPaymentMethod = {
  option: 'mobilemoneyrwanda',
  label: 'Pay with Mobile Money',
  description: 'MTN, Airtel Rwanda',
  icon: '📲',
}

const MOMO_UG: FlwPaymentMethod = {
  option: 'mobilemoneyuganda',
  label: 'Pay with Mobile Money',
  description: 'MTN, Airtel Uganda',
  icon: '📲',
}

const MOMO_ZM: FlwPaymentMethod = {
  option: 'mobilemoneyzambia',
  label: 'Pay with Mobile Money',
  description: 'MTN, Airtel Zambia',
  icon: '📲',
}

function country(
  code: string,
  name: string,
  currency: string,
  flag: string,
  methods: FlwPaymentMethod[],
): FlwCountry {
  return {
    code,
    name,
    currency,
    flag,
    paymentOptions: methods.map(m => m.option).join(','),
    methods,
  }
}

/* ── FlutterWave-supported countries ── */

export const FLW_COUNTRIES: FlwCountry[] = [
  /* Africa — full local payment methods */
  country('NG', 'Nigeria', 'NGN', '🇳🇬', [CARD, BANK_TRANSFER, USSD, BANK_ACCOUNT_NG, OPAY]),
  country('GH', 'Ghana', 'GHS', '🇬🇭', [CARD, MOMO_GH, BANK_TRANSFER]),
  country('KE', 'Kenya', 'KES', '🇰🇪', [CARD, MOMO_KE]),
  country('ZA', 'South Africa', 'ZAR', '🇿🇦', [CARD]),
  country('UG', 'Uganda', 'UGX', '🇺🇬', [CARD, MOMO_UG]),
  country('TZ', 'Tanzania', 'TZS', '🇹🇿', [CARD]),
  country('RW', 'Rwanda', 'RWF', '🇷🇼', [CARD, MOMO_RW]),
  country('ZM', 'Zambia', 'ZMW', '🇿🇲', [CARD, MOMO_ZM]),
  country('ET', 'Ethiopia', 'ETB', '🇪🇹', [CARD]),
  country('EG', 'Egypt', 'EGP', '🇪🇬', [CARD]),
  country('MA', 'Morocco', 'MAD', '🇲🇦', [CARD]),
  country('TN', 'Tunisia', 'TND', '🇹🇳', [CARD]),
  country('CM', 'Cameroon', 'XAF', '🇨🇲', [CARD]),
  country('SN', 'Senegal', 'XOF', '🇸🇳', [CARD]),
  country('CI', 'Côte d’Ivoire', 'XOF', '🇨🇮', [CARD]),
  country('ML', 'Mali', 'XOF', '🇲🇱', [CARD]),
  country('BF', 'Burkina Faso', 'XOF', '🇧🇫', [CARD]),
  country('BJ', 'Benin', 'XOF', '🇧🇯', [CARD]),
  country('TG', 'Togo', 'XOF', '🇹🇬', [CARD]),
  country('NE', 'Niger', 'XOF', '🇳🇪', [CARD]),
  country('GN', 'Guinea', 'GNF', '🇬🇳', [CARD]),
  country('GM', 'Gambia', 'GMD', '🇬🇲', [CARD]),
  country('SL', 'Sierra Leone', 'SLE', '🇸🇱', [CARD]),
  country('LR', 'Liberia', 'LRD', '🇱🇷', [CARD]),

  /* International — card payments */
  country('US', 'United States', 'USD', '🇺🇸', [CARD]),
  country('GB', 'United Kingdom', 'GBP', '🇬🇧', [CARD]),
  country('FR', 'France', 'EUR', '🇫🇷', [CARD]),
  country('DE', 'Germany', 'EUR', '🇩🇪', [CARD]),
  country('IT', 'Italy', 'EUR', '🇮🇹', [CARD]),
  country('ES', 'Spain', 'EUR', '🇪🇸', [CARD]),
  country('NL', 'Netherlands', 'EUR', '🇳🇱', [CARD]),
  country('CA', 'Canada', 'CAD', '🇨🇦', [CARD]),
  country('MX', 'Mexico', 'MXN', '🇲🇽', [CARD]),
  country('BR', 'Brazil', 'BRL', '🇧🇷', [CARD]),
  country('IN', 'India', 'INR', '🇮🇳', [CARD]),
  country('JP', 'Japan', 'JPY', '🇯🇵', [CARD]),
  country('KR', 'South Korea', 'KRW', '🇰🇷', [CARD]),
  country('SG', 'Singapore', 'SGD', '🇸🇬', [CARD]),
  country('AE', 'United Arab Emirates', 'AED', '🇦🇪', [CARD]),
  country('CN', 'China', 'CNY', '🇨🇳', [CARD]),
]

/** Finds a country by its ISO code. */
export function getFlwCountry(code: string): FlwCountry | undefined {
  return FLW_COUNTRIES.find(c => c.code === code)
}

/** All currencies in the list (for exchange-rate coverage checks). */
export function getFlwCurrencies(): string[] {
  return [...new Set(FLW_COUNTRIES.map(c => c.currency))]
}
