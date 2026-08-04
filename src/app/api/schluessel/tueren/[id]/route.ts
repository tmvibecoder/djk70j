import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tuerDaten } from '@/lib/schluessel-felder'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}))
  const daten = tuerDaten(body)
  if (!daten.name) {
    return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
  }
  const tuer = await prisma.schluesselTuer.update({ where: { id: params.id }, data: daten })
  return NextResponse.json(tuer)
}

// Löschen entfernt die Tür samt Matrix-Einträgen (Cascade)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.schluesselTuer.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
