import { corsHeaders } from './_lib.js'

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() })
}

/**
 * Paystack Pay-with-Transfer (PwT) — generates a temporary bank account
 * tied to a single transaction so the customer can pay from their banking app.
 *
 * POST body:
 *   { email, amount, currency, reference, metadata }
 *     amount in SUBUNITS (kobo)
 *
 * Calls Paystack's Create Charge API with a `bank_transfer` config and returns
 * the generated account details (bank name, account number, account name) plus
 * the expiry time. The secret key stays server-side.
 */
export async function POST(req) {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

  if (!paystackSecretKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  try {
    const body = await req.json()
    const { email, amount, currency = 'NGN', reference, metadata } = body

    if (!email || !amount || !reference) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    /* Create a temporary account that expires in 30 minutes */
    const accountExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    const chargeRes = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        currency,
        reference,
        metadata,
        bank_transfer: {
          account_expires_at: accountExpiresAt,
        },
      }),
    })

    const chargeData = await chargeRes.json()

    if (!chargeRes.ok || !chargeData.status) {
      return new Response(JSON.stringify({ error: chargeData.message || 'Paystack charge failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    const d = chargeData.data

    /* The charge may already be pending_bank_transfer with account details */
    return new Response(JSON.stringify({
      success: true,
      reference: d.reference || reference,
      status: d.status,
      display_text: d.display_text || 'Please make a transfer to the account specified',
      account_name: d.account_name,
      account_number: d.account_number,
      bank_name: d.bank?.name,
      account_expires_at: d.account_expires_at || accountExpiresAt,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bank transfer setup failed'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
