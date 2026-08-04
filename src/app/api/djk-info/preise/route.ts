import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Preistabelle — lesbar für alle Rollen (die Kundenliste rechnet damit).
// Geändert werden die Preise über PUT /api/djk-info/einstellungen (nur Kassier).
// force-dynamic: sonst würde Next die Route beim Build statisch einfrieren.
export const dynamic = 'force-dynamic'

export async function GET() {
  const preise = await prisma.infoPreis.findMany({ orderBy: { sortierung: 'asc' } })
  return NextResponse.json(preise)
}
