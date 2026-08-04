// Startdaten für den DJK-Info-Bereich (/djk-info) — Vereinszeitschrift.
// Datenquellen: Abrechnungs-Excel 2025 (Kunden, Schaltungen, Rechnungen),
// Übersicht-Austragegebiete.docx (Gebiete + Straßen), Verteiler_202607.docx
// (Verteilerliste). Die Daten liegen in seed-djk-info-daten.ts.
//
// Idempotent (läuft gefahrlos bei jedem Deploy):
// - Einstellungen + Preise: upsert mit leerem update — Nutzeränderungen
//   werden nie überschrieben.
// - Ausgaben: upsert je (jahr, nummer) mit leerem update.
// - Kunden/Schaltungen/Rechnungen bzw. Verteilung: nur wenn die jeweilige
//   Tabelle noch leer ist.
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import { INFO_KUNDEN, INFO_GEBIETE, INFO_VERTEILER } from './seed-djk-info-daten'

const prisma = new PrismaClient()

// Briefkopf/Fußzeile aus der offiziellen Briefvorlage — identisch zum
// Werbebanden-Seed; wird nur gesetzt, solange die Felder leer sind.
const KOPF_KONTAKTBLOCK = `Kassier
Alexander Reisner
Mobil: +49 (151) 53 96 43 30
E-Mail: kassier@djk-ottenhofen.de`
const FUSSZEILE_1 = `DJK SG Ottenhofen e.V.
Herdweger Str. 4
85570 Ottenhofen
Tel.: +49 (81 21) 4 81 14 (Sportheim)
www.djk-ottenhofen.de | info@djk-ottenhofen.de`
const FUSSZEILE_2 = `Vereinsregister VR 110054
Amtsgericht München
Steuer Nr.: 114/107/80048
Finanzamt Erding
1. Vorsitzender Uwe Klempt`
const FUSSZEILE_3 = `Bankverbindungen
Sparkasse Erding - Dorfen
DE04 7005 1995 0000 3100 78 | BYLADEM1ERD
VR-Bank Erding eG
DE67 7016 9605 0007 4079 63 | GENODEF1ISE`

// Preistabelle aus Vertrag + Excel „Preise & Platzbedarf"
const PREISE = [
  { groesse: '1/1', bezeichnung: '1 Seite (130 × 180 mm)', jahresNetto: 290, sortierung: 1 },
  { groesse: '3/4', bezeichnung: '¾ Seite (130 × 137 mm)', jahresNetto: 230, sortierung: 2 },
  { groesse: '2/3', bezeichnung: '⅔ Seite (130 × 119 mm)', jahresNetto: 195, sortierung: 3 },
  { groesse: '1/2', bezeichnung: '½ Seite (130 × 87 mm)', jahresNetto: 155, sortierung: 4 },
  { groesse: '1/3', bezeichnung: '⅓ Seite (130 × 57 mm)', jahresNetto: 110, sortierung: 5 },
  { groesse: '1/4', bezeichnung: '¼ Seite (130 × 42 mm)', jahresNetto: 90, sortierung: 6 },
]

// Ausgaben: 2025 komplett erschienen (Basis der Excel-Abrechnung), 2026 geplant
const AUSGABEN = [
  { jahr: 2025, nummer: 1, status: 'erschienen' },
  { jahr: 2025, nummer: 2, status: 'erschienen' },
  { jahr: 2025, nummer: 3, status: 'erschienen' },
  { jahr: 2026, nummer: 1, status: 'geplant' },
  { jahr: 2026, nummer: 2, status: 'geplant' },
  { jahr: 2026, nummer: 3, status: 'geplant' },
]

function rund2(n: number): number {
  return Math.round(n * 100) / 100
}

async function main() {
  // 1. Einstellungen: nur anlegen, nie Nutzeränderungen überschreiben
  const einstellung = await prisma.infoEinstellung.upsert({
    where: { id: 'djk-info' },
    create: {
      id: 'djk-info',
      vereinsname: 'DJK SG Ottenhofen e.V.',
      kassierName: 'Alexander Reisner',
      absenderzeile: 'DJK SG Ottenhofen e.V. · Herdweger Str. 4 · 85570 Ottenhofen',
      zahlungszielTage: 14,
      mwstSatz: 19,
      ausgabenProJahr: 3,
      kopfKontaktblock: KOPF_KONTAKTBLOCK,
      fusszeileSpalte1: FUSSZEILE_1,
      fusszeileSpalte2: FUSSZEILE_2,
      fusszeileSpalte3: FUSSZEILE_3,
    },
    update: {},
  })

  // Nachrüstung für Bestands-Installationen: leere Pflichtfelder befüllen
  const nachruestung: Record<string, string> = {}
  if (!einstellung.kopfKontaktblock) nachruestung.kopfKontaktblock = KOPF_KONTAKTBLOCK
  if (!einstellung.fusszeileSpalte1) nachruestung.fusszeileSpalte1 = FUSSZEILE_1
  if (!einstellung.fusszeileSpalte2) nachruestung.fusszeileSpalte2 = FUSSZEILE_2
  if (!einstellung.fusszeileSpalte3) nachruestung.fusszeileSpalte3 = FUSSZEILE_3
  if (Object.keys(nachruestung).length > 0) {
    await prisma.infoEinstellung.update({ where: { id: 'djk-info' }, data: nachruestung })
    console.log(`DJK-Info-Seed: Einstellungs-Felder nachgerüstet (${Object.keys(nachruestung).join(', ')}).`)
  }

  // 2. Preistabelle (upsert je Größe, Nutzeränderungen bleiben)
  for (const p of PREISE) {
    await prisma.infoPreis.upsert({ where: { groesse: p.groesse }, create: p, update: {} })
  }

  // 3. Ausgaben
  for (const a of AUSGABEN) {
    await prisma.infoAusgabe.upsert({
      where: { jahr_nummer: { jahr: a.jahr, nummer: a.nummer } },
      create: { ...a, bezeichnung: `${a.jahr}-${a.nummer}` },
      update: {},
    })
  }

  // 4. Kunden + Schaltungen 2025 + Rechnungen — nur beim allerersten Lauf
  const vorhandeneKunden = await prisma.infoKunde.count()
  if (vorhandeneKunden > 0) {
    console.log(`DJK-Info-Seed: ${vorhandeneKunden} Kunden vorhanden — Kunden-Import übersprungen.`)
  } else {
    const ausgaben2025 = await prisma.infoAusgabe.findMany({ where: { jahr: 2025 }, orderBy: { nummer: 'asc' } })
    const preisJeGroesse = new Map(PREISE.map(p => [p.groesse, p.jahresNetto]))
    let schaltungen = 0
    let rechnungen = 0

    for (const k of INFO_KUNDEN) {
      const kunde = await prisma.infoKunde.create({
        data: {
          firma: k.firma,
          zusatz: k.zusatz ?? null,
          strasse: k.strasse ?? null,
          plz: k.plz ?? null,
          ort: k.ort ?? null,
          telefon: k.telefon ?? null,
          email: k.email ?? null,
          ansprechpartnerInhaber: k.ansprechpartner ?? null,
          rechnungsversand: 'post',
          broschuerenversand: k.broschuerenversand ?? 'persoenlich',
          anzeigenGroesse: k.groesse ?? k.schaltungen2025?.find(s => s) ?? '1/2',
          status: k.status ?? 'aktiv',
        },
      })

      // Schaltungen nur für aktive Kunden (die X-Spalten der Gekündigten
      // stammen aus deren letztem Jahr, nicht aus 2025)
      if ((k.status ?? 'aktiv') === 'aktiv' && k.schaltungen2025) {
        for (let i = 0; i < 3; i++) {
          const groesse = k.schaltungen2025[i]
          if (!groesse || !ausgaben2025[i]) continue
          await prisma.infoSchaltung.create({
            data: {
              kundeId: kunde.id,
              ausgabeId: ausgaben2025[i].id,
              groesse: groesse !== (k.groesse ?? groesse) ? groesse : null,
            },
          })
          schaltungen++
        }
      }

      // Historische Rechnung aus der Excel (Nummernkreis I)
      if (k.rechnungJahr && k.rechnungNr && k.rechnungNetto !== undefined) {
        const anzahl = k.schaltungen2025?.filter(Boolean).length ?? 3
        const netto = rund2(k.rechnungNetto)
        const mwst = rund2(netto * 0.19)
        await prisma.infoRechnung.create({
          data: {
            kundeId: kunde.id,
            leistungsjahr: k.rechnungJahr,
            jahr: k.rechnungJahr,
            laufnummer: k.rechnungNr,
            nummer: `${k.rechnungJahr}/I/${String(k.rechnungNr).padStart(4, '0')}`,
            firma: k.firma,
            zusatz: k.zusatz ?? null,
            ansprechpartner: k.ansprechpartner ?? null,
            strasse: k.strasse ?? null,
            plz: k.plz ?? null,
            ort: k.ort ?? null,
            anzeigenGroesse: k.groesse ?? '',
            jahresNetto: preisJeGroesse.get(k.groesse ?? '') ?? 0,
            anzahlAusgaben: anzahl,
            ausgabenListe: (k.schaltungen2025 ?? [])
              .map((s, i) => (s ? `${k.rechnungJahr}-${i + 1}` : null))
              .filter(Boolean)
              .join(', '),
            netto,
            mwstSatz: 19,
            mwst,
            brutto: rund2(netto + mwst),
            status: 'bezahlt',
          },
        })
        rechnungen++
      }
    }
    console.log(`DJK-Info-Seed: ${INFO_KUNDEN.length} Kunden, ${schaltungen} Schaltungen, ${rechnungen} Rechnungen angelegt.`)
  }

  // 5. Verteilung — nur beim allerersten Lauf
  const vorhandeneGebiete = await prisma.infoVerteilgebiet.count()
  if (vorhandeneGebiete > 0) {
    console.log(`DJK-Info-Seed: ${vorhandeneGebiete} Verteilbereiche vorhanden — Verteilungs-Import übersprungen.`)
  } else {
    let sortierung = 0
    for (const g of INFO_GEBIETE) {
      await prisma.infoVerteilgebiet.create({
        data: {
          name: g.name,
          kategorie: g.kategorie,
          beschreibung: g.beschreibung ?? null,
          hefte: g.hefte,
          sortierung: sortierung++,
          strassen: g.strassen
            ? { create: g.strassen.map((s, i) => ({ name: s.name, hefte: s.hefte, sortierung: i })) }
            : undefined,
        },
      })
    }
    for (let i = 0; i < INFO_VERTEILER.length; i++) {
      const v = INFO_VERTEILER[i]
      await prisma.infoVerteiler.create({
        data: { person: v.person, zustaendigkeit: v.zustaendigkeit, stueckzahl: v.stueckzahl, sortierung: i },
      })
    }
    console.log(`DJK-Info-Seed: ${INFO_GEBIETE.length} Verteilbereiche + ${INFO_VERTEILER.length} Verteiler angelegt.`)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
