// PDF-Erzeugung für Werbebanden-Jahresrechnungen mit pdf-lib.
// Layout nach der offiziellen Briefvorlage (DJK_Vorlage_Brief.docx):
// Vereinswappen links oben, DJK-Verbandslogo rechts oben, Kassier-Kontaktblock
// rechts, Absenderzeile + Adressfeld (DIN-Fensterposition), Leistungstabelle,
// Netto/MwSt/Brutto, dreispaltige Fußzeile (Anschrift | Register/Vorstand |
// Bankverbindungen). Kopfblock und Fußzeilen-Spalten kommen editierbar aus den
// Einstellungen; die Logos aus src/lib/rechnung-assets.ts.
// pdf-lib statt headless Chrome: reines JS, kein zusätzlicher Prozess auf
// dem Server; Helvetica (WinAnsi) deckt Umlaute, ß und € ab.

import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib'
import { WAPPEN_JPEG_BASE64, VERBAND_JPEG_BASE64 } from './rechnung-assets'

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
  kopfKontaktblock: string
  fusszeileSpalte1: string
  fusszeileSpalte2: string
  fusszeileSpalte3: string
}

const A4 = { breite: 595.28, hoehe: 841.89 }
const LINKS = 71
const RECHTS = A4.breite - 71
const SCHWARZ = rgb(0, 0, 0)
const GRAU = rgb(0.35, 0.35, 0.35)

function euro(n: number): string {
  return `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

function meter(n: number): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: 2 })
}

function zeilen(text: string): string[] {
  return text.split('\n').map(z => z.trim()).filter(Boolean)
}

function zeilenUmbruch(text: string, font: PDFFont, groesse: number, maxBreite: number): string[] {
  const woerter = text.split(' ')
  const ergebnis: string[] = []
  let aktuelle = ''
  for (const wort of woerter) {
    const test = aktuelle ? `${aktuelle} ${wort}` : wort
    if (font.widthOfTextAtSize(test, groesse) > maxBreite && aktuelle) {
      ergebnis.push(aktuelle)
      aktuelle = wort
    } else {
      aktuelle = test
    }
  }
  if (aktuelle) ergebnis.push(aktuelle)
  return ergebnis
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
  const textRechts = (t: string, xRechts: number, y: number, groesse = 11, fett = false, farbe = SCHWARZ) => {
    const f = fett ? fontFett : font
    seite.drawText(t, { x: xRechts - f.widthOfTextAtSize(t, groesse), y, size: groesse, font: f, color: farbe })
  }

  // ── Briefkopf: Wappen links, Verbandslogo rechts, Vereinsname mittig ──
  const kopfOben = A4.hoehe - 45
  const wappen = await doc.embedJpg(WAPPEN_JPEG_BASE64)
  seite.drawImage(wappen, { x: LINKS, y: kopfOben - 58, width: 54, height: 58 })
  const verband = await doc.embedJpg(VERBAND_JPEG_BASE64)
  seite.drawImage(verband, { x: RECHTS - 60, y: kopfOben - 47, width: 60, height: 47 })

  const titel = einstellungen.vereinsname || 'DJK SG Ottenhofen e.V.'
  const titelBreite = fontFett.widthOfTextAtSize(titel, 16)
  text(titel, (A4.breite - titelBreite) / 2, kopfOben - 34, 16, true)

  // Kontaktblock (Kassier) rechtsbündig unter dem Verbandslogo
  let yKontakt = kopfOben - 47 - 16
  for (const zeile of zeilen(einstellungen.kopfKontaktblock)) {
    textRechts(zeile, RECHTS, yKontakt, 8.5, false, GRAU)
    yKontakt -= 11
  }

  // ── Absenderzeile (klein, über dem Adressfeld — DIN-Fensterposition) ──
  let y = A4.hoehe - 168
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
  text(meter(rechnung.laenge), spalteMeter, y)
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
  text(`${meter(rechnung.mwstSatz)} % MwSt.`, spalteBezeichnung, y)
  textRechts(euro(rechnung.mwst), spalteGesamtRechts, y)
  y -= 6
  seite.drawLine({ start: { x: spalteBezeichnung, y }, end: { x: RECHTS, y }, thickness: 0.5, color: SCHWARZ })
  y -= 16
  text('Endsumme', spalteBezeichnung, y, 11, true)
  textRechts(euro(rechnung.brutto), spalteGesamtRechts, y, 11, true)

  // Zahlungshinweis
  y -= 34
  const hatFusszeilenBank = zeilen(einstellungen.fusszeileSpalte3).length > 0
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

  // ── Fußzeile: drei Spalten (Anschrift | Register/Vorstand | Banken) ──
  const spalten = [
    zeilen(einstellungen.fusszeileSpalte1),
    zeilen(einstellungen.fusszeileSpalte2),
    zeilen(einstellungen.fusszeileSpalte3),
  ]
  if (spalten.some(s => s.length > 0)) {
    const fussOben = 108
    seite.drawLine({ start: { x: LINKS, y: fussOben }, end: { x: RECHTS, y: fussOben }, thickness: 0.5, color: GRAU })
    const spaltenX = [LINKS, LINKS + 175, LINKS + 298]
    spalten.forEach((spalte, i) => {
      let yFuss = fussOben - 12
      for (const zeile of spalte) {
        text(zeile, spaltenX[i], yFuss, 7.5, false, GRAU)
        yFuss -= 10
      }
    })
  } else if (einstellungen.iban) {
    // Übergangsweise: alte Ein-Bank-Fußzeile, falls die Spalten leer sind
    const teile = [
      einstellungen.bankName || null,
      `IBAN: ${einstellungen.iban}`,
      einstellungen.bic ? `BIC: ${einstellungen.bic}` : null,
    ].filter(Boolean)
    const fusszeile = teile.join('  ·  ')
    seite.drawLine({ start: { x: LINKS, y: 78 }, end: { x: RECHTS, y: 78 }, thickness: 0.5, color: GRAU })
    const breite = font.widthOfTextAtSize(fusszeile, 9)
    text(fusszeile, (A4.breite - breite) / 2, 64, 9, false, GRAU)
  }

  return doc.save()
}
