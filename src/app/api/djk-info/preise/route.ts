import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'

// Preistabelle — lesbar für alle Rollen (die Kundenliste rechnet damit).
// Geändert werden die Preise über PUT /api/djk-info/einstellungen (nur verwalten).
// force-dynamic: sonst würde Next die Route beim Build statisch einfrieren.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'djk-info', 'lesen')
  if (verboten) return verboten

  const preise = await prisma.infoPreis.findMany({ orderBy: { sortierung: 'asc' } })
  return NextResponse.json(preise)
}
