import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { erzeugeKassiererlistePdf } from '@/lib/dauerkarten-pdf'
import { ladeSaison } from '@/lib/dauerkarten-server'

// Liste für die Platzkassierer: nur bereits ausgegebene (quittierte) Karten,
// sortiert nach Nachname — damit am Eingang klar ist, wer eine Dauerkarte hat.
export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'lesen')
  if (verboten) return verboten

  const saison = await ladeSaison(req)
  if (!saison) return NextResponse.json({ error: 'Keine Saison vorhanden' }, { status: 404 })

  const karten = await prisma.dkKarte.findMany({
    where: { saisonId: saison.id, status: 'ausgegeben' },
    include: { inhaber: true },
  })
  const zeilen = karten
    .map(k => ({
      nachname: k.inhaber.nachname,
      vorname: k.inhaber.vorname,
      kartennummer: k.kartennummer || String(k.lfdNr).padStart(4, '0'),
    }))
    .sort((a, b) => a.nachname.localeCompare(b.nachname, 'de') || a.vorname.localeCompare(b.vorname, 'de'))

  const pdf = await erzeugeKassiererlistePdf(saison.bezeichnung, zeilen, new Date())
  const dateiname = `Platzkassierer-${saison.bezeichnung.replace(/\W/g, '-')}.pdf`
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${dateiname}"`,
      'Cache-Control': 'no-store',
    },
  })
}
