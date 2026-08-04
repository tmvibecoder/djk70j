import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { einstellungenDaten } from '@/lib/info-felder'
import { erfordereRolle } from '@/lib/session'
import { GROESSEN_REIHENFOLGE } from '@/data/djk-info'

// Ohne force-dynamic würde Next die parameterlose GET-Route zur Build-Zeit
// ausführen und die Antwort statisch einfrieren
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'djk-info', 'verwalten')
  if (verboten) return verboten

  const einstellung = await prisma.infoEinstellung.upsert({
    where: { id: 'djk-info' },
    create: { id: 'djk-info' },
    update: {},
  })
  return NextResponse.json(einstellung)
}

export async function PUT(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'djk-info', 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten: Record<string, unknown> = einstellungenDaten(body)

  const einstellung = await prisma.infoEinstellung.upsert({
    where: { id: 'djk-info' },
    create: { id: 'djk-info', ...daten },
    update: daten,
  })

  // Preistabelle (Jahrespreise netto je Größe) im selben Speichervorgang
  if (Array.isArray(body.preise)) {
    for (const p of body.preise) {
      if (typeof p?.groesse !== 'string' || !(GROESSEN_REIHENFOLGE as readonly string[]).includes(p.groesse)) continue
      const netto = typeof p.jahresNetto === 'number' ? p.jahresNetto : parseFloat(String(p.jahresNetto ?? '').replace(',', '.'))
      if (!Number.isFinite(netto) || netto < 0) continue
      await prisma.infoPreis.update({
        where: { groesse: p.groesse },
        data: { jahresNetto: Math.round(netto * 100) / 100 },
      })
    }
  }

  return NextResponse.json(einstellung)
}
