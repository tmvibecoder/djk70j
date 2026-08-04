import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verteilgebietDaten } from '@/lib/info-felder'
import { erfordereRolle } from '@/lib/session'

export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'djk-info', 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = verteilgebietDaten(body)
  if (!daten.name) {
    return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
  }
  const max = await prisma.infoVerteilgebiet.aggregate({ _max: { sortierung: true } })
  const gebiet = await prisma.infoVerteilgebiet.create({
    data: { ...daten, sortierung: (max._max.sortierung ?? 0) + 1 },
  })
  return NextResponse.json(gebiet, { status: 201 })
}
