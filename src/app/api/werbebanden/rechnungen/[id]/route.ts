import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rechnungDaten } from '@/lib/werbebanden-felder'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const rechnung = await prisma.werbebandenRechnung.findUnique({
    where: { id: params.id },
    include: { partner: { select: { id: true, firma: true } } },
  })
  if (!rechnung) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(rechnung)
}

// Alle Snapshot-Felder sind nachträglich änderbar (bewusste Entscheidung);
// Nummer/Jahr/Laufnummer bleiben fest, damit der Nummernkreis konsistent bleibt.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
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

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.werbebandenRechnung.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
