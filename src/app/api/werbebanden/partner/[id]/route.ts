import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { partnerDaten } from '@/lib/werbebanden-felder'
import { loescheUpload } from '@/lib/uploads'
import { erfordereRolle } from '@/lib/session'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'werbebanden', 'lesen')
  if (verboten) return verboten

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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'werbebanden', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = partnerDaten(body)
  if (!daten.firma) {
    return NextResponse.json({ error: 'Firma ist erforderlich' }, { status: 400 })
  }
  const partner = await prisma.werbepartner.update({ where: { id: params.id }, data: daten })
  return NextResponse.json(partner)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'werbebanden', 'bearbeiten')
  if (verboten) return verboten

  // Dateien auch von der Platte löschen (DB-Zeilen fallen per Cascade)
  const dateien = await prisma.werbepartnerDatei.findMany({ where: { partnerId: params.id } })
  await prisma.werbepartner.delete({ where: { id: params.id } })
  for (const d of dateien) {
    await loescheUpload(d.pfad)
  }
  return NextResponse.json({ ok: true })
}
