import { prisma } from '@/lib/prisma'
import { signSchluesselSession, SCHLUESSEL_COOKIE, SCHLUESSEL_MAX_AGE } from '@/lib/schluessel-auth'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

// Nur-Passwort-Login für den Schlüssel-Bereich. Der Hash liegt in den
// Schlüssel-Einstellungen (Seed setzt das Start-Passwort, änderbar über
// die Einstellungs-Seite).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const password: string | undefined = body.password

  if (!password) {
    return NextResponse.json({ error: 'Passwort erforderlich' }, { status: 400 })
  }

  const einstellung = await prisma.schluesselEinstellung.findUnique({
    where: { id: 'schluessel' },
  })
  if (!einstellung?.passwordHash || !(await bcrypt.compare(password, einstellung.passwordHash))) {
    return NextResponse.json({ error: 'Login fehlgeschlagen' }, { status: 401 })
  }

  const token = await signSchluesselSession()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SCHLUESSEL_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SCHLUESSEL_MAX_AGE,
  })
  return res
}
