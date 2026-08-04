import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { einstellungenDaten } from '@/lib/werbebanden-felder'
import { erfordereRolle } from '@/lib/session'

// Ohne force-dynamic würde Next die parameterlose GET-Route zur Build-Zeit
// ausführen und die Antwort statisch einfrieren
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'werbebanden', 'verwalten')
  if (verboten) return verboten

  const einstellung = await prisma.werbebandenEinstellung.upsert({
    where: { id: 'werbebanden' },
    create: { id: 'werbebanden' },
    update: {},
  })
  return NextResponse.json(einstellung)
}

export async function PUT(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'werbebanden', 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten: Record<string, unknown> = einstellungenDaten(body)

  const einstellung = await prisma.werbebandenEinstellung.upsert({
    where: { id: 'werbebanden' },
    create: { id: 'werbebanden', ...daten },
    update: daten,
  })
  return NextResponse.json(einstellung)
}
