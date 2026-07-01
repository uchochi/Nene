import { createClient } from '@supabase/supabase-js'
import { verifyTelegramInitData, parseUserFromInitData, signJwt, corsHeaders } from './_lib'

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
  const jwtSecret = process.env.SUPABASE_JWT_SECRET

  if (!botToken || !supabaseUrl || !supabaseKey || !jwtSecret) {
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

    const { error: upsertError } = await supabase.from('users').upsert(
      {
        telegram_id: telegramId,
        username: tgUser.username,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        phone_number: tgUser.phone_number,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'telegram_id' }
    )
    if (upsertError) throw upsertError

    const token = signJwt(
      {
        sub: String(telegramId),
        role: 'authenticated',
        telegram_id: telegramId,
        username: tgUser.username,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
      },
      jwtSecret
    )

    return new Response(
      JSON.stringify({
        token,
        user: {
          telegram_id: telegramId,
          username: tgUser.username,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          phone_number: tgUser.phone_number,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed'
    return new Response(JSON.stringify({ error: message }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
