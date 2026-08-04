import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { einstellungenDaten } from '@/lib/schluessel-felder'
import { erfordereRolle } from '@/lib/session'

// Ohne force-dynamic würde Next die parameterlose GET-Route zur Build-Zeit
// ausführen und die Antwort statisch einfrieren
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'schluessel', 'verwalten')
  if (verboten) return verboten

  const einstellung = await prisma.schluesselEinstellung.upsert({
    where: { id: 'schluessel' },
    create: { id: 'schluessel' },
    update: {},
  })
  return NextResponse.json(einstellung)
}

export async function PUT(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'schluessel', 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten: Record<string, unknown> = einstellungenDaten(body)

  const einstellung = await prisma.schluesselEinstellung.upsert({
    where: { id: 'schluessel' },
    create: { id: 'schluessel', ...daten },
    update: daten,
  })
  return NextResponse.json(einstellung)
}
