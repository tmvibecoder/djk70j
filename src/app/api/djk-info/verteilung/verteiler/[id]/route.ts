import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verteilerDaten } from '@/lib/info-felder'
import { erfordereRolle } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'djk-info', 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = verteilerDaten(body)
  if (!daten.zustaendigkeit) {
    return NextResponse.json({ error: 'Zuständigkeit ist erforderlich' }, { status: 400 })
  }
  const verteiler = await prisma.infoVerteiler.update({ where: { id: params.id }, data: daten })
  return NextResponse.json(verteiler)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'djk-info', 'verwalten')
  if (verboten) return verboten

  await prisma.infoVerteiler.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
