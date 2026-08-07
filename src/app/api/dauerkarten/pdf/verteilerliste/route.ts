import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { erzeugeVerteilerlistePdf } from '@/lib/dauerkarten-pdf'
import { ladeSaison } from '@/lib/dauerkarten-server'

// Ausgabeliste je Verteiler (?verteiler=Raacke&saison=<id>): Kartennummer,
// Name, Preis + Unterschriftenfeld — für die Ausgabe ohne das Tool. Bereits
// quittierte Karten sind entsprechend vermerkt.
export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'lesen')
  if (verboten) return verboten

  const verteiler = req.nextUrl.searchParams.get('verteiler')?.trim()
  if (!verteiler) return NextResponse.json({ error: 'Parameter verteiler fehlt' }, { status: 400 })

  const saison = await ladeSaison(req)
  if (!saison) return NextResponse.json({ error: 'Keine Saison vorhanden' }, { status: 404 })

  const karten = await prisma.dkKarte.findMany({
    where: { saisonId: saison.id, verteiler, kategorie: { not: 'druck' } },
    include: { inhaber: true },
    orderBy: { lfdNr: 'asc' },
  })

  const pdf = await erzeugeVerteilerlistePdf(
    verteiler,
    saison.bezeichnung,
    karten.map(k => ({
      kartennummer: k.kartennummer || String(k.lfdNr).padStart(4, '0'),
      vorname: k.inhaber.vorname,
      nachname: k.inhaber.nachname,
      preis: k.preis,
      quittiert:
        k.status !== 'ausgegeben' ? ''
        : k.ohneSignatur ? 'ausgegeben (Papier)'
        : 'elektronisch quittiert',
    })),
    new Date(),
  )

  const dateiname = `Ausgabeliste-${verteiler.replace(/\W/g, '-')}-${saison.bezeichnung.replace(/\W/g, '-')}.pdf`
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${dateiname}"`,
      'Cache-Control': 'no-store',
    },
  })
}
