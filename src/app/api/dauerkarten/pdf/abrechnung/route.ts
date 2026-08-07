import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { berechneAbrechnung } from '@/lib/dauerkarten-abrechnung'
import { erzeugeAbrechnungPdf } from '@/lib/dauerkarten-pdf'
import { ladeSaison } from '@/lib/dauerkarten-server'

// Abrechnungs-PDF — identische Zahlen wie der Abrechnungs-Tab (gemeinsame
// Rechenfunktion in lib/dauerkarten-abrechnung.ts)
export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'lesen')
  if (verboten) return verboten

  const saison = await ladeSaison(req)
  if (!saison) return NextResponse.json({ error: 'Keine Saison vorhanden' }, { status: 404 })

  const [karten, einzahlungen] = await Promise.all([
    prisma.dkKarte.findMany({ where: { saisonId: saison.id } }),
    prisma.dkEinzahlung.findMany({ where: { saisonId: saison.id }, orderBy: { datum: 'asc' } }),
  ])
  const pdf = await erzeugeAbrechnungPdf(berechneAbrechnung(saison, karten, einzahlungen), new Date())

  const dateiname = `Dauerkarten-Abrechnung-${saison.bezeichnung.replace(/\W/g, '-')}.pdf`
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${dateiname}"`,
      'Cache-Control': 'no-store',
    },
  })
}
