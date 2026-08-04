import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verteilgebietDaten } from '@/lib/info-felder'
import { erfordereRolle } from '@/lib/info-auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = verteilgebietDaten(body)
  if (!daten.name) {
    return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
  }
  const gebiet = await prisma.infoVerteilgebiet.update({ where: { id: params.id }, data: daten })
  return NextResponse.json(gebiet)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'verwalten')
  if (verboten) return verboten

  await prisma.infoVerteilgebiet.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
