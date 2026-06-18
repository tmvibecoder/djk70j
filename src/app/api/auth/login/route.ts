import { prisma } from '@/lib/prisma'
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const password: string | undefined = body.password

  if (!password) {
    return NextResponse.json({ error: 'Passwort erforderlich' }, { status: 400 })
  }

  // Kein Benutzername mehr: Passwort gegen alle Benutzer mit Passwort-Hash prüfen.
  const users = await prisma.user.findMany({ where: { passwordHash: { not: null } } })
  let matched: (typeof users)[number] | null = null
  for (const user of users) {
    if (user.passwordHash && (await bcrypt.compare(password, user.passwordHash))) {
      matched = user
      break
    }
  }
  if (!matched) {
    return NextResponse.json({ error: 'Login fehlgeschlagen' }, { status: 401 })
  }

  const token = await signSession(matched.id)
  const res = NextResponse.json({ id: matched.id, name: matched.name, username: matched.username, role: matched.role })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return res
}
