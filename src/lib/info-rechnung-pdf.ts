// PDF-Erzeugung für DJK-Info-Jahresrechnungen (Vereinszeitschrift) mit pdf-lib.
// Briefkopf, Absenderzeile und Fußzeile aus den gemeinsamen Primitiven in
// src/lib/pdf-brief.ts; Texte nach dem offiziellen Serienbrief-Vordruck
// „Rechnungsvordruck DJK Info": Tabelle Anzahl Ausgaben | Bezeichnung |
// Preis pro Anzeige | Gesamtbetrag.

import { PDFDocument } from 'pdf-lib'
import {
  A4, LINKS, RECHTS, GRAU, SCHWARZ,
  euro, zahlDe, ladeBriefFonts, textZeichner, zeilenUmbruch,
  zeichneBriefkopf, zeichneAbsenderzeile, zeichneFusszeile,
  BriefEinstellungen,
} from './pdf-brief'
import { groesseKurzLabel } from '@/data/djk-info'

export interface InfoRechnungFuerPdf {
  nummer: string
  leistungsjahr: number
  datum: Date
  firma: string
  zusatz?: string | null
  ansprechpartner?: string | null
  strasse?: string | null
  plz?: string | null
  ort?: string | null
  anzeigenGroesse: string
  jahresNetto: number
  anzahlAusgaben: number
  ausgabenListe: string
  netto: number
  mwstSatz: number
  mwst: number
  brutto: number
  zahlungszielTage: number
}

export async function erzeugeInfoRechnungPdf(
  rechnung: InfoRechnungFuerPdf,
  einstellungen: BriefEinstellungen,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const seite = doc.addPage([A4.breite, A4.hoehe])
  const fonts = await ladeBriefFonts(doc)
  const { font } = fonts
  const { text, textRechts } = textZeichner(seite, fonts)

  await zeichneBriefkopf(doc, seite, fonts, einstellungen)
  zeichneAbsenderzeile(seite, fonts, einstellungen.absenderzeile)

  // Adressfeld — doppelte Zeilen vermeiden (Zusatz und Ansprechpartner sind
  // in den Excel-Daten oft dieselbe Person)
  let y = A4.hoehe - 168 - 22
  const adresse = Array.from(new Set(
    [
      rechnung.firma,
      rechnung.zusatz || null,
      rechnung.ansprechpartner || null,
      rechnung.strasse || null,
      [rechnung.plz, rechnung.ort].filter(Boolean).join(' ') || null,
    ].filter((z): z is string => !!z),
  ))
  for (const zeile of adresse) {
    text(zeile, LINKS, y)
    y -= 15
  }

  // Ort, Datum (rechts)
  const datumsText = `Ottenhofen, ${rechnung.datum.toLocaleDateString('de-DE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })}`
  textRechts(datumsText, RECHTS, A4.hoehe - 288)

  // Betreff
  y = A4.hoehe - 324
  text('Werbung in unserer Vereinszeitschrift DJK-Info', LINKS, y, 11, true)
  y -= 16
  text(`Rechnung Nr. ${rechnung.nummer}`, LINKS, y, 11, true)

  // Anrede + Einleitung
  y -= 34
  text('Sehr geehrte Damen und Herren,', LINKS, y)
  y -= 24
  const einleitung =
    'wir erlauben uns für Ihre Werbeanzeige in unserer Vereinszeitschrift folgenden Betrag in Rechnung zu stellen:'
  for (const zeile of zeilenUmbruch(einleitung, font, 11, RECHTS - LINKS)) {
    text(zeile, LINKS, y)
    y -= 15
  }

  // Tabelle: Anzahl Ausgaben | Bezeichnung | Preis pro Anzeige | Gesamtbetrag
  y -= 16
  const spalteAnzahl = LINKS
  const spalteBezeichnung = LINKS + 90
  const spaltePreisRechts = RECHTS - 110
  const spalteGesamtRechts = RECHTS
  text('Anzahl Ausgaben', spalteAnzahl, y, 10, true)
  text('Bezeichnung', spalteBezeichnung, y, 10, true)
  textRechts('Preis pro Anzeige', spaltePreisRechts, y, 10, true)
  textRechts('Gesamtbetrag', spalteGesamtRechts, y, 10, true)
  y -= 6
  seite.drawLine({ start: { x: LINKS, y }, end: { x: RECHTS, y }, thickness: 0.75, color: SCHWARZ })

  // Preis pro Anzeige nur zur Anzeige gerundet — der Gesamtbetrag ist
  // netto = round(jahresNetto × n ÷ 3), nie Einzelpreis × n (Rundungsfehler)
  const einzelpreis = Math.round((rechnung.jahresNetto * 100) / 3) / 100
  y -= 18
  text(String(rechnung.anzahlAusgaben), spalteAnzahl + 24, y)
  text(`Werbung in der DJK-Info im Jahr ${rechnung.leistungsjahr}`, spalteBezeichnung, y)
  textRechts(euro(einzelpreis), spaltePreisRechts, y)
  textRechts(euro(rechnung.netto), spalteGesamtRechts, y)
  y -= 15
  text(`Anzeigengröße: ${groesseKurzLabel(rechnung.anzeigenGroesse)}`, spalteBezeichnung, y)
  if (rechnung.ausgabenListe) {
    y -= 15
    text(`Ausgaben: ${rechnung.ausgabenListe}`, spalteBezeichnung, y, 10, false, GRAU)
  }

  y -= 12
  seite.drawLine({ start: { x: LINKS, y }, end: { x: RECHTS, y }, thickness: 0.5, color: GRAU })

  // Summenblock
  y -= 20
  text('Summe Netto', spalteBezeichnung, y)
  textRechts(euro(rechnung.netto), spalteGesamtRechts, y)
  y -= 16
  text(`${zahlDe(rechnung.mwstSatz)} % MwSt.`, spalteBezeichnung, y)
  textRechts(euro(rechnung.mwst), spalteGesamtRechts, y)
  y -= 6
  seite.drawLine({ start: { x: spalteBezeichnung, y }, end: { x: RECHTS, y }, thickness: 0.5, color: SCHWARZ })
  y -= 16
  text('Endsumme', spalteBezeichnung, y, 11, true)
  textRechts(euro(rechnung.brutto), spalteGesamtRechts, y, 11, true)

  // Zahlungshinweis
  y -= 34
  const hatFusszeilenBank = einstellungen.fusszeileSpalte3.split('\n').some(z => z.trim())
  const bankHinweis = hatFusszeilenBank
    ? 'an eine der untenstehenden Bankverbindungen'
    : 'an die Bankverbindung des Vereins'
  const zahlung = `Bitte überweisen Sie den Endbetrag unter Angabe der Rechnungsnummer innerhalb von ${rechnung.zahlungszielTage} Tagen ${bankHinweis}.`
  for (const zeile of zeilenUmbruch(zahlung, font, 11, RECHTS - LINKS)) {
    text(zeile, LINKS, y)
    y -= 15
  }
  y -= 9
  text('Wir bedanken uns für Ihre Unterstützung und wünschen Ihnen weiterhin alles Gute.', LINKS, y)

  // Gruß
  y -= 34
  text('Mit freundlichen Grüßen', LINKS, y)
  y -= 15
  text(einstellungen.vereinsname, LINKS, y)
  y -= 42
  if (einstellungen.kassierName) {
    text(einstellungen.kassierName, LINKS, y)
    y -= 15
    text('Kassier', LINKS, y)
  }

  zeichneFusszeile(seite, fonts, einstellungen)

  return doc.save()
}
