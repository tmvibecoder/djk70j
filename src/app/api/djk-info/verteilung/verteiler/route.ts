import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verteilerDaten } from '@/lib/info-felder'
import { erfordereRolle } from '@/lib/session'

export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'djk-info', 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = verteilerDaten(body)
  if (!daten.zustaendigkeit) {
    return NextResponse.json({ error: 'Zuständigkeit ist erforderlich' }, { status: 400 })
  }
  const max = await prisma.infoVerteiler.aggregate({ _max: { sortierung: true } })
  const verteiler = await prisma.infoVerteiler.create({
    data: { ...daten, sortierung: (max._max.sortierung ?? 0) + 1 },
  })
  return NextResponse.json(verteiler, { status: 201 })
}
