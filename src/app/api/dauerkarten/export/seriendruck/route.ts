import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { exportName } from '@/lib/dauerkarten-felder'
import { ladeSaison } from '@/lib/dauerkarten-server'

// CSV-Export für den Karten-Seriendruck (Hiti CS200e): Kartennummer,
// Vorname, Nachname, Preis — Namen BEWUSST in GROSSBUCHSTABEN (Aufdruck).
// Semikolon + UTF-8-BOM, damit deutsches Excel die Datei direkt öffnet.
// URL ohne Dateiendung (Middleware-Matcher); Dateiname via Content-Disposition.
export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'lesen')
  if (verboten) return verboten

  const saison = await ladeSaison(req)
  if (!saison) return NextResponse.json({ error: 'Keine Saison vorhanden' }, { status: 404 })

  const karten = await prisma.dkKarte.findMany({
    where: { saisonId: saison.id },
    include: { inhaber: true },
    orderBy: { lfdNr: 'asc' },
  })

  const feld = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const preisText = (k: (typeof karten)[number]) =>
    k.kategorie === 'druck' ? '' : `${k.preis.toLocaleString('de-DE', { minimumFractionDigits: 0 })} €`

  const zeilen = ['Kartennummer;Vorname;Nachname;Preis']
  for (const k of karten) {
    const name = exportName(k.inhaber.vorname, k.inhaber.nachname)
    zeilen.push(
      [k.kartennummer || String(k.lfdNr).padStart(4, '0'), name.vorname, name.nachname, preisText(k)]
        .map(feld)
        .join(';'),
    )
  }
  const csv = `﻿${zeilen.join('\r\n')}\r\n`

  const dateiname = `Dauerkarten-Seriendruck-${saison.bezeichnung.replace(/\W/g, '-')}.csv`
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${dateiname}"`,
      'Cache-Control': 'no-store',
    },
  })
}
