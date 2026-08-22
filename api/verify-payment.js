import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from './_lib.js'

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() })
}

export async function POST(req) {
  const flwSecretKey = process.env.FLUTTERWAVE_SECRET_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!flwSecretKey || !supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  try {
    const body = await req.json()
    const { transactionId, txRef, userId, planId, credits, amount, currency } = body

    if (!transactionId || !txRef || !userId || !planId || !credits || !amount || !currency) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    /* verify with FlutterWave */
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

    /* confirm amount + currency match — FlutterWave amounts are in MAIN units (no kobo/cents) */
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

    /* confirm the reference matches what we sent */
    if (verifyData.data.tx_ref !== txRef) {
      return new Response(JSON.stringify({ error: 'Transaction reference mismatch' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    /* check for duplicate — already processed? */
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: existing } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('reference', txRef)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ success: true, alreadyProcessed: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    /* update user credits balance */
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    /* fetch current balance */
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

    if (upsertError) throw upsertError

    /* insert transaction record — amount_paid is FlutterWave main units */
    const { error: txnError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        plan_id: planId,
        credits_awarded: credits,
        amount_paid: amount,
        currency,
        reference: txRef,
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
