import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereAdmin } from '@/lib/session'
import bcrypt from 'bcryptjs'

// Ohne force-dynamic würde Next die parameterlose GET-Route zur Build-Zeit
// ausführen und die Antwort statisch einfrieren
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const verboten = await erfordereAdmin(req)
  if (verboten) return verboten

  const nutzer = await prisma.user.findMany({
    where: { username: { not: null } },
    include: { bereichsRollen: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(
    nutzer.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      istAdmin: u.istAdmin,
      aktiv: u.aktiv,
      rollen: Object.fromEntries(u.bereichsRollen.map(r => [r.bereich, r.rolle])),
    })),
  )
}

export async function POST(req: NextRequest) {
  const verboten = await erfordereAdmin(req)
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const name: string = typeof body.name === 'string' ? body.name.trim() : ''
  const username: string = typeof body.username === 'string' ? body.username.trim() : ''
  const password: string = typeof body.password === 'string' ? body.password : ''
  const istAdmin: boolean = body.istAdmin === true

  if (!name || !username || !password) {
    return NextResponse.json({ error: 'Name, Benutzername und Passwort erforderlich' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Passwort muss mindestens 6 Zeichen haben' }, { status: 400 })
  }
  if (await prisma.user.findUnique({ where: { username } })) {
    return NextResponse.json({ error: 'Benutzername ist bereits vergeben' }, { status: 409 })
  }

  const user = await prisma.user.create({
    data: { name, username, istAdmin, passwordHash: await bcrypt.hash(password, 10) },
  })
  return NextResponse.json({ id: user.id }, { status: 201 })
}
