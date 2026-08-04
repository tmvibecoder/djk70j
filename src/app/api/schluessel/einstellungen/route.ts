import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { einstellungenDaten } from '@/lib/schluessel-felder'
import bcrypt from 'bcryptjs'

// Ohne force-dynamic würde Next die parameterlose GET-Route zur Build-Zeit
// ausführen und die Antwort statisch einfrieren
export const dynamic = 'force-dynamic'

// Der passwordHash verlässt den Server nie
function ohneHash<T extends { passwordHash: string }>(e: T): Omit<T, 'passwordHash'> {
  const rest: Record<string, unknown> = { ...e }
  delete rest.passwordHash
  return rest as Omit<T, 'passwordHash'>
}

export async function GET() {
  const einstellung = await prisma.schluesselEinstellung.upsert({
    where: { id: 'schluessel' },
    create: { id: 'schluessel' },
    update: {},
  })
  return NextResponse.json(ohneHash(einstellung))
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}))
  const daten: Record<string, unknown> = einstellungenDaten(body)

  const neuesPasswort = typeof body.neuesPasswort === 'string' ? body.neuesPasswort.trim() : ''
  if (neuesPasswort) {
    if (neuesPasswort.length < 6) {
      return NextResponse.json({ error: 'Passwort muss mindestens 6 Zeichen haben' }, { status: 400 })
    }
    daten.passwordHash = await bcrypt.hash(neuesPasswort, 10)
  }

  const einstellung = await prisma.schluesselEinstellung.upsert({
    where: { id: 'schluessel' },
    create: { id: 'schluessel', ...daten },
    update: daten,
  })
  return NextResponse.json(ohneHash(einstellung))
}
