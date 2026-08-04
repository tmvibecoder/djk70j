// Session-Cookie für den DJK-Info-Bereich (/djk-info) mit drei Rollen,
// getrennt vom App-Login und vom Werbebanden-Login. Gleiches HMAC-Verfahren
// (Helfer in lib/hmac.ts, gleiches AUTH_SECRET), aber eigenes Cookie und ein
// eigenes Payload-Format mit der Rolle im signierten Teil.
//
// Cookie-Format: `info.${rolle}.${timestampMs}.${hmacSha256Hex}`
// Signiert über `info-auth:${rolle}:${timestampMs}` — paarweise disjunkt zu
// App (`${userId}.${ts}`) und Banden (`banden-auth:${ts}`): Die Middleware
// prüft nur Signaturen (keine DB), erst die Domain-Trennung im Payload
// verhindert, dass ein kopierter Token bereichsübergreifend gilt. Die Rolle
// steckt im signierten Payload und ist damit nicht clientseitig manipulierbar.
//
// Bekannte, bewusste Einschränkung (wie bei den Banden): Die Rolle gilt für
// die Cookie-Laufzeit (30 Tage) ohne DB-Prüfung — eine Passwortänderung
// invalidiert bestehende Sessions nicht.

import { NextRequest, NextResponse } from 'next/server'
import { hmacSign, hmacVerify } from './hmac'
import { verifySession, SESSION_COOKIE } from './auth'

const COOKIE_NAME = 'djk_info_auth'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 Tage

export type InfoRolle = 'kassier' | 'redakteur' | 'leser'
export const INFO_ROLLEN: InfoRolle[] = ['kassier', 'redakteur', 'leser']

export async function signInfoSession(rolle: InfoRolle): Promise<string> {
  const ts = Date.now().toString()
  const sig = await hmacSign(`info-auth:${rolle}:${ts}`)
  return `info.${rolle}.${ts}.${sig}`
}

export async function verifyInfoSession(value: string | undefined | null): Promise<InfoRolle | null> {
  if (!value) return null
  const parts = value.split('.')
  if (parts.length !== 4 || parts[0] !== 'info') return null
  const rolle = parts[1] as InfoRolle
  if (!INFO_ROLLEN.includes(rolle)) return null
  const ts = parseInt(parts[2], 10)
  if (!ts || Number.isNaN(ts)) return null
  if (Date.now() - ts > MAX_AGE_SECONDS * 1000) return null

  const ok = await hmacVerify(`info-auth:${rolle}:${ts}`, parts[3])
  return ok ? rolle : null
}

// Rolle des Aufrufers: Info-Cookie zuerst; ersatzweise zählt ein gültiges
// App-Cookie als Kassier (App-Nutzer = Festausschuss, Vollzugriff).
// Das Banden-Cookie öffnet den Info-Bereich NICHT.
export async function rolleAusRequest(req: NextRequest): Promise<InfoRolle | null> {
  const infoRolle = await verifyInfoSession(req.cookies.get(COOKIE_NAME)?.value)
  if (infoRolle) return infoRolle
  const appSession = await verifySession(req.cookies.get(SESSION_COOKIE)?.value)
  return appSession ? 'kassier' : null
}

// Rechte-Matrix. Serverseitig in JEDER schreibenden Route prüfen —
// die Middleware stellt nur „eingeloggt" sicher.
//   verwalten   → Kunden, Rechnungen, Verteilung, Einstellungen, Dateien (nur Kassier)
//   schaltungen → Ausgaben anlegen/ändern + Schaltungs-Matrix (Kassier + Redakteur)
export type InfoAktion = 'verwalten' | 'schaltungen'

export function darf(rolle: InfoRolle | null, aktion: InfoAktion): boolean {
  if (!rolle) return false
  if (aktion === 'verwalten') return rolle === 'kassier'
  return rolle === 'kassier' || rolle === 'redakteur'
}

// Guard für schreibende Routen: gibt bei fehlender Berechtigung die fertige
// 403-Antwort zurück, sonst null. Verwendung:
//   const verboten = await erfordereRolle(req, 'verwalten')
//   if (verboten) return verboten
export async function erfordereRolle(req: NextRequest, aktion: InfoAktion): Promise<NextResponse | null> {
  const rolle = await rolleAusRequest(req)
  if (!darf(rolle, aktion)) {
    return NextResponse.json({ error: 'Keine Berechtigung für diese Aktion' }, { status: 403 })
  }
  return null
}

export const INFO_COOKIE = COOKIE_NAME
export const INFO_MAX_AGE = MAX_AGE_SECONDS
