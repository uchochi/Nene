/**
 * Type declarations for the FlutterWave inline checkout (v3.js).
 *
 * Loaded dynamically by src/utils/flutterwave.ts from
 * https://checkout.flutterwave.com/v3.js — exposes a single global
 * `FlutterwaveCheckout(config)` function that opens the hosted modal.
 */

interface FlutterwaveCustomer {
  email: string
  phone_number?: string
  name?: string
}

interface FlutterwaveCustomizations {
  title?: string
  description?: string
  logo?: string
}

interface FlutterwaveMeta {
  consumer_id?: number | string
  consumer_mac?: string
  [key: string]: unknown
}

interface FlutterwaveCallbackData {
  tx_ref?: string
  transaction_id?: string | number
  status?: string
  [key: string]: unknown
}

interface FlutterwaveBankTransferOptions {
  /** Virtual account expiry in seconds (PWBT only) */
  expires?: number
}

interface FlutterwaveCheckoutConfig {
  /** FlutterWave public key, e.g. FLWPUBK_TEST-... */
  public_key: string
  /** Unique merchant transaction reference */
  tx_ref: string
  /** Amount in the currency's MAIN unit (no kobo/cents multiplication) */
  amount: number
  currency: string
  /**
   * Comma + space separated payment methods to offer, e.g.
   * "card, banktransfer". Passing a single value restricts the
   * modal to that method.
   *
   * NOTE: without enforce_payment_options, the dashboard's
   * "Enable Dashboard Payment Options" setting overrides this value.
   */
  payment_options: string
  /**
   * Undocumented but supported (present in the official v3.js runtime
   * and Flutterwave/PHP-v3): serializes as enforce_payment_options=1
   * in the checkout payload, making the backend ENFORCE payment_options
   * regardless of dashboard settings. Required for reliable method
   * restriction.
   */
  enforce_payment_options?: boolean
  /** PWBT-specific options (bank transfer expiry) */
  bank_transfer_options?: FlutterwaveBankTransferOptions
  /** Where the user lands after completing the modal flow */
  redirect_url?: string
  customer: FlutterwaveCustomer
  meta?: FlutterwaveMeta
  customizations?: FlutterwaveCustomizations
  /** Called when the transaction completes inside the modal */
  callback: (data: FlutterwaveCallbackData) => void
  /** Called when the user closes the modal; true when payment incomplete */
  onclose: (incomplete?: boolean) => void
}

/** Opens the FlutterWave hosted checkout modal. Returns a modal handle. */
declare function FlutterwaveCheckout(
  config: FlutterwaveCheckoutConfig,
): { close: () => void }

interface Window {
  FlutterwaveCheckout?: typeof FlutterwaveCheckout
}
