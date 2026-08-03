import { prisma } from '@/lib/prisma'
import { signBandenSession, BANDEN_COOKIE, BANDEN_MAX_AGE } from '@/lib/banden-auth'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

// Nur-Passwort-Login für den Werbebanden-Bereich. Der Hash liegt in den
// Werbebanden-Einstellungen (Seed setzt das Start-Passwort, änderbar über
// die Einstellungs-Seite).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const password: string | undefined = body.password

  if (!password) {
    return NextResponse.json({ error: 'Passwort erforderlich' }, { status: 400 })
  }

  const einstellung = await prisma.werbebandenEinstellung.findUnique({
    where: { id: 'werbebanden' },
  })
  if (!einstellung?.passwordHash || !(await bcrypt.compare(password, einstellung.passwordHash))) {
    return NextResponse.json({ error: 'Login fehlgeschlagen' }, { status: 401 })
  }

  const token = await signBandenSession()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(BANDEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: BANDEN_MAX_AGE,
  })
  return res
}
