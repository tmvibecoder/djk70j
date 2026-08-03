// PDF-Erzeugung für Werbebanden-Jahresrechnungen mit pdf-lib.
// Layout nach dem bisherigen Word-Serienbrief („Rechnungsvordruck DJK
// Bandenwerbung"): Absenderzeile, Adressfeld, Betreff mit Rechnungsnummer,
// Leistungstabelle, Netto/MwSt/Brutto, Zahlungsziel, Gruß mit Kassier.
// pdf-lib statt headless Chrome: reines JS, kein zusätzlicher Prozess auf
// dem Server; Helvetica (WinAnsi) deckt Umlaute, ß und € ab.

import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib'

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

export interface EinstellungenFuerPdf {
  vereinsname: string
  kassierName: string
  absenderzeile: string
  bankName: string
  iban: string
  bic: string
}

const A4 = { breite: 595.28, hoehe: 841.89 }
const LINKS = 70
const RECHTS = A4.breite - 70
const SCHWARZ = rgb(0, 0, 0)
const GRAU = rgb(0.35, 0.35, 0.35)

function euro(n: number): string {
  return `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

function meter(n: number): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: 2 })
}

function zeilenUmbruch(text: string, font: PDFFont, groesse: number, maxBreite: number): string[] {
  const woerter = text.split(' ')
  const zeilen: string[] = []
  let aktuelle = ''
  for (const wort of woerter) {
    const test = aktuelle ? `${aktuelle} ${wort}` : wort
    if (font.widthOfTextAtSize(test, groesse) > maxBreite && aktuelle) {
      zeilen.push(aktuelle)
      aktuelle = wort
    } else {
      aktuelle = test
    }
  }
  if (aktuelle) zeilen.push(aktuelle)
  return zeilen
}

export async function erzeugeRechnungPdf(
  rechnung: RechnungFuerPdf,
  einstellungen: EinstellungenFuerPdf,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const seite = doc.addPage([A4.breite, A4.hoehe])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontFett = await doc.embedFont(StandardFonts.HelveticaBold)

  const text = (t: string, x: number, y: number, groesse = 11, fett = false, farbe = SCHWARZ) => {
    seite.drawText(t, { x, y, size: groesse, font: fett ? fontFett : font, color: farbe })
  }
  const textRechts = (t: string, xRechts: number, y: number, groesse = 11, fett = false) => {
    const f = fett ? fontFett : font
    seite.drawText(t, { x: xRechts - f.widthOfTextAtSize(t, groesse), y, size: groesse, font: f })
  }

  // Absenderzeile (klein, über dem Adressfeld — DIN-Fensterposition)
  let y = A4.hoehe - 130
  if (einstellungen.absenderzeile) {
    text(einstellungen.absenderzeile, LINKS, y, 8, false, GRAU)
    seite.drawLine({
      start: { x: LINKS, y: y - 3 },
      end: { x: LINKS + font.widthOfTextAtSize(einstellungen.absenderzeile, 8), y: y - 3 },
      thickness: 0.5,
      color: GRAU,
    })
  }

  // Adressfeld
  y -= 22
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
  textRechts(datumsText, RECHTS, A4.hoehe - 250)

  // Betreff
  y = A4.hoehe - 290
  text(`Miete Bandenwerbung für die Saison ${rechnung.saison}`, LINKS, y, 11, true)
  y -= 16
  text(`Rechnung Nr. ${rechnung.nummer}`, LINKS, y, 11, true)

  // Anrede + Einleitung
  y -= 36
  text('Sehr geehrte Damen und Herren,', LINKS, y)
  y -= 24
  const einleitung = `wir erlauben uns für die Bandenwerbung bei der ${einstellungen.vereinsname} folgenden Betrag in Rechnung zu stellen:`
  for (const zeile of zeilenUmbruch(einleitung, font, 11, RECHTS - LINKS)) {
    text(zeile, LINKS, y)
    y -= 15
  }

  // Tabelle
  y -= 18
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
  text(meter(rechnung.laenge), spalteMeter, y)
  text(`Bandenwerbung Sportplatz Ottenhofen`, spalteBezeichnung, y)
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
  text(`${meter(rechnung.mwstSatz)} % MwSt.`, spalteBezeichnung, y)
  textRechts(euro(rechnung.mwst), spalteGesamtRechts, y)
  y -= 6
  seite.drawLine({ start: { x: spalteBezeichnung, y }, end: { x: RECHTS, y }, thickness: 0.5, color: SCHWARZ })
  y -= 16
  text('Endsumme', spalteBezeichnung, y, 11, true)
  textRechts(euro(rechnung.brutto), spalteGesamtRechts, y, 11, true)

  // Zahlungshinweis
  y -= 36
  const zahlung = `Bitte überweisen Sie den Endbetrag unter Angabe der Rechnungsnummer innerhalb von ${rechnung.zahlungszielTage} Tagen an die untenstehende Bankverbindung.`
  for (const zeile of zeilenUmbruch(zahlung, font, 11, RECHTS - LINKS)) {
    text(zeile, LINKS, y)
    y -= 15
  }
  y -= 9
  text('Wir bedanken uns für Ihre Unterstützung und wünschen Ihnen weiterhin alles Gute.', LINKS, y)

  // Gruß
  y -= 36
  text('Mit freundlichen Grüßen', LINKS, y)
  y -= 15
  text(einstellungen.vereinsname, LINKS, y)
  y -= 45
  if (einstellungen.kassierName) {
    text(einstellungen.kassierName, LINKS, y)
    y -= 15
    text('Kassier', LINKS, y)
  }

  // Fußzeile: Bankverbindung
  const bankTeile = [
    einstellungen.bankName || null,
    einstellungen.iban ? `IBAN: ${einstellungen.iban}` : null,
    einstellungen.bic ? `BIC: ${einstellungen.bic}` : null,
  ].filter(Boolean)
  if (bankTeile.length > 0) {
    const fusszeile = bankTeile.join('  ·  ')
    seite.drawLine({ start: { x: LINKS, y: 78 }, end: { x: RECHTS, y: 78 }, thickness: 0.5, color: GRAU })
    const breite = font.widthOfTextAtSize(fusszeile, 9)
    text(fusszeile, (A4.breite - breite) / 2, 64, 9, false, GRAU)
  }

  return doc.save()
}
