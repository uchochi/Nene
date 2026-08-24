import { createHmac } from 'node:crypto'

const encoder = new TextEncoder()

function base64url(str) {
  return Buffer.from(str).toString('base64url')
}

function base64urlFromBytes(bytes) {
  return Buffer.from(bytes).toString('base64url')
}

export function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const headerB64 = base64url(JSON.stringify(header))
  const payloadB64 = base64url(JSON.stringify(payload))
  const data = `${headerB64}.${payloadB64}`
  const sig = createHmac('sha256', secret).update(data).digest('base64url')
  return `${data}.${sig}`
}

/* Telegram initData verification moved to telegram-webhook-archive/
   (app migrated to browser-first access on 2026-08-24). */

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
