import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from './_lib.js'

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() })
}

/**
 * Dual-provider payment verification.
 *
 * POST body:
 *   provider: 'paystack'    → { reference, verificationType, userId, planId, credits, amount, currency }
 *                              amount in SUBUNITS (kobo)
 *                              verificationType: 'charge' (bank transfer via Create Charge API)
 *                                                | 'transaction' (default, card via Initialize Transaction)
 *   provider: 'flutterwave' → { transactionId, txRef, userId, planId, credits, amount, currency }
 *                              amount in MAIN units
 *
 * Both paths verify server-side with the provider's API, then share the
 * same duplicate-check → credit-update → transaction-insert tail.
 */
export async function POST(req) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  try {
    const body = await req.json()
    const {
      provider = 'paystack',
      reference,        /* paystack */
      verificationType = 'transaction', /* paystack: 'charge' | 'transaction' */
      transactionId,    /* flutterwave */
      txRef,            /* flutterwave */
      userId, planId, credits, amount, currency,
    } = body

    if (!userId || !planId || !credits || !amount || !currency) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    /* ── provider-specific verification → canonical reference ── */
    let canonicalRef

    if (provider === 'paystack') {
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
      if (!paystackSecretKey) {
        return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }
      if (!reference) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      /*
       * Bank transfer charges are created via the Create Charge API, which
       * returns a CHARGE reference. The correct manual verification for those
       * is the Check Pending Charge endpoint (GET /charge/:reference), NOT
       * transaction/verify. Card transactions (Initialize Transaction) use
       * transaction/verify. We branch on verificationType.
       */
      const isCharge = verificationType === 'charge'
      const verifyUrl = isCharge
        ? `https://api.paystack.co/charge/${encodeURIComponent(reference)}`
        : `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`

      const verifyRes = await fetch(verifyUrl, {
        headers: { Authorization: `Bearer ${paystackSecretKey}` },
      })

      if (!verifyRes.ok) {
        const errText = await verifyRes.text()
        return new Response(JSON.stringify({ error: `Paystack API error: ${errText}` }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const verifyData = await verifyRes.json()

      /* charge status lives at data.status; transaction status at data.data.status */
      const txStatus = isCharge ? verifyData.data?.status : verifyData.data?.data?.status

      if (!verifyData.status || txStatus !== 'success') {
        return new Response(JSON.stringify({ error: 'Payment not verified', paystack: verifyData }), {
          status: 402,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      /* amount is in kobo/cents — compare with Paystack */
      if (verifyData.data.amount !== amount) {
        return new Response(JSON.stringify({ error: 'Amount mismatch' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      /* currency must match the requested currency */
      if (verifyData.data.currency !== currency) {
        return new Response(JSON.stringify({ error: 'Currency mismatch' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      canonicalRef = reference
    } else if (provider === 'flutterwave') {
      const flwSecretKey = process.env.FLUTTERWAVE_SECRET_KEY
      if (!flwSecretKey) {
        return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }
      if (!transactionId || !txRef) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
        { headers: { Authorization: `Bearer ${flwSecretKey}` } },
      )

      if (!verifyRes.ok) {
        const errText = await verifyRes.text()
        return new Response(JSON.stringify({ error: `FlutterWave API error: ${errText}` }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const verifyData = await verifyRes.json()

      if (verifyData.status !== 'success' || verifyData.data.status !== 'successful') {
        return new Response(JSON.stringify({ error: 'Payment not verified', flutterwave: verifyData }), {
          status: 402,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      /* FlutterWave amounts are in MAIN units (no kobo/cents) */
      if (Number(verifyData.data.amount) !== Number(amount)) {
        return new Response(JSON.stringify({ error: 'Amount mismatch' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      if (verifyData.data.currency !== currency) {
        return new Response(JSON.stringify({ error: 'Currency mismatch' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      if (verifyData.data.tx_ref !== txRef) {
        return new Response(JSON.stringify({ error: 'Transaction reference mismatch' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      canonicalRef = txRef
    } else {
      return new Response(JSON.stringify({ error: `Unknown provider: ${provider}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    /* ── shared tail: duplicate check → credit update → txn insert ── */
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: existing } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('reference', canonicalRef)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ success: true, alreadyProcessed: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: profile } = await supabase
      .from('user_credits')
      .select('balance, total_purchased')
      .eq('user_id', userId)
      .maybeSingle()

    const currentBalance = profile?.balance ?? 0
    const currentTotal = profile?.total_purchased ?? 0
    const newBalance = currentBalance + credits
    const newTotal = currentTotal + credits

    const { error: upsertError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        balance: newBalance,
        total_purchased: newTotal,
        updated_at: now,
      }, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('[verify-payment] upsert failed:', upsertError)
      throw upsertError
    }

    const { error: txnError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        plan_id: planId,
        credits_awarded: credits,
        amount_paid: amount,
        currency,
        reference: canonicalRef,
        subscription_expires_at: expiresAt,
        status: 'completed',
      })

    if (txnError) throw txnError

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
