import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { berechneAbrechnung } from '@/lib/dauerkarten-abrechnung'
import { ladeSaison } from '@/lib/dauerkarten-server'

export const dynamic = 'force-dynamic'

// Abrechnungs-JSON (?saison=<id>, sonst aktive Saison) — dieselbe
// Rechenfunktion wie die Abrechnungs-PDF (lib/dauerkarten-abrechnung.ts)
export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'lesen')
  if (verboten) return verboten

  const saison = await ladeSaison(req)
  if (!saison) return NextResponse.json({ error: 'Keine Saison vorhanden' }, { status: 404 })

  const [karten, einzahlungen] = await Promise.all([
    prisma.dkKarte.findMany({ where: { saisonId: saison.id } }),
    prisma.dkEinzahlung.findMany({ where: { saisonId: saison.id }, orderBy: { datum: 'asc' } }),
  ])
  return NextResponse.json(berechneAbrechnung(saison, karten, einzahlungen))
}
