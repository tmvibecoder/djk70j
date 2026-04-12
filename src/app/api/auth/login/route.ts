import { prisma } from '@/lib/prisma'
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const username: string | undefined = body.username?.trim()
  const password: string | undefined = body.password

  if (!username || !password) {
    return NextResponse.json({ error: 'Benutzername und Passwort erforderlich' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Login fehlgeschlagen' }, { status: 401 })
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'Login fehlgeschlagen' }, { status: 401 })
  }

  const token = await signSession(user.id)
  const res = NextResponse.json({ id: user.id, name: user.name, username: user.username, role: user.role })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return res
}
