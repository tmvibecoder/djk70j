import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tuerDaten } from '@/lib/schluessel-felder'
import { erfordereRolle } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'schluessel', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = tuerDaten(body)
  if (!daten.name) {
    return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
  }
  const tuer = await prisma.schluesselTuer.update({ where: { id: params.id }, data: daten })
  return NextResponse.json(tuer)
}

// Löschen entfernt die Tür samt Matrix-Einträgen (Cascade)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'schluessel', 'bearbeiten')
  if (verboten) return verboten

  await prisma.schluesselTuer.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
