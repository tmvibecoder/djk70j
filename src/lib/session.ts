// Node-Schicht der Autorisierung — NUR in Route Handlers / Server Components
// verwenden, NIE in src/middleware.ts (läuft auf der Edge-Runtime, kein
// Prisma). Lädt bei jedem Aufruf frisch aus der DB, damit Rollenänderungen
// und Passwort-Resets eines Admins sofort wirken, ohne dass eine Session neu
// ausgestellt werden müsste.

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { verifySessionToken, SESSION_COOKIE } from './auth'
import { Bereich, BereichsRolle } from './bereiche'

export type { Bereich, BereichsRolle } from './bereiche'
export { BEREICHE, BEREICH_LABELS, BEREICHSROLLEN, ROLLE_LABELS } from './bereiche'

const RANG: Record<BereichsRolle, number> = { lesen: 1, bearbeiten: 2, verwalten: 3 }

export interface SessionUser {
  id: string
  username: string
  name: string
  istAdmin: boolean
  rollen: Partial<Record<Bereich, BereichsRolle>>
}

async function ladeSessionUser(token: { userId: string; tokenVersion: number }): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: token.userId },
    include: { bereichsRollen: true },
  })
  if (!user || !user.aktiv || !user.username || user.tokenVersion !== token.tokenVersion) return null

  const rollen: Partial<Record<Bereich, BereichsRolle>> = {}
  for (const r of user.bereichsRollen) {
    rollen[r.bereich as Bereich] = r.rolle as BereichsRolle
  }
  return { id: user.id, username: user.username, name: user.name, istAdmin: user.istAdmin, rollen }
}

export async function getSessionUser(cookieValue: string | undefined | null): Promise<SessionUser | null> {
  const token = await verifySessionToken(cookieValue)
  if (!token) return null
  return ladeSessionUser(token)
}

// Server Components: Cookie kommt aus next/headers statt aus dem Request.
export async function getSessionUserFromCookies(): Promise<SessionUser | null> {
  return getSessionUser(cookies().get(SESSION_COOKIE)?.value)
}

// Route Handlers, die nach dem erfordereRolle-Gate zusätzlich die Rolle
// selbst brauchen (z.B. um ein Kassier-only-Feld auszublenden).
export async function getSessionUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  return getSessionUser(req.cookies.get(SESSION_COOKIE)?.value)
}

export function darf(session: SessionUser | null, bereich: Bereich, aktion: BereichsRolle): boolean {
  if (!session) return false
  if (session.istAdmin) return true
  const rolle = session.rollen[bereich]
  return !!rolle && RANG[rolle] >= RANG[aktion]
}

// Guard für API-Routen: gibt bei fehlender Berechtigung die fertige
// 401/403-Antwort zurück, sonst null. Verwendung:
//   const verboten = await erfordereRolle(req, 'werbebanden', 'bearbeiten')
//   if (verboten) return verboten
export async function erfordereRolle(
  req: NextRequest,
  bereich: Bereich,
  aktion: BereichsRolle,
): Promise<NextResponse | null> {
  const session = await getSessionUser(req.cookies.get(SESSION_COOKIE)?.value)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!darf(session, bereich, aktion)) {
    return NextResponse.json({ error: 'Keine Berechtigung für diese Aktion' }, { status: 403 })
  }
  return null
}

export async function erfordereAdmin(req: NextRequest): Promise<NextResponse | null> {
  const session = await getSessionUser(req.cookies.get(SESSION_COOKIE)?.value)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.istAdmin) {
    return NextResponse.json({ error: 'Nur für Systemverwalter' }, { status: 403 })
  }
  return null
}
