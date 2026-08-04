import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatRechnungsnummer, naechsteLaufnummer } from '@/lib/rechnungsnummer'
import { erfordereRolle } from '@/lib/session'

// Rechnungslauf: erzeugt für die gewählten Partner je eine Rechnung der
// Saison als Snapshot der aktuellen Partnerdaten. Beträge werden serverseitig
// berechnet (Netto = lfd. Meter × Preis/Meter, MwSt darauf) — danach sind
// alle Felder über die Bearbeiten-Seite frei änderbar.
export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'werbebanden', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const saison: string = typeof body.saison === 'string' ? body.saison.trim() : ''
  const jahr: number = Number.isInteger(body.jahr) ? body.jahr : new Date().getFullYear()
  const partnerIds: string[] = Array.isArray(body.partnerIds) ? body.partnerIds.filter((x: unknown) => typeof x === 'string') : []

  if (!/^\d{4}\/\d{4}$/.test(saison)) {
    return NextResponse.json({ error: 'Saison im Format 2025/2026 erforderlich' }, { status: 400 })
  }
  if (partnerIds.length === 0) {
    return NextResponse.json({ error: 'Keine Partner ausgewählt' }, { status: 400 })
  }

  const einstellung = await prisma.werbebandenEinstellung.upsert({
    where: { id: 'werbebanden' },
    create: { id: 'werbebanden' },
    update: {},
  })
  const partner = await prisma.werbepartner.findMany({ where: { id: { in: partnerIds } } })

  // Doppelte Läufe verhindern: Partner, die für diese Saison schon eine
  // Rechnung haben, werden übersprungen (statt still doppelt zu berechnen)
  const vorhandene = await prisma.werbebandenRechnung.findMany({
    where: { saison, partnerId: { in: partnerIds } },
    select: { partnerId: true },
  })
  const schonBerechnet = new Set(vorhandene.map(r => r.partnerId))

  const angelegt: string[] = []
  const uebersprungen: string[] = []

  for (const p of partner) {
    if (schonBerechnet.has(p.id)) {
      uebersprungen.push(p.firma)
      continue
    }
    const netto = Math.round(p.berechneteLaenge * p.preisProMeter * 100) / 100
    const mwst = Math.round(netto * einstellung.mwstSatz) / 100
    const rechnung = await prisma.$transaction(async tx => {
      const laufnummer = await naechsteLaufnummer(tx, jahr)
      return tx.werbebandenRechnung.create({
        data: {
          partnerId: p.id,
          saison,
          jahr,
          laufnummer,
          nummer: formatRechnungsnummer(jahr, laufnummer),
          datum: new Date(),
          firma: p.firma,
          ansprechpartner: p.ansprechpartnerRechnung ?? p.ansprechpartner,
          strasse: p.strasse,
          plz: p.plz,
          ort: p.ort,
          laenge: p.berechneteLaenge,
          preisProMeter: p.preisProMeter,
          netto,
          mwstSatz: einstellung.mwstSatz,
          mwst,
          brutto: Math.round((netto + mwst) * 100) / 100,
          zahlungszielTage: einstellung.zahlungszielTage,
        },
      })
    })
    angelegt.push(rechnung.nummer)
  }

  return NextResponse.json({ angelegt, uebersprungen })
}
