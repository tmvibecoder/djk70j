// Gemeinsame pdf-lib-Primitive für Briefe im Layout der offiziellen
// DJK-Briefvorlage (DJK_Vorlage_Brief.docx): Vereinswappen links oben,
// DJK-Verbandslogo rechts oben, Vereinsname mittig, Kassier-Kontaktblock
// rechts, kleine Absenderzeile (DIN-Fensterposition), dreispaltige Fußzeile
// (Anschrift | Register/Vorstand | Bankverbindungen).
// Genutzt von rechnung-pdf.ts (Werbebanden), info-rechnung-pdf.ts und
// verteilung-pdf.ts (DJK-Info). Logos aus src/lib/rechnung-assets.ts.
// pdf-lib statt headless Chrome: reines JS, kein zusätzlicher Prozess auf
// dem Server; Helvetica (WinAnsi) deckt Umlaute, ß und € ab.

import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'
import { WAPPEN_JPEG_BASE64, VERBAND_JPEG_BASE64 } from './rechnung-assets'

export const A4 = { breite: 595.28, hoehe: 841.89 }
export const LINKS = 71
export const RECHTS = A4.breite - 71
export const SCHWARZ = rgb(0, 0, 0)
export const GRAU = rgb(0.35, 0.35, 0.35)

export function euro(n: number): string {
  return `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

export function zahlDe(n: number): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: 2 })
}

export function zeilen(text: string): string[] {
  return text.split('\n').map(z => z.trim()).filter(Boolean)
}

export function zeilenUmbruch(text: string, font: PDFFont, groesse: number, maxBreite: number): string[] {
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

// Briefkopf/Fußzeilen-Felder — deckungsgleich mit den Einstellungs-Singletons
// beider Bereiche (WerbebandenEinstellung / InfoEinstellung).
export interface BriefEinstellungen {
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

export interface BriefFonts {
  font: PDFFont
  fontFett: PDFFont
}

export async function ladeBriefFonts(doc: PDFDocument): Promise<BriefFonts> {
  return {
    font: await doc.embedFont(StandardFonts.Helvetica),
    fontFett: await doc.embedFont(StandardFonts.HelveticaBold),
  }
}

export interface TextZeichner {
  text: (t: string, x: number, y: number, groesse?: number, fett?: boolean, farbe?: ReturnType<typeof rgb>) => void
  textRechts: (t: string, xRechts: number, y: number, groesse?: number, fett?: boolean, farbe?: ReturnType<typeof rgb>) => void
}

export function textZeichner(seite: PDFPage, fonts: BriefFonts): TextZeichner {
  const text: TextZeichner['text'] = (t, x, y, groesse = 11, fett = false, farbe = SCHWARZ) => {
    seite.drawText(t, { x, y, size: groesse, font: fett ? fonts.fontFett : fonts.font, color: farbe })
  }
  const textRechts: TextZeichner['textRechts'] = (t, xRechts, y, groesse = 11, fett = false, farbe = SCHWARZ) => {
    const f = fett ? fonts.fontFett : fonts.font
    seite.drawText(t, { x: xRechts - f.widthOfTextAtSize(t, groesse), y, size: groesse, font: f, color: farbe })
  }
  return { text, textRechts }
}

// Wappen links, Verbandslogo rechts, Vereinsname mittig, Kontaktblock
// (Kassier) rechtsbündig unter dem Verbandslogo.
export async function zeichneBriefkopf(
  doc: PDFDocument,
  seite: PDFPage,
  fonts: BriefFonts,
  einstellungen: Pick<BriefEinstellungen, 'vereinsname' | 'kopfKontaktblock'>,
): Promise<void> {
  const { text, textRechts } = textZeichner(seite, fonts)
  const kopfOben = A4.hoehe - 45
  const wappen = await doc.embedJpg(WAPPEN_JPEG_BASE64)
  seite.drawImage(wappen, { x: LINKS, y: kopfOben - 58, width: 54, height: 58 })
  const verband = await doc.embedJpg(VERBAND_JPEG_BASE64)
  seite.drawImage(verband, { x: RECHTS - 60, y: kopfOben - 47, width: 60, height: 47 })

  const titel = einstellungen.vereinsname || 'DJK SG Ottenhofen e.V.'
  const titelBreite = fonts.fontFett.widthOfTextAtSize(titel, 16)
  text(titel, (A4.breite - titelBreite) / 2, kopfOben - 34, 16, true)

  let yKontakt = kopfOben - 47 - 16
  for (const zeile of zeilen(einstellungen.kopfKontaktblock)) {
    textRechts(zeile, RECHTS, yKontakt, 8.5, false, GRAU)
    yKontakt -= 11
  }
}

// Kleine Absenderzeile mit Unterstreichung (DIN-Fensterposition, y fest).
export function zeichneAbsenderzeile(seite: PDFPage, fonts: BriefFonts, absenderzeile: string): void {
  if (!absenderzeile) return
  const y = A4.hoehe - 168
  const { text } = textZeichner(seite, fonts)
  text(absenderzeile, LINKS, y, 8, false, GRAU)
  seite.drawLine({
    start: { x: LINKS, y: y - 3 },
    end: { x: LINKS + fonts.font.widthOfTextAtSize(absenderzeile, 8), y: y - 3 },
    thickness: 0.5,
    color: GRAU,
  })
}

// Dreispaltige Fußzeile (Anschrift | Register/Vorstand | Banken); solange die
// Spalten leer sind, übergangsweise die alte Ein-Bank-Fußzeile.
export function zeichneFusszeile(
  seite: PDFPage,
  fonts: BriefFonts,
  einstellungen: Pick<BriefEinstellungen, 'bankName' | 'iban' | 'bic' | 'fusszeileSpalte1' | 'fusszeileSpalte2' | 'fusszeileSpalte3'>,
): void {
  const { text } = textZeichner(seite, fonts)
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
    const teile = [
      einstellungen.bankName || null,
      `IBAN: ${einstellungen.iban}`,
      einstellungen.bic ? `BIC: ${einstellungen.bic}` : null,
    ].filter(Boolean)
    const fusszeile = teile.join('  ·  ')
    seite.drawLine({ start: { x: LINKS, y: 78 }, end: { x: RECHTS, y: 78 }, thickness: 0.5, color: GRAU })
    const breite = fonts.font.widthOfTextAtSize(fusszeile, 9)
    text(fusszeile, (A4.breite - breite) / 2, 64, 9, false, GRAU)
  }
}
