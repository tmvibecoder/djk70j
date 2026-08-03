import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { partnerDaten } from '@/lib/werbebanden-felder'
import { loescheUpload } from '@/lib/uploads'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const partner = await prisma.werbepartner.findUnique({
    where: { id: params.id },
    include: {
      dateien: { orderBy: { createdAt: 'desc' } },
      rechnungen: { orderBy: [{ jahr: 'desc' }, { laufnummer: 'desc' }] },
    },
  })
  if (!partner) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(partner)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}))
  const daten = partnerDaten(body)
  if (!daten.firma) {
    return NextResponse.json({ error: 'Firma ist erforderlich' }, { status: 400 })
  }
  const partner = await prisma.werbepartner.update({ where: { id: params.id }, data: daten })
  return NextResponse.json(partner)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  // Dateien auch von der Platte löschen (DB-Zeilen fallen per Cascade)
  const dateien = await prisma.werbepartnerDatei.findMany({ where: { partnerId: params.id } })
  await prisma.werbepartner.delete({ where: { id: params.id } })
  for (const d of dateien) {
    await loescheUpload(d.pfad)
  }
  return NextResponse.json({ ok: true })
}
