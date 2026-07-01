import { verifyTelegramInitData, parseUserFromInitData, corsHeaders } from './_lib'

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('OK', { status: 200, headers: corsHeaders() })
  }

  try {
    const update = await req.json()

    const msg = update.message
    if (!msg) {
      return new Response('OK', { status: 200, headers: corsHeaders() })
    }

    const contact = msg.contact
    if (!contact || !contact.phone_number) {
      return new Response('OK', { status: 200, headers: corsHeaders() })
    }

    const telegramId = contact.user_id
    const phoneNumber = contact.phone_number

    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey) {
      return new Response('OK', { status: 200, headers: corsHeaders() })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    await supabase.from('users').upsert(
      {
        telegram_id: telegramId,
        phone_number: phoneNumber,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'telegram_id' }
    )

    return new Response('OK', { status: 200, headers: corsHeaders() })
  } catch {
    return new Response('OK', { status: 200, headers: corsHeaders() })
  }
}
