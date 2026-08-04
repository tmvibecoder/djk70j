import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Gesamter Verteilungs-Stand in einem Rutsch: Gebiete (mit Straßen) + Verteilerliste
export const dynamic = 'force-dynamic'

export async function GET() {
  const [gebiete, verteiler] = await Promise.all([
    prisma.infoVerteilgebiet.findMany({
      orderBy: { sortierung: 'asc' },
      include: { strassen: { orderBy: { sortierung: 'asc' } } },
    }),
    prisma.infoVerteiler.findMany({ orderBy: { sortierung: 'asc' } }),
  ])
  return NextResponse.json({ gebiete, verteiler })
}
