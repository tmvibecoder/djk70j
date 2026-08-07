import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { saisonDaten } from '@/lib/dauerkarten-felder'

export const dynamic = 'force-dynamic'

// Saisonliste (neueste zuerst) inkl. Kartenzahl für die Saison-Auswahl
export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'lesen')
  if (verboten) return verboten

  const saisons = await prisma.dkSaison.findMany({
    orderBy: { bezeichnung: 'desc' },
    include: { _count: { select: { karten: true } } },
  })
  return NextResponse.json(saisons)
}

// Neue Saison anlegen. Mit uebernehmenVon=<saisonId> werden alle Karten der
// Vorsaison für Inhaber OHNE „keine Karte mehr"-Haken kopiert (lfd. Nummer,
// Kartennummer, Kategorie, Verteiler bleiben; Preis kommt aus den neuen
// Saisonpreisen; Zahlung/Ausgabe starten leer).
export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = saisonDaten(body)
  if (!daten.bezeichnung) {
    return NextResponse.json({ error: 'Bezeichnung ist erforderlich (z.B. 2027/28)' }, { status: 400 })
  }
  const vorhanden = await prisma.dkSaison.findUnique({ where: { bezeichnung: daten.bezeichnung } })
  if (vorhanden) {
    return NextResponse.json({ error: 'Diese Saison existiert bereits' }, { status: 409 })
  }

  const uebernehmenVon = typeof body.uebernehmenVon === 'string' ? body.uebernehmenVon : null

  const saison = await prisma.$transaction(async tx => {
    // Neue Saison wird die aktive
    await tx.dkSaison.updateMany({ data: { aktiv: false } })
    const neu = await tx.dkSaison.create({ data: { ...daten, aktiv: true } })

    if (uebernehmenVon) {
      const alteKarten = await tx.dkKarte.findMany({
        where: { saisonId: uebernehmenVon, inhaber: { keineKarteMehr: false } },
        include: { inhaber: true },
        orderBy: { lfdNr: 'asc' },
      })
      for (const k of alteKarten) {
        const preis =
          k.kategorie === 'druck' ? 0
          : k.kategorie === 'ermaessigt' ? neu.preisErmaessigt
          : neu.preisNormal
        await tx.dkKarte.create({
          data: {
            saisonId: neu.id,
            inhaberId: k.inhaberId,
            lfdNr: k.lfdNr,
            kartennummer: k.kartennummer,
            kategorie: k.kategorie,
            preis,
            verteiler: k.verteiler,
          },
        })
      }
    }
    return neu
  })
  return NextResponse.json(saison, { status: 201 })
}
