import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tuerDaten } from '@/lib/schluessel-felder'
import { erfordereRolle } from '@/lib/session'

export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'schluessel', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = tuerDaten(body)
  if (!daten.name) {
    return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
  }
  // ohne explizite Sortierung ans Ende
  if (!daten.sortier) {
    const max = await prisma.schluesselTuer.aggregate({ _max: { sortier: true } })
    daten.sortier = (max._max.sortier ?? 0) + 1
  }
  const tuer = await prisma.schluesselTuer.create({ data: daten })
  return NextResponse.json(tuer, { status: 201 })
}
