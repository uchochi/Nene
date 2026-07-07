import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from './_lib.js'

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!paystackSecretKey || !supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  try {
    const body = await req.json()
    const { reference, userId, planId, credits, amount, currency } = body

    if (!reference || !userId || !planId || !credits || !amount || !currency) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    /* verify with Paystack */
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${paystackSecretKey}` } },
    )

    if (!verifyRes.ok) {
      const errText = await verifyRes.text()
      return new Response(JSON.stringify({ error: `Paystack API error: ${errText}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    const verifyData = await verifyRes.json()

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return new Response(JSON.stringify({ error: 'Payment not verified', paystack: verifyData }), {
        status: 402,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    /* confirm amount matches (amount is in kobo/cents — compare with Paystack) */
    if (verifyData.data.amount !== amount) {
      return new Response(JSON.stringify({ error: 'Amount mismatch' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    /* check for duplicate — already processed? */
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: existing } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('reference', reference)
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

    /* insert transaction record */
    const { error: txnError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        plan_id: planId,
        credits_awarded: credits,
        amount_paid: amount,
        currency,
        reference,
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
