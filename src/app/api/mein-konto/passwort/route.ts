import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/session'
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest) {
  const session = await getSessionUser(req.cookies.get(SESSION_COOKIE)?.value)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const aktuellesPasswort: string = typeof body.aktuellesPasswort === 'string' ? body.aktuellesPasswort : ''
  const neuesPasswort: string = typeof body.neuesPasswort === 'string' ? body.neuesPasswort.trim() : ''

  if (!aktuellesPasswort || !neuesPasswort) {
    return NextResponse.json({ error: 'Aktuelles und neues Passwort erforderlich' }, { status: 400 })
  }
  if (neuesPasswort.length < 6) {
    return NextResponse.json({ error: 'Neues Passwort muss mindestens 6 Zeichen haben' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } })
  if (!user?.passwordHash || !(await bcrypt.compare(aktuellesPasswort, user.passwordHash))) {
    return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(neuesPasswort, 10),
      tokenVersion: { increment: 1 },
    },
  })

  // Neues Cookie mit der neuen tokenVersion ausstellen, damit die aktuelle
  // Sitzung nicht sofort ausgeloggt wird — andere laufende Sessions dieses
  // Nutzers werden durch den tokenVersion-Sprung ungültig.
  const token = await signSession(updated.id, updated.tokenVersion)
  const res = NextResponse.json({ success: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return res
}
