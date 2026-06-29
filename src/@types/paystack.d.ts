declare module '@paystack/inline-js' {
  interface PaystackTransaction {
    id: number
    reference: string
    message?: string
  }

  interface PaystackError {
    message: string
  }

  interface PaystackCheckoutParams {
    key: string
    email: string
    amount: number
    currency?: string
    channels?: string[]
    firstName?: string
    lastName?: string
    phone?: string
    metadata?: Record<string, unknown>
    reference?: string
    onSuccess?: (response: PaystackTransaction) => void
    onClose?: () => void
    onError?: (error: PaystackError) => void
    onCancel?: () => void
    onLoad?: (response: PaystackTransaction & { customer: Record<string, unknown>; accessCode: string }) => void
  }

  class PaystackPop {
    constructor()
    checkout(params: PaystackCheckoutParams): Promise<PaystackTransaction>
    newTransaction(params: PaystackCheckoutParams): PaystackTransaction
    resumeTransaction(
      accessCode: string,
      callbacks?: {
        onSuccess?: (response: PaystackTransaction) => void
        onClose?: () => void
        onError?: (error: PaystackError) => void
        onCancel?: () => void
        onLoad?: (response: PaystackTransaction & { customer: Record<string, unknown>; accessCode: string }) => void
      }
    ): PaystackTransaction
    cancelTransaction(id: string | PaystackTransaction): void
    preloadTransaction(params: PaystackCheckoutParams): () => void
    paymentRequest(params: Record<string, unknown>): void
    static isLoaded(): boolean
    static CURRENCIES: Record<string, string>
    static CHANNELS: Record<string, string>
  }

  export default PaystackPop
}
