// HMAC-signiertes Session-Cookie. Web-Crypto-kompatibel, läuft auch
// in der Edge-Middleware (Next.js middleware.ts).
//
// Cookie-Format: `${userId}.${timestampMs}.${hmacSha256Hex}`
// Signiert über `${userId}.${timestampMs}` mit AUTH_SECRET.

const COOKIE_NAME = 'djk_auth'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 Tage

function getSecret(): string {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET ist nicht gesetzt (.env)')
  return s
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): ArrayBuffer {
  const buf = new ArrayBuffer(hex.length / 2)
  const out = new Uint8Array(buf)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return buf
}

async function hmac(payload: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return bytesToHex(sig)
}

export async function signSession(userId: string): Promise<string> {
  const ts = Date.now().toString()
  const payload = `${userId}.${ts}`
  const sig = await hmac(payload)
  return `${payload}.${sig}`
}

export interface VerifiedSession {
  userId: string
  issuedAt: number
}

export async function verifySession(value: string | undefined | null): Promise<VerifiedSession | null> {
  if (!value) return null
  const parts = value.split('.')
  if (parts.length !== 3) return null
  const [userId, tsStr, sigHex] = parts
  const ts = parseInt(tsStr, 10)
  if (!ts || Number.isNaN(ts)) return null
  if (Date.now() - ts > MAX_AGE_SECONDS * 1000) return null

  const enc = new TextEncoder()
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(getSecret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBytes(sigHex),
      enc.encode(`${userId}.${ts}`),
    )
    return ok ? { userId, issuedAt: ts } : null
  } catch {
    return null
  }
}

export const SESSION_COOKIE = COOKIE_NAME
export const SESSION_MAX_AGE = MAX_AGE_SECONDS
