async function hexFromBytes(bytes: ArrayBuffer): Promise<string> {
  const hashArray = Array.from(new Uint8Array(bytes))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyTelegramInitData(tgWebAppData: string, botToken: string): Promise<boolean> {
  try {
    const params = new URLSearchParams(tgWebAppData)
    const hash = params.get('hash')
    if (!hash) return false

    params.delete('hash')

    const sorted = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    const encoder = new TextEncoder()

    const secretKeyBytes = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const secretKeySig = await crypto.subtle.sign('HMAC', secretKeyBytes, encoder.encode(botToken))

    const dataKey = await crypto.subtle.importKey(
      'raw',
      secretKeySig,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const computedSig = await crypto.subtle.sign('HMAC', dataKey, encoder.encode(sorted))
    const computedHash = await hexFromBytes(computedSig)

    return computedHash === hash
  } catch {
    return false
  }
}

export default async function middleware(request: Request) {
  const redirectUrl = process.env.VITE_REDIRECT_URL
  if (!redirectUrl) return

  const url = new URL(request.url)
  const tgWebAppData = url.searchParams.get('tgWebAppData')

  if (!tgWebAppData) {
    return Response.redirect(redirectUrl, 301)
  }

  const botToken = process.env.BOT_TOKEN
  if (botToken) {
    const valid = await verifyTelegramInitData(tgWebAppData, botToken)
    if (!valid) {
      return Response.redirect(redirectUrl, 301)
    }
  }
}

export const config = {
  matcher: ['/((?!assets/|favicon.ico).*)'],
}
