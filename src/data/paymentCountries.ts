/**
 * Payment countries — hybrid provider setup.
 *
 * Nigeria → Paystack (NG-registered merchant, NGN only).
 * All other countries → FlutterWave (multi-currency).
 *
 * Convention: every country is defined explicitly, one by one.
 * Method objects are intentionally NOT shared between countries.
 *
 * Amount units differ by provider:
 *   paystack    → subunits (kobo), see paystackAmount()
 *   flutterwave → main units, see flutterwaveAmount()
 */

export type PaymentProvider = 'paystack' | 'flutterwave'

export interface PaymentMethod {
  /** Paystack channel ('card' | 'bank_transfer') or FlutterWave payment_options key ('card') */
  key: string
  label: string
  description: string
  icon: string
}

export interface PaymentCountry {
  code: string
  name: string
  currency: string
  flag: string
  provider: PaymentProvider
  methods: PaymentMethod[]
}

export const PAYMENT_COUNTRIES: PaymentCountry[] = [
  /* ═══════════ Nigeria — Paystack, NGN ═══════════ */
  {
    code: 'NG',
    name: 'Nigeria',
    currency: 'NGN',
    flag: '🇳🇬',
    provider: 'paystack',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard, Verve',
        icon: '💳',
      },
      {
        key: 'bank_transfer',
        label: 'Pay with Bank Transfer',
        description: 'Instant confirmation',
        icon: '🏦',
      },
    ],
  },

  /* ═══════════ FlutterWave — African, local currencies ═══════════ */

  {
    code: 'GH',
    name: 'Ghana',
    currency: 'GHS',
    flag: '🇬🇭',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'KE',
    name: 'Kenya',
    currency: 'KES',
    flag: '🇰🇪',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'ZA',
    name: 'South Africa',
    currency: 'ZAR',
    flag: '🇿🇦',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard, Amex',
        icon: '💳',
      },
    ],
  },
  {
    code: 'UG',
    name: 'Uganda',
    currency: 'UGX',
    flag: '🇺🇬',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'RW',
    name: 'Rwanda',
    currency: 'RWF',
    flag: '🇷🇼',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    currency: 'TZS',
    flag: '🇹🇿',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'ZM',
    name: 'Zambia',
    currency: 'ZMW',
    flag: '🇿🇲',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'MW',
    name: 'Malawi',
    currency: 'MWK',
    flag: '🇲🇼',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'CM',
    name: 'Cameroon',
    currency: 'XAF',
    flag: '🇨🇲',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'SN',
    name: 'Senegal',
    currency: 'XOF',
    flag: '🇸🇳',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'CI',
    name: 'Côte d’Ivoire',
    currency: 'XOF',
    flag: '🇨🇮',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'ML',
    name: 'Mali',
    currency: 'XOF',
    flag: '🇲🇱',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    currency: 'XOF',
    flag: '🇧🇫',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'BJ',
    name: 'Benin',
    currency: 'XOF',
    flag: '🇧🇯',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'TG',
    name: 'Togo',
    currency: 'XOF',
    flag: '🇹🇬',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'NE',
    name: 'Niger',
    currency: 'XOF',
    flag: '🇳🇪',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'ET',
    name: 'Ethiopia',
    currency: 'ETB',
    flag: '🇪🇹',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'EG',
    name: 'Egypt',
    currency: 'EGP',
    flag: '🇪🇬',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'MA',
    name: 'Morocco',
    currency: 'MAD',
    flag: '🇲🇦',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'TN',
    name: 'Tunisia',
    currency: 'TND',
    flag: '🇹🇳',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'GN',
    name: 'Guinea',
    currency: 'GNF',
    flag: '🇬🇳',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'GM',
    name: 'Gambia',
    currency: 'GMD',
    flag: '🇬🇲',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'SL',
    name: 'Sierra Leone',
    currency: 'SLE',
    flag: '🇸🇱',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'LR',
    name: 'Liberia',
    currency: 'LRD',
    flag: '🇱🇷',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },

  /* ═══════════ FlutterWave — international, USD ═══════════ */

  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    flag: '🇺🇸',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard, Amex',
        icon: '💳',
      },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'USD',
    flag: '🇬🇧',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard, Amex',
        icon: '💳',
      },
    ],
  },
  {
    code: 'FR',
    name: 'France',
    currency: 'USD',
    flag: '🇫🇷',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    currency: 'USD',
    flag: '🇩🇪',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'IT',
    name: 'Italy',
    currency: 'USD',
    flag: '🇮🇹',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'ES',
    name: 'Spain',
    currency: 'USD',
    flag: '🇪🇸',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'NL',
    name: 'Netherlands',
    currency: 'USD',
    flag: '🇳🇱',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    currency: 'USD',
    flag: '🇨🇦',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard, Amex',
        icon: '💳',
      },
    ],
  },
  {
    code: 'MX',
    name: 'Mexico',
    currency: 'USD',
    flag: '🇲🇽',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'BR',
    name: 'Brazil',
    currency: 'USD',
    flag: '🇧🇷',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard, Elo',
        icon: '💳',
      },
    ],
  },
  {
    code: 'IN',
    name: 'India',
    currency: 'USD',
    flag: '🇮🇳',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard, RuPay',
        icon: '💳',
      },
    ],
  },
  {
    code: 'JP',
    name: 'Japan',
    currency: 'USD',
    flag: '🇯🇵',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard, JCB',
        icon: '💳',
      },
    ],
  },
  {
    code: 'KR',
    name: 'South Korea',
    currency: 'USD',
    flag: '🇰🇷',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'SG',
    name: 'Singapore',
    currency: 'USD',
    flag: '🇸🇬',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard, Amex',
        icon: '💳',
      },
    ],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    currency: 'USD',
    flag: '🇦🇪',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard',
        icon: '💳',
      },
    ],
  },
  {
    code: 'CN',
    name: 'China',
    currency: 'USD',
    flag: '🇨🇳',
    provider: 'flutterwave',
    methods: [
      {
        key: 'card',
        label: 'Pay with Card',
        description: 'Visa, Mastercard, UnionPay',
        icon: '💳',
      },
    ],
  },
]

/* display order: alphabetical by country name */
PAYMENT_COUNTRIES.sort((a, b) => a.name.localeCompare(b.name))

/** Finds a payment country by its ISO code. */
export function getPaymentCountry(code: string): PaymentCountry | undefined {
  return PAYMENT_COUNTRIES.find(c => c.code === code)
}

/** All currencies used across the list. */
export function getPaymentCurrencies(): string[] {
  return [...new Set(PAYMENT_COUNTRIES.map(c => c.currency))]
}
