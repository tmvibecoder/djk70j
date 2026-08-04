import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { kundeDaten } from '@/lib/info-felder'
import { erfordereRolle } from '@/lib/session'
import { loescheUpload } from '@/lib/uploads'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'djk-info', 'lesen')
  if (verboten) return verboten

  const kunde = await prisma.infoKunde.findUnique({
    where: { id: params.id },
    include: {
      dateien: { orderBy: { createdAt: 'desc' } },
      rechnungen: { orderBy: [{ jahr: 'desc' }, { laufnummer: 'desc' }] },
      schaltungen: {
        include: { ausgabe: { select: { id: true, bezeichnung: true, jahr: true, nummer: true } } },
        orderBy: { ausgabe: { bezeichnung: 'desc' } },
      },
    },
  })
  if (!kunde) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(kunde)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'djk-info', 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = kundeDaten(body)
  if (!daten.firma) {
    return NextResponse.json({ error: 'Firma ist erforderlich' }, { status: 400 })
  }
  const kunde = await prisma.infoKunde.update({ where: { id: params.id }, data: daten })
  return NextResponse.json(kunde)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'djk-info', 'verwalten')
  if (verboten) return verboten

  // Dateien auch von der Platte löschen (DB-Zeilen fallen per Cascade)
  const dateien = await prisma.infoDatei.findMany({ where: { kundeId: params.id } })
  await prisma.infoKunde.delete({ where: { id: params.id } })
  for (const d of dateien) {
    await loescheUpload(d.pfad, 'djk-info')
  }
  return NextResponse.json({ ok: true })
}
