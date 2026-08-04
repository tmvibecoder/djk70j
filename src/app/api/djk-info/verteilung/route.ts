import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'

// Gesamter Verteilungs-Stand in einem Rutsch: Gebiete (mit Straßen) + Verteilerliste
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'djk-info', 'lesen')
  if (verboten) return verboten

  const [gebiete, verteiler] = await Promise.all([
    prisma.infoVerteilgebiet.findMany({
      orderBy: { sortierung: 'asc' },
      include: { strassen: { orderBy: { sortierung: 'asc' } } },
    }),
    prisma.infoVerteiler.findMany({ orderBy: { sortierung: 'asc' } }),
  ])
  return NextResponse.json({ gebiete, verteiler })
}
