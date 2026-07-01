/// <reference types="node" />

import { createHmac } from 'node:crypto'

const encoder = new TextEncoder()

function base64url(str: string): string {
  return Buffer.from(str).toString('base64url')
}

function base64urlFromBytes(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url')
}

export function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const headerB64 = base64url(JSON.stringify(header))
  const payloadB64 = base64url(JSON.stringify(payload))
  const data = `${headerB64}.${payloadB64}`
  const sig = createHmac('sha256', secret).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifyTelegramInitData(initData: string, botToken: string): Record<string, string> {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) throw new Error('Missing hash in initData')

  params.delete('hash')

  const sorted = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const computedHash = createHmac('sha256', secretKey).update(sorted).digest('hex')

  if (computedHash !== hash) {
    throw new Error('Invalid initData hash')
  }

  const result: Record<string, string> = {}
  for (const [k, v] of params.entries()) {
    result[k] = v
  }
  return result
}

export function parseUserFromInitData(initData: string): {
  id: number
  username: string | null
  first_name: string | null
  last_name: string | null
  phone_number: string | null
} {
  const params = new URLSearchParams(initData)
  const userRaw = params.get('user')
  if (!userRaw) throw new Error('Missing user in initData')

  const user = JSON.parse(userRaw)
  return {
    id: user.id,
    username: user.username ?? null,
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    phone_number: user.phone_number ?? null,
  }
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
