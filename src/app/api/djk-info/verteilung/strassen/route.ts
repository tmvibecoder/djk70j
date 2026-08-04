import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { strasseDaten } from '@/lib/info-felder'
import { erfordereRolle } from '@/lib/info-auth'

export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const gebietId: string = typeof body.gebietId === 'string' ? body.gebietId : ''
  const daten = strasseDaten(body)
  if (!gebietId || !daten.name) {
    return NextResponse.json({ error: 'Gebiet und Straßenname sind erforderlich' }, { status: 400 })
  }
  const gebiet = await prisma.infoVerteilgebiet.findUnique({ where: { id: gebietId } })
  if (!gebiet) return NextResponse.json({ error: 'Gebiet nicht gefunden' }, { status: 404 })

  const max = await prisma.infoStrasse.aggregate({ where: { gebietId }, _max: { sortierung: true } })
  const strasse = await prisma.infoStrasse.create({
    data: { ...daten, gebietId, sortierung: (max._max.sortierung ?? 0) + 1 },
  })
  return NextResponse.json(strasse, { status: 201 })
}
