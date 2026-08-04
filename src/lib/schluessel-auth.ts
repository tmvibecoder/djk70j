// Session-Cookie für den Schlüssel-Bereich (/schluessel), getrennt vom
// App-Login und vom Werbebanden-Cookie. Gleiches HMAC-Verfahren wie
// src/lib/auth.ts (Web-Crypto, edge-tauglich, gleiches AUTH_SECRET), aber
// eigenes Cookie und ein abweichendes Payload-Format.
//
// Cookie-Format: `schluessel.${timestampMs}.${hmacSha256Hex}`
// Signiert über `schluessel-auth:${timestampMs}` — das Domain-Präfix im
// Payload verhindert, dass ein Token dieses Bereichs, in ein anderes
// Auth-Cookie kopiert, dort gültig wäre (die Middleware prüft nur
// Signaturen, keine DB) — in beide Richtungen.

const COOKIE_NAME = 'djk_schluessel_auth'
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

export async function signSchluesselSession(): Promise<string> {
  const ts = Date.now().toString()
  const sig = await hmac(`schluessel-auth:${ts}`)
  return `schluessel.${ts}.${sig}`
}

export async function verifySchluesselSession(value: string | undefined | null): Promise<boolean> {
  if (!value) return false
  const parts = value.split('.')
  if (parts.length !== 3 || parts[0] !== 'schluessel') return false
  const ts = parseInt(parts[1], 10)
  if (!ts || Number.isNaN(ts)) return false
  if (Date.now() - ts > MAX_AGE_SECONDS * 1000) return false

  const enc = new TextEncoder()
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(getSecret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    return await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBytes(parts[2]),
      enc.encode(`schluessel-auth:${ts}`),
    )
  } catch {
    return false
  }
}

export const SCHLUESSEL_COOKIE = COOKIE_NAME
export const SCHLUESSEL_MAX_AGE = MAX_AGE_SECONDS
