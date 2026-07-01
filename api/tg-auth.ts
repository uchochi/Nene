/// <reference types="node" />

import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { verifyTelegramInitData, parseUserFromInitData, corsHeaders } from './_lib.js'

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  const botToken = process.env.BOT_TOKEN
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!botToken || !supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  try {
    const body = await req.json()
    const { initData } = body
    if (!initData) {
      return new Response(JSON.stringify({ error: 'Missing initData' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    verifyTelegramInitData(initData, botToken)
    const tgUser = parseUserFromInitData(initData)
    const telegramId = tgUser.id

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: existing } = await supabase
      .from('users')
      .select('supabase_user_id')
      .eq('telegram_id', telegramId)
      .single()

    let supabaseUserId: string

    if (existing?.supabase_user_id) {
      supabaseUserId = existing.supabase_user_id
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: `${telegramId}@telegram.user`,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: {
          telegram_id: telegramId,
          username: tgUser.username,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
        },
      })
      if (createError || !newUser.user) throw createError ?? new Error('Failed to create user')

      supabaseUserId = newUser.user.id

      await supabase.from('users').upsert(
        {
          supabase_user_id: supabaseUserId,
          telegram_id: telegramId,
          username: tgUser.username,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          phone_number: tgUser.phone_number,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'telegram_id' }
      )
    }

    const sessionRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/sessions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ user_id: supabaseUserId }),
      }
    )

    if (!sessionRes.ok) {
      const errText = await sessionRes.text()
      throw new Error(`Failed to create session: ${errText}`)
    }

    const sessionData = await sessionRes.json()

    return new Response(JSON.stringify(sessionData), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed'
    return new Response(JSON.stringify({ error: message }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
