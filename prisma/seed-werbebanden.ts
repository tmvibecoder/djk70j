// Startdaten für den Werbebanden-Bereich, übernommen aus der Excel
// „Abrechnung DJK Bandenwerbung 2026" (Stand August 2026):
// - Einstellungen (Singleton) — upsert mit leerem update, damit spätere
//   Änderungen des Nutzers nie überschrieben werden
// - 18 aktive Partner (+ 1 Interessent) mit Platz-Zuordnung aus dem Blatt „Neu"
// - Gekündigt-Historie
// - die 15 Rechnungen der Saison 2025/2026 (Nummernkreis 2026/B/0001 ff.)
//
// Idempotent: Existieren bereits Partner, wird nur die Einstellung geprüft —
// dadurch kann das Skript gefahrlos bei jedem Deploy laufen.
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

interface PartnerSeed {
  firma: string
  ansprechpartner?: string
  strasse?: string
  plz?: string
  ort?: string
  telefon?: string
  email?: string
  istLaenge?: number
  berechneteLaenge?: number
  preisProMeter?: number
  vertragsbeginn?: string // YYYY-MM-DD
  bandeErneuert?: number
  abschnitt?: number
  positionNr?: number
  status?: string
  bemerkung?: string
  // Rechnung der Saison 2025/2026 (Nummernkreis 2026): laufende Nummer
  rechnung2026?: number
}

const PARTNER: PartnerSeed[] = [
  // ── Abschnitt 1: bis zur 1. Spielerbank (34 m) ──
  { firma: 'KFZ-Technik & Service', ansprechpartner: 'Siegfried Heuwieser', strasse: 'Perusastr. 2', plz: '85570', ort: 'Ottenhofen', telefon: '08121/924955', email: 'info@kfz-heuwieser.de', istLaenge: 4, berechneteLaenge: 4, preisProMeter: 40, vertragsbeginn: '2022-07-01', bandeErneuert: 2022, abschnitt: 1, positionNr: 1, rechnung2026: 1 },
  { firma: 'Ingenieurbüro Liegl & Popp GmbH', ansprechpartner: 'Sebastian Liegl', strasse: 'Hauptstr. 39', plz: '85457', ort: 'Wifling', telefon: '08121/995579-0', email: 'info@ib-liegl-popp.de', istLaenge: 5, berechneteLaenge: 5, preisProMeter: 40, vertragsbeginn: '2023-10-28', bandeErneuert: 2023, abschnitt: 1, positionNr: 2, rechnung2026: 2 },
  { firma: 'Bayern Fanclub Mia san mia Ottenhofen', ansprechpartner: 'Andreas Lippacher', strasse: 'Schwilacher Str. 5', plz: '85570', ort: 'Ottenhofen', telefon: '0170/8655103', email: 'info@miasanmia-ottenhofen.de', istLaenge: 4.5, berechneteLaenge: 4.5, preisProMeter: 0, vertragsbeginn: '2022-07-01', bandeErneuert: 2022, abschnitt: 1, positionNr: 3, bemerkung: 'Gratisbande' },
  { firma: 'TRENKER GmbH', ansprechpartner: 'Helmut Baysel', strasse: 'Carl-Zeiss-Str. 4', plz: '85748', ort: 'Garching bei München', telefon: '089/326743-27', email: 'baysel@trenker-kaelte.de', istLaenge: 5, berechneteLaenge: 5, preisProMeter: 40, vertragsbeginn: '2023-10-28', bandeErneuert: 2023, abschnitt: 1, positionNr: 4, rechnung2026: 4 },
  { firma: 'VR-Bank Erding eG', ansprechpartner: 'Sabine Knust', strasse: 'Zollnerstr. 4', plz: '85435', ort: 'Erding', telefon: '08122/200-1213', email: 'sabine.knust@vr-bank-erding.de', istLaenge: 5, berechneteLaenge: 5, preisProMeter: 40, bandeErneuert: 2023, abschnitt: 1, positionNr: 5, rechnung2026: 13 },
  { firma: 'Projektgesellschaft Stephan Metz Muffatstraße 5 GmbH & Co. KG', ansprechpartner: 'Stephan Metz', strasse: 'Stolzhofstr. 7', plz: '81825', ort: 'München', telefon: '089/7244819-0', email: 'info@u20.de', istLaenge: 5, berechneteLaenge: 5, preisProMeter: 40, vertragsbeginn: '2023-06-03', bandeErneuert: 2023, abschnitt: 1, positionNr: 6, rechnung2026: 5 },
  { firma: 'Privatbrauerei Schweiger GmbH & Co KG', strasse: 'Ebersberger Str. 25', plz: '85570', ort: 'Markt Schwaben', telefon: '08121/929-0', email: 'info@schweiger-bier.de', istLaenge: 5, berechneteLaenge: 5, preisProMeter: 40, bandeErneuert: 2022, abschnitt: 1, positionNr: 7, rechnung2026: 6 },
  { firma: 'Logo DJK', strasse: 'Herdweger Str. 4', plz: '85570', ort: 'Ottenhofen', email: 'info@djk-ottenhofen.de', istLaenge: 0.5, berechneteLaenge: 0.5, preisProMeter: 0, bandeErneuert: 2023, abschnitt: 1, positionNr: 8, bemerkung: 'Vereinseigenes Logo' },

  // ── Abschnitt 2: zwischen den Spielerbänken (26,88 m) ──
  { firma: 'Logo DJK', strasse: 'Herdweger Str. 4', plz: '85570', ort: 'Ottenhofen', email: 'info@djk-ottenhofen.de', istLaenge: 0.5, berechneteLaenge: 0.5, preisProMeter: 0, bandeErneuert: 2023, abschnitt: 2, positionNr: 1, bemerkung: 'Vereinseigenes Logo' },
  { firma: 'Metzgerei Gantner GmbH', ansprechpartner: 'Philipp Gantner', strasse: 'Hauptstraße 47', plz: '85457', ort: 'Wifling', telefon: '08121/40085', email: 'philipp@wurstschmied.de', istLaenge: 5, berechneteLaenge: 5, preisProMeter: 40, abschnitt: 2, positionNr: 2, status: 'gekuendigt', bemerkung: 'Gekündigt — zuletzt Saison 2024/2025 berechnet; Bande hing in Abschnitt 2' },
  { firma: 'Reiser GbR', ansprechpartner: 'Martin Reiser', strasse: 'Am Vogelherd 5', plz: '85570', ort: 'Ottenhofen-Herdweg', telefon: '08121/48386', email: 'martin.reiser@live.de', istLaenge: 3, berechneteLaenge: 3, preisProMeter: 40, abschnitt: 2, positionNr: 3, rechnung2026: 8 },
  { firma: "Miro's Haus- und Gebäudeservice", ansprechpartner: 'Miroslav Filipovic', strasse: 'Von-Kobell-Str. 3', plz: '85570', ort: 'Markt Schwaben', telefon: '0174/9893177', istLaenge: 4.4, berechneteLaenge: 4, preisProMeter: 40, vertragsbeginn: '2025-07-01', bandeErneuert: 2025, abschnitt: 2, positionNr: 4, rechnung2026: 7 },
  { firma: 'TS Teamwear GbR', ansprechpartner: 'Bernhard Schuster', strasse: 'Dorfstraße 2b', plz: '85461', ort: 'Bockhorn', telefon: '08122/2278918', email: 'info@ts-teamwear.de', istLaenge: 6, berechneteLaenge: 6, preisProMeter: 25, vertragsbeginn: '2023-06-03', bandeErneuert: 2023, abschnitt: 2, positionNr: 5, rechnung2026: 10 },
  { firma: 'Landmaschinentechnik & Spenglerei Johann Fehlberger GmbH', strasse: 'Hörlkofener Str. 18', plz: '85435', ort: 'Erding', telefon: '08122/95961-0', email: 'kontakt@fehlberger.de', istLaenge: 4, berechneteLaenge: 4, preisProMeter: 40, vertragsbeginn: '2023-06-03', bandeErneuert: 2023, abschnitt: 2, positionNr: 6, rechnung2026: 11 },
  { firma: "Müller's Bautrocknung", ansprechpartner: 'Gerhard Lanzl', strasse: 'Lindenstr. 4', plz: '88424', ort: 'Isen-Pemmering', telefon: '08124/444412', email: 'info@bautrocknung-mueller.de', istLaenge: 4, berechneteLaenge: 4, preisProMeter: 40, bandeErneuert: 2023, abschnitt: 2, positionNr: 7, rechnung2026: 3 },

  // ── Abschnitt 3: ab der 2. Spielerbank (18 m) ──
  { firma: 'LAGERRENT GMBH', ansprechpartner: 'Thomas Miler', strasse: 'Mauerkircherstraße 29', plz: '81679', ort: 'München', telefon: '089/248866130', email: 'info@lagerrent.de', istLaenge: 3.84, berechneteLaenge: 4, preisProMeter: 40, vertragsbeginn: '2023-06-03', bandeErneuert: 2023, abschnitt: 3, positionNr: 1, rechnung2026: 12 },
  { firma: 'Kreis- und Stadtsparkasse Erding - Dorfen', ansprechpartner: 'Hermann Seiler', strasse: 'Alois-Schießl-Platz 4', plz: '85435', ort: 'Erding', telefon: '08122/5511-4500', email: 'hermann.seiler@spked.de', istLaenge: 5, berechneteLaenge: 5, preisProMeter: 40, bandeErneuert: 2023, abschnitt: 3, positionNr: 2, rechnung2026: 9 },
  { firma: 'Heinrich Schmitt GmbH', ansprechpartner: 'Heinrich S. Schmitt', strasse: 'Finsinger Str. 10', plz: '85570', ort: 'Markt Schwaben', telefon: '08121/9196-0', email: 'info@bauzentrum-schmitt.de', istLaenge: 4, berechneteLaenge: 5, preisProMeter: 40, bandeErneuert: 2022, abschnitt: 3, positionNr: 3, rechnung2026: 14 },
  { firma: 'SEW Stromversorgungs GmbH', ansprechpartner: 'Eva Bober', strasse: 'Werkstraße 2', plz: '85435', ort: 'Erding', telefon: '08122/9827-0', email: 'eva.bober@sew-erding.de', istLaenge: 5, berechneteLaenge: 5, preisProMeter: 40, bandeErneuert: 2023, abschnitt: 3, positionNr: 4, rechnung2026: 15 },

  // ── Interessent laut Excel ──
  { firma: 'Auto Mayer', preisProMeter: 40, vertragsbeginn: '2026-07-01', bemerkung: 'Neuer Partner ab 01.07.2026 laut Excel — Meter, Preis und Kontaktdaten noch offen' },

  // ── Gekündigt-Historie (ohne Platz-Zuordnung) ──
  { firma: 'Friseur Falthauser', ansprechpartner: 'Max Falthauser', strasse: 'Raiffeisenstr. 7', plz: '85669', ort: 'Pastetten', preisProMeter: 0, status: 'gekuendigt' },
  { firma: 'Huber Garten- und Landschaftsbau', ansprechpartner: 'Michael Huber', strasse: 'Habererweg 7', plz: '85570', ort: 'Markt Schwaben', preisProMeter: 0, status: 'gekuendigt' },
  { firma: 'Larcher Touristik GmbH', ansprechpartner: 'Herbert Larcher', strasse: 'Marzell 2', plz: '85570', ort: 'Markt Schwaben', preisProMeter: 0, status: 'gekuendigt' },
  { firma: 'Getränkeoase Sesojew', ansprechpartner: 'Gerald Sesojew', strasse: 'Forellenweg 6', plz: '85464', ort: 'Neufinsing', preisProMeter: 0, status: 'gekuendigt' },
  { firma: 'munich-pixels GmbH', ansprechpartner: 'Bernd Müller', strasse: 'Geltinger Str. 7b', plz: '85570', ort: 'Markt Schwaben', telefon: '0152/28597293', email: 'info@munichpixels.de', preisProMeter: 0, status: 'gekuendigt', bemerkung: 'Zuletzt Saison 2022/2023' },
  { firma: 'URBAN und ZWANZIGER GmbH & Co. KG', ansprechpartner: 'Stephan Metz', strasse: 'Stolzhofstr. 7', plz: '81825', ort: 'München', telefon: '089/7244819-0', email: 'info@u20.de', berechneteLaenge: 5, preisProMeter: 0, status: 'gekuendigt', bemerkung: 'Zuletzt Saison 2022/2023' },
  { firma: 'Flughafen München', ansprechpartner: 'Petra Rittler', strasse: 'Postfach 23 17 55', plz: '85326', ort: 'München-Flughafen', telefon: '089/975 54074', email: 'petra.rittler@munich-airport.de', berechneteLaenge: 10, preisProMeter: 0, status: 'gekuendigt', bemerkung: 'Zuletzt Saison 2022/2023' },
  { firma: 'Flughafen München - Jugendförderung', ansprechpartner: 'Petra Rittler', strasse: 'Postfach 23 17 55', plz: '85326', ort: 'München-Flughafen', telefon: '089/975 54074', email: 'petra.rittler@munich-airport.de', istLaenge: 10, berechneteLaenge: 10, preisProMeter: 0, status: 'gekuendigt', bemerkung: 'Zuletzt Saison 2022/2023' },
]

const MWST_SATZ = 19
const RECHNUNGS_SAISON = '2025/2026'
const RECHNUNGS_JAHR = 2026
const RECHNUNGS_DATUM = new Date('2026-08-02')

// Briefkopf/Fußzeile aus der offiziellen Briefvorlage (DJK_Vorlage_Brief.docx,
// Erstseiten-Variante). Wird nur gesetzt, wenn das Feld noch leer ist —
// Nutzeränderungen bleiben unangetastet.
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

async function main() {
  // 1. Einstellungen: nur anlegen, nie Nutzeränderungen überschreiben
  const einstellung = await prisma.werbebandenEinstellung.upsert({
    where: { id: 'werbebanden' },
    create: {
      id: 'werbebanden',
      vereinsname: 'DJK SG Ottenhofen e.V.',
      kassierName: 'Alexander Reisner',
      absenderzeile: 'DJK SG Ottenhofen e.V. · Herdweger Str. 4 · 85570 Ottenhofen',
      zahlungszielTage: 14,
      standardPreisProMeter: 40,
      mwstSatz: MWST_SATZ,
      kopfKontaktblock: KOPF_KONTAKTBLOCK,
      fusszeileSpalte1: FUSSZEILE_1,
      fusszeileSpalte2: FUSSZEILE_2,
      fusszeileSpalte3: FUSSZEILE_3,
    },
    update: {},
  })

  // Nachrüstung für Bestands-Installationen: neue Briefkopf-Felder nur
  // befüllen, solange sie leer sind (überschreibt keine Nutzereingaben)
  const nachruestung: Record<string, string> = {}
  if (!einstellung.kopfKontaktblock) nachruestung.kopfKontaktblock = KOPF_KONTAKTBLOCK
  if (!einstellung.fusszeileSpalte1) nachruestung.fusszeileSpalte1 = FUSSZEILE_1
  if (!einstellung.fusszeileSpalte2) nachruestung.fusszeileSpalte2 = FUSSZEILE_2
  if (!einstellung.fusszeileSpalte3) nachruestung.fusszeileSpalte3 = FUSSZEILE_3
  if (Object.keys(nachruestung).length > 0) {
    await prisma.werbebandenEinstellung.update({
      where: { id: 'werbebanden' },
      data: nachruestung,
    })
    console.log(`Werbebanden-Seed: Briefkopf-Felder nachgerüstet (${Object.keys(nachruestung).join(', ')}).`)
  }

  // 2. Partner + Rechnungen nur beim allerersten Lauf
  const vorhanden = await prisma.werbepartner.count()
  if (vorhanden > 0) {
    console.log(`Werbebanden-Seed: ${vorhanden} Partner vorhanden — nichts zu tun.`)
    return
  }

  let rechnungen = 0
  for (const p of PARTNER) {
    const partner = await prisma.werbepartner.create({
      data: {
        firma: p.firma,
        ansprechpartner: p.ansprechpartner ?? null,
        strasse: p.strasse ?? null,
        plz: p.plz ?? null,
        ort: p.ort ?? null,
        telefon: p.telefon ?? null,
        email: p.email ?? null,
        istLaenge: p.istLaenge ?? 0,
        berechneteLaenge: p.berechneteLaenge ?? 0,
        preisProMeter: p.preisProMeter ?? 40,
        vertragsbeginn: p.vertragsbeginn ? new Date(p.vertragsbeginn) : null,
        bandeErneuert: p.bandeErneuert ?? null,
        abschnitt: p.abschnitt ?? null,
        positionNr: p.positionNr ?? null,
        status: p.status ?? 'aktiv',
        bemerkung: p.bemerkung ?? null,
      },
    })

    if (p.rechnung2026) {
      const netto = Math.round((p.berechneteLaenge ?? 0) * (p.preisProMeter ?? 0) * 100) / 100
      const mwst = Math.round(netto * MWST_SATZ) / 100
      await prisma.werbebandenRechnung.create({
        data: {
          partnerId: partner.id,
          saison: RECHNUNGS_SAISON,
          jahr: RECHNUNGS_JAHR,
          laufnummer: p.rechnung2026,
          nummer: `${RECHNUNGS_JAHR}/B/${String(p.rechnung2026).padStart(4, '0')}`,
          datum: RECHNUNGS_DATUM,
          firma: p.firma,
          ansprechpartner: p.ansprechpartner ?? null,
          strasse: p.strasse ?? null,
          plz: p.plz ?? null,
          ort: p.ort ?? null,
          laenge: p.berechneteLaenge ?? 0,
          preisProMeter: p.preisProMeter ?? 0,
          netto,
          mwstSatz: MWST_SATZ,
          mwst,
          brutto: Math.round((netto + mwst) * 100) / 100,
          zahlungszielTage: 14,
          status: 'erstellt',
        },
      })
      rechnungen++
    }
  }
  console.log(`Werbebanden-Seed: ${PARTNER.length} Partner + ${rechnungen} Rechnungen ${RECHNUNGS_SAISON} angelegt.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
