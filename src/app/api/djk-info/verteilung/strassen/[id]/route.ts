import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { strasseDaten } from '@/lib/info-felder'
import { erfordereRolle } from '@/lib/info-auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = strasseDaten(body)
  if (!daten.name) {
    return NextResponse.json({ error: 'Straßenname ist erforderlich' }, { status: 400 })
  }
  const strasse = await prisma.infoStrasse.update({ where: { id: params.id }, data: daten })
  return NextResponse.json(strasse)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'verwalten')
  if (verboten) return verboten

  await prisma.infoStrasse.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
