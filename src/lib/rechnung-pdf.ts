// PDF-Erzeugung für Werbebanden-Jahresrechnungen mit pdf-lib.
// Briefkopf, Absenderzeile und Fußzeile kommen aus den gemeinsamen
// Primitiven in src/lib/pdf-brief.ts (Layout der offiziellen Briefvorlage);
// Kopfblock und Fußzeilen-Spalten sind editierbar über die Einstellungen.

import { PDFDocument } from 'pdf-lib'
import {
  A4, LINKS, RECHTS, GRAU, SCHWARZ,
  euro, zahlDe, ladeBriefFonts, textZeichner, zeilenUmbruch,
  zeichneBriefkopf, zeichneAbsenderzeile, zeichneFusszeile,
  BriefEinstellungen,
} from './pdf-brief'

export interface RechnungFuerPdf {
  nummer: string
  saison: string
  datum: Date
  firma: string
  ansprechpartner?: string | null
  strasse?: string | null
  plz?: string | null
  ort?: string | null
  laenge: number
  preisProMeter: number
  netto: number
  mwstSatz: number
  mwst: number
  brutto: number
  zahlungszielTage: number
}

export type EinstellungenFuerPdf = BriefEinstellungen

export async function erzeugeRechnungPdf(
  rechnung: RechnungFuerPdf,
  einstellungen: EinstellungenFuerPdf,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const seite = doc.addPage([A4.breite, A4.hoehe])
  const fonts = await ladeBriefFonts(doc)
  const { font } = fonts
  const { text, textRechts } = textZeichner(seite, fonts)

  await zeichneBriefkopf(doc, seite, fonts, einstellungen)
  zeichneAbsenderzeile(seite, fonts, einstellungen.absenderzeile)

  // Adressfeld
  let y = A4.hoehe - 168 - 22
  const adresse = [
    rechnung.firma,
    rechnung.ansprechpartner || null,
    rechnung.strasse || null,
    [rechnung.plz, rechnung.ort].filter(Boolean).join(' ') || null,
  ].filter((z): z is string => !!z)
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
  text(`Miete Bandenwerbung für die Saison ${rechnung.saison}`, LINKS, y, 11, true)
  y -= 16
  text(`Rechnung Nr. ${rechnung.nummer}`, LINKS, y, 11, true)

  // Anrede + Einleitung
  y -= 34
  text('Sehr geehrte Damen und Herren,', LINKS, y)
  y -= 24
  const einleitung = `wir erlauben uns für die Bandenwerbung bei der ${einstellungen.vereinsname} folgenden Betrag in Rechnung zu stellen:`
  for (const zeile of zeilenUmbruch(einleitung, font, 11, RECHTS - LINKS)) {
    text(zeile, LINKS, y)
    y -= 15
  }

  // Tabelle
  y -= 16
  const spalteMeter = LINKS
  const spalteBezeichnung = LINKS + 70
  const spaltePreisRechts = RECHTS - 110
  const spalteGesamtRechts = RECHTS
  text('Lfd. Meter', spalteMeter, y, 10, true)
  text('Bezeichnung', spalteBezeichnung, y, 10, true)
  textRechts('Preis pro Meter', spaltePreisRechts, y, 10, true)
  textRechts('Gesamtbetrag', spalteGesamtRechts, y, 10, true)
  y -= 6
  seite.drawLine({ start: { x: LINKS, y }, end: { x: RECHTS, y }, thickness: 0.75, color: SCHWARZ })

  y -= 18
  text(zahlDe(rechnung.laenge), spalteMeter, y)
  text('Bandenwerbung Sportplatz Ottenhofen', spalteBezeichnung, y)
  textRechts(euro(rechnung.preisProMeter), spaltePreisRechts, y)
  textRechts(euro(rechnung.netto), spalteGesamtRechts, y)
  y -= 15
  text(`Saison ${rechnung.saison}`, spalteBezeichnung, y)

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
