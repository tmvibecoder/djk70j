import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { inhaberDaten } from '@/lib/dauerkarten-felder'

export const dynamic = 'force-dynamic'

// Inhaberliste (für Auswahl beim Karten-Anlegen), alphabetisch
export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'lesen')
  if (verboten) return verboten

  const inhaber = await prisma.dkInhaber.findMany({
    orderBy: [{ nachname: 'asc' }, { vorname: 'asc' }],
    include: { _count: { select: { karten: true } } },
  })
  return NextResponse.json(inhaber)
}

export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = inhaberDaten(body)
  if (!daten.vorname || !daten.nachname) {
    return NextResponse.json({ error: 'Vor- und Nachname sind erforderlich' }, { status: 400 })
  }
  const inhaber = await prisma.dkInhaber.create({ data: daten })
  return NextResponse.json(inhaber, { status: 201 })
}
