// HMAC-signiertes Session-Cookie der App. Web-Crypto-kompatibel, läuft auch
// in der Edge-Middleware (Next.js middleware.ts) — deshalb KEIN Prisma-Import
// hier. Krypto-Helfer in lib/hmac.ts.
//
// Cookie-Format: `${userId}.${timestampMs}.${tokenVersion}.${hmacSha256Hex}`
// Signiert über `${userId}.${timestampMs}.${tokenVersion}` mit AUTH_SECRET.
//
// Die Middleware prüft mit diesem Modul NUR „eingeloggt ja/nein" (Signatur +
// Ablauf). Welche Bereiche/Rollen ein Nutzer hat, entscheidet ausschließlich
// die Node-Schicht in lib/session.ts anhand einer frischen DB-Abfrage — so
// wirken Rollenänderungen und Passwort-Resets (tokenVersion-Vergleich) sofort,
// ohne dass die Edge-Runtime Prisma laden müsste (das würde den Build brechen).

import { hmacSign, hmacVerify } from './hmac'

const COOKIE_NAME = 'djk_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 Tage

export async function signSession(userId: string, tokenVersion: number): Promise<string> {
  const ts = Date.now().toString()
  const payload = `${userId}.${ts}.${tokenVersion}`
  const sig = await hmacSign(payload)
  return `${payload}.${sig}`
}

export interface SessionToken {
  userId: string
  issuedAt: number
  tokenVersion: number
}

export async function verifySessionToken(value: string | undefined | null): Promise<SessionToken | null> {
  if (!value) return null
  const parts = value.split('.')
  if (parts.length !== 4) return null
  const [userId, tsStr, tokenVersionStr, sigHex] = parts
  const ts = parseInt(tsStr, 10)
  const tokenVersion = parseInt(tokenVersionStr, 10)
  if (!ts || Number.isNaN(ts) || Number.isNaN(tokenVersion)) return null
  if (Date.now() - ts > MAX_AGE_SECONDS * 1000) return null

  const ok = await hmacVerify(`${userId}.${ts}.${tokenVersion}`, sigHex)
  return ok ? { userId, issuedAt: ts, tokenVersion } : null
}

export const SESSION_COOKIE = COOKIE_NAME
export const SESSION_MAX_AGE = MAX_AGE_SECONDS
