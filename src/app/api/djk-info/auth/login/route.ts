import { prisma } from '@/lib/prisma'
import { signInfoSession, INFO_COOKIE, INFO_MAX_AGE, INFO_ROLLEN, InfoRolle } from '@/lib/info-auth'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

// Rollen-Login für den DJK-Info-Bereich: Rolle aus dem Dropdown + das
// zugehörige Passwort. Die drei Hashes liegen in den Info-Einstellungen
// (Seed setzt Start-Passwörter, änderbar über die Einstellungs-Seite).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const rolle: InfoRolle | undefined = body.rolle
  const password: string | undefined = body.password

  if (!rolle || !INFO_ROLLEN.includes(rolle) || !password) {
    return NextResponse.json({ error: 'Rolle und Passwort erforderlich' }, { status: 400 })
  }

  const einstellung = await prisma.infoEinstellung.findUnique({ where: { id: 'djk-info' } })
  const hash = rolle === 'kassier'
    ? einstellung?.passwordHashKassier
    : rolle === 'redakteur'
      ? einstellung?.passwordHashRedakteur
      : einstellung?.passwordHashLeser
  if (!hash || !(await bcrypt.compare(password, hash))) {
    return NextResponse.json({ error: 'Login fehlgeschlagen' }, { status: 401 })
  }

  const token = await signInfoSession(rolle)
  const res = NextResponse.json({ ok: true, rolle })
  res.cookies.set(INFO_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: INFO_MAX_AGE,
  })
  return res
}
