import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/info-auth'
import { formatRechnungsnummer, naechsteInfoLaufnummer } from '@/lib/rechnungsnummer'
import { anteiligerNetto, rund2 } from '@/data/djk-info'

// Jahres-Rechnungslauf: erzeugt für die gewählten Kunden je eine Rechnung
// des Leistungsjahres als Snapshot der aktuellen Kundendaten. Der Betrag
// richtet sich nach den Schaltungen: netto = round(jahresNetto × n ÷ 3) —
// bewusst NICHT gerundeter Einzelpreis × n (290 ÷ 3 → 96,67 × 3 = 290,01).
export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const leistungsjahr: number = Number.isInteger(body.leistungsjahr) ? body.leistungsjahr : new Date().getFullYear()
  const jahr: number = Number.isInteger(body.jahr) ? body.jahr : leistungsjahr
  const kundenIds: string[] = Array.isArray(body.kundenIds) ? body.kundenIds.filter((x: unknown) => typeof x === 'string') : []

  if (kundenIds.length === 0) {
    return NextResponse.json({ error: 'Keine Kunden ausgewählt' }, { status: 400 })
  }

  const einstellung = await prisma.infoEinstellung.upsert({
    where: { id: 'djk-info' },
    create: { id: 'djk-info' },
    update: {},
  })
  const preise = await prisma.infoPreis.findMany()
  const preisJeGroesse = new Map(preise.map(p => [p.groesse, p.jahresNetto]))

  const kunden = await prisma.infoKunde.findMany({
    where: { id: { in: kundenIds } },
    include: { schaltungen: { where: { ausgabe: { jahr: leistungsjahr } }, include: { ausgabe: true } } },
  })

  // Doppelte Läufe verhindern: Kunden mit Rechnung fürs Leistungsjahr überspringen
  const vorhandene = await prisma.infoRechnung.findMany({
    where: { leistungsjahr, kundeId: { in: kundenIds } },
    select: { kundeId: true },
  })
  const schonBerechnet = new Set(vorhandene.map(r => r.kundeId))

  const angelegt: string[] = []
  const uebersprungen: string[] = []

  for (const k of kunden) {
    if (schonBerechnet.has(k.id)) {
      uebersprungen.push(k.firma)
      continue
    }
    const anzahl = k.schaltungen.length
    const jahresNetto = preisJeGroesse.get(k.anzeigenGroesse) ?? 0
    const netto = anteiligerNetto(jahresNetto, anzahl, einstellung.ausgabenProJahr)
    const mwst = rund2((netto * einstellung.mwstSatz) / 100)
    const rechnung = await prisma.$transaction(async tx => {
      const laufnummer = await naechsteInfoLaufnummer(tx, jahr)
      return tx.infoRechnung.create({
        data: {
          kundeId: k.id,
          leistungsjahr,
          jahr,
          laufnummer,
          nummer: formatRechnungsnummer(jahr, laufnummer, 'I'),
          datum: new Date(),
          firma: k.firma,
          zusatz: k.zusatz,
          ansprechpartner: k.ansprechpartnerRechnung ?? k.ansprechpartnerInhaber,
          strasse: k.strasse,
          plz: k.plz,
          ort: k.ort,
          anzeigenGroesse: k.anzeigenGroesse,
          jahresNetto,
          anzahlAusgaben: anzahl,
          ausgabenListe: k.schaltungen
            .map(s => s.ausgabe.bezeichnung)
            .sort()
            .join(', '),
          netto,
          mwstSatz: einstellung.mwstSatz,
          mwst,
          brutto: rund2(netto + mwst),
          zahlungszielTage: einstellung.zahlungszielTage,
        },
      })
    })
    angelegt.push(rechnung.nummer)
  }

  return NextResponse.json({ angelegt, uebersprungen })
}
