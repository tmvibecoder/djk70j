import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereAdmin } from '@/lib/session'
import bcrypt from 'bcryptjs'

// Setzt ein neues Passwort ohne Kenntnis des alten (Admin-Reset) und erhöht
// tokenVersion — loggt den Nutzer damit auf allen Geräten aus.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereAdmin(req)
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const neuesPasswort: string = typeof body.neuesPasswort === 'string' ? body.neuesPasswort.trim() : ''
  if (neuesPasswort.length < 6) {
    return NextResponse.json({ error: 'Passwort muss mindestens 6 Zeichen haben' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { passwordHash: await bcrypt.hash(neuesPasswort, 10), tokenVersion: { increment: 1 } },
  })
  return NextResponse.json({ success: true })
}
