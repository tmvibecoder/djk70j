// Session-Cookie für den Werbebanden-Bereich (/werbebanden), getrennt vom
// App-Login. Gleiches HMAC-Verfahren wie src/lib/auth.ts (Helfer in
// lib/hmac.ts, gleiches AUTH_SECRET), aber eigenes Cookie und ein
// abweichendes Payload-Format.
//
// Cookie-Format: `banden.${timestampMs}.${hmacSha256Hex}`
// Signiert über `banden-auth:${timestampMs}` — bewusst NICHT über
// `banden.${timestampMs}`: Die App-Middleware verifiziert nur die Signatur
// (keine DB-Prüfung); mit identischem Payload-Format wäre ein Banden-Token,
// ins djk_auth-Cookie kopiert, ein gültiges App-Token. Die Domain-Trennung
// im Payload verhindert genau das — in beide Richtungen.

import { hmacSign, hmacVerify } from './hmac'

const COOKIE_NAME = 'djk_banden_auth'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 Tage

export async function signBandenSession(): Promise<string> {
  const ts = Date.now().toString()
  const sig = await hmacSign(`banden-auth:${ts}`)
  return `banden.${ts}.${sig}`
}

export async function verifyBandenSession(value: string | undefined | null): Promise<boolean> {
  if (!value) return false
  const parts = value.split('.')
  if (parts.length !== 3 || parts[0] !== 'banden') return false
  const ts = parseInt(parts[1], 10)
  if (!ts || Number.isNaN(ts)) return false
  if (Date.now() - ts > MAX_AGE_SECONDS * 1000) return false

  return hmacVerify(`banden-auth:${ts}`, parts[2])
}

export const BANDEN_COOKIE = COOKIE_NAME
export const BANDEN_MAX_AGE = MAX_AGE_SECONDS
