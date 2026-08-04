// PDF-Erzeugung für Schlüssel-Empfangs-/Rückgabebestätigungen mit pdf-lib.
// Briefkopf wie die Werbebanden-Rechnung (Wappen links, DJK-Verbandslogo
// rechts, Logos aus src/lib/rechnung-assets.ts), darunter Empfänger,
// Schlüssel-Tabelle, Pfand, Bestätigungstext, eingebettete Finger-Unterschrift
// und eine Fußzeile mit Signaturzeitpunkt + SHA-256-Prüfsumme.
// Helvetica (WinAnsi) deckt Umlaute, ß und € ab.

import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib'
import { WAPPEN_JPEG_BASE64, VERBAND_JPEG_BASE64 } from './rechnung-assets'
import type { BelegPayload } from './beleg-hash'

const A4 = { breite: 595.28, hoehe: 841.89 }
const LINKS = 71
const RECHTS = A4.breite - 71
const SCHWARZ = rgb(0, 0, 0)
const GRAU = rgb(0.35, 0.35, 0.35)

function euro(n: number): string {
  return `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
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

export async function erzeugeBelegPdf(
  payload: BelegPayload,
  unterschriftPng: Buffer | Uint8Array,
  signiertAm: Date,
  hash: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const seite = doc.addPage([A4.breite, A4.hoehe])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontFett = await doc.embedFont(StandardFonts.HelveticaBold)

  const text = (t: string, x: number, y: number, groesse = 11, fett = false, farbe = SCHWARZ) => {
    seite.drawText(t, { x, y, size: groesse, font: fett ? fontFett : font, color: farbe })
  }

  // ── Briefkopf: Wappen links, Verbandslogo rechts, Vereinsname mittig ──
  const kopfOben = A4.hoehe - 45
  const wappen = await doc.embedJpg(WAPPEN_JPEG_BASE64)
  seite.drawImage(wappen, { x: LINKS, y: kopfOben - 58, width: 54, height: 58 })
  const verband = await doc.embedJpg(VERBAND_JPEG_BASE64)
  seite.drawImage(verband, { x: RECHTS - 60, y: kopfOben - 47, width: 60, height: 47 })

  const titel = 'DJK SG Ottenhofen e.V.'
  const titelBreite = fontFett.widthOfTextAtSize(titel, 16)
  text(titel, (A4.breite - titelBreite) / 2, kopfOben - 34, 16, true)

  // ── Titel + Datum ──
  const istAusgabe = payload.art === 'ausgabe'
  let y = A4.hoehe - 160
  text(istAusgabe ? 'Empfangsbestätigung — Schlüsselausgabe' : 'Rückgabebestätigung — Schlüssel', LINKS, y, 14, true)
  y -= 18
  const datumsText = `Ottenhofen, ${signiertAm.toLocaleDateString('de-DE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })}`
  text(datumsText, LINKS, y, 10, false, GRAU)

  // ── Empfänger ──
  y -= 32
  text(istAusgabe ? 'Empfänger:' : 'Rückgabe durch:', LINKS, y, 10, true)
  y -= 16
  text(payload.person.name, LINKS, y, 12, true)
  const zusatz = [payload.person.funktion, payload.person.bereich].filter(Boolean).join(' · ')
  if (zusatz) {
    y -= 14
    text(zusatz, LINKS, y, 10, false, GRAU)
  }

  // ── Schlüssel-Tabelle ──
  y -= 28
  text('Schlüssel', LINKS, y, 10, true)
  text('Nummer / Detail', LINKS + 300, y, 10, true)
  y -= 6
  seite.drawLine({ start: { x: LINKS, y }, end: { x: RECHTS, y }, thickness: 0.75, color: SCHWARZ })
  for (const pos of payload.positionen) {
    y -= 17
    text(pos.schluessel, LINKS, y)
    text(pos.nummer ?? '—', LINKS + 300, y)
  }
  y -= 8
  seite.drawLine({ start: { x: LINKS, y }, end: { x: RECHTS, y }, thickness: 0.5, color: GRAU })

  // ── Pfand ──
  y -= 18
  if (istAusgabe) {
    text(`Pfand (bar erhalten): ${euro(payload.pfandBetrag)}`, LINKS, y, 11, true)
  } else {
    text(`Pfand zurückerstattet: ${euro(payload.pfandBetrag)}`, LINKS, y, 11, true)
  }

  // ── Bestätigungstext ──
  y -= 26
  const bestaetigung = istAusgabe
    ? `Hiermit bestätige ich, ${payload.person.name}, den Empfang der oben aufgeführten Schlüssel der DJK SG Ottenhofen e.V. Ich verpflichte mich, die Schlüssel sorgfältig zu verwahren, nicht an Dritte weiterzugeben und einen Verlust unverzüglich dem Verein zu melden. Bei Beendigung meiner Tätigkeit gebe ich die Schlüssel unaufgefordert zurück; das Pfand wird bei Rückgabe erstattet.`
    : `Hiermit wird die Rückgabe der oben aufgeführten Schlüssel durch ${payload.person.name} an die DJK SG Ottenhofen e.V. bestätigt.`
  for (const zeile of zeilenUmbruch(bestaetigung, font, 10.5, RECHTS - LINKS)) {
    text(zeile, LINKS, y, 10.5)
    y -= 14
  }

  // ── Unterschrift ──
  y -= 30
  const sig = await doc.embedPng(unterschriftPng)
  // Auf max. 200×70 pt einpassen, Seitenverhältnis erhalten
  const maxB = 200
  const maxH = 70
  const faktor = Math.min(maxB / sig.width, maxH / sig.height, 1)
  const sigB = sig.width * faktor
  const sigH = sig.height * faktor
  seite.drawImage(sig, { x: LINKS, y: y - sigH, width: sigB, height: sigH })
  y -= sigH + 6
  seite.drawLine({ start: { x: LINKS, y }, end: { x: LINKS + 220, y }, thickness: 0.5, color: SCHWARZ })
  y -= 12
  text(`Unterschrift ${payload.person.name}`, LINKS, y, 9, false, GRAU)
  if (payload.ausgeberName) {
    y -= 14
    text(`${istAusgabe ? 'Ausgegeben' : 'Entgegengenommen'} durch: ${payload.ausgeberName}`, LINKS, y, 9, false, GRAU)
  }

  // ── Fußzeile: Signaturzeitpunkt + Prüfsumme ──
  const fussY = 64
  seite.drawLine({ start: { x: LINKS, y: fussY + 24 }, end: { x: RECHTS, y: fussY + 24 }, thickness: 0.5, color: GRAU })
  const zeitpunkt = signiertAm.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  text(`Digital signiert am ${zeitpunkt} Uhr · Beleg-Nr. ${payload.belegId}`, LINKS, fussY + 10, 8, false, GRAU)
  text(`Prüfsumme (SHA-256): ${hash}`, LINKS, fussY, 7, false, GRAU)

  return doc.save()
}
