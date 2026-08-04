import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rechnungDaten } from '@/lib/info-felder'
import { erfordereRolle } from '@/lib/info-auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const rechnung = await prisma.infoRechnung.findUnique({
    where: { id: params.id },
    include: { kunde: { select: { id: true, firma: true } } },
  })
  if (!rechnung) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(rechnung)
}

// Alle Snapshot-Felder sind nachträglich änderbar (bewusste Entscheidung);
// Nummer/Jahr/Laufnummer bleiben fest, damit der Nummernkreis konsistent bleibt.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = rechnungDaten(body)
  if (!daten.firma) {
    return NextResponse.json({ error: 'Firma ist erforderlich' }, { status: 400 })
  }
  const rechnung = await prisma.infoRechnung.update({
    where: { id: params.id },
    data: { ...daten, datum: daten.datum ?? undefined },
  })
  return NextResponse.json(rechnung)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'verwalten')
  if (verboten) return verboten

  await prisma.infoRechnung.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
