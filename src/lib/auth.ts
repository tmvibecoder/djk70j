// HMAC-signiertes Session-Cookie der App. Web-Crypto-kompatibel, läuft auch
// in der Edge-Middleware (Next.js middleware.ts). Krypto-Helfer in lib/hmac.ts.
//
// Cookie-Format: `${userId}.${timestampMs}.${hmacSha256Hex}`
// Signiert über `${userId}.${timestampMs}` mit AUTH_SECRET.

import { hmacSign, hmacVerify } from './hmac'

const COOKIE_NAME = 'djk_auth'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 Tage

export async function signSession(userId: string): Promise<string> {
  const ts = Date.now().toString()
  const payload = `${userId}.${ts}`
  const sig = await hmacSign(payload)
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

  const ok = await hmacVerify(`${userId}.${ts}`, sigHex)
  return ok ? { userId, issuedAt: ts } : null
}

export const SESSION_COOKIE = COOKIE_NAME
export const SESSION_MAX_AGE = MAX_AGE_SECONDS
