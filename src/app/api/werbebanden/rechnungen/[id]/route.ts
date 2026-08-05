import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rechnungDaten } from '@/lib/werbebanden-felder'
import { erfordereRolle } from '@/lib/session'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'werbebanden', 'lesen')
  if (verboten) return verboten

  const rechnung = await prisma.werbebandenRechnung.findUnique({
    where: { id: params.id },
    include: { partner: { select: { id: true, firma: true, rechnungsversand: true } } },
  })
  if (!rechnung) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(rechnung)
}

// Alle Snapshot-Felder sind nachträglich änderbar (bewusste Entscheidung);
// Nummer/Jahr/Laufnummer bleiben fest, damit der Nummernkreis konsistent bleibt.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'werbebanden', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = rechnungDaten(body)
  if (!daten.saison || !daten.firma) {
    return NextResponse.json({ error: 'Saison und Firma sind erforderlich' }, { status: 400 })
  }
  const rechnung = await prisma.werbebandenRechnung.update({
    where: { id: params.id },
    data: { ...daten, datum: daten.datum ?? undefined },
  })
  return NextResponse.json(rechnung)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'werbebanden', 'bearbeiten')
  if (verboten) return verboten

  await prisma.werbebandenRechnung.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
