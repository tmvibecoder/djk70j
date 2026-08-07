// PDF-Erzeugung für den Dauerkarten-Bereich mit pdf-lib (Muster
// lib/beleg-pdf.ts): Briefkopf mit Wappen/Verbandslogo, Helvetica (WinAnsi
// deckt Umlaute, ß und € ab).
//
// Vier Dokumente:
// 1. Quittung (Empfangsbestätigung je Karte, mit Finger-Unterschrift + Hash)
// 2. Verteilerliste je Austeiler (mit Unterschriftenfeld für Papier-Ausgabe)
// 3. Platzkassierer-Liste (nach Nachname, nur ausgegebene Karten)
// 4. Saison-Abrechnung (gleiche Zahlen wie der Abrechnungs-Tab)

import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'
import { WAPPEN_JPEG_BASE64, VERBAND_JPEG_BASE64 } from './rechnung-assets'
import type { DkQuittungPayload } from './dauerkarten-quittung'
import type { DkAbrechnung } from './dauerkarten-abrechnung'

const A4 = { breite: 595.28, hoehe: 841.89 }
const LINKS = 71
const RECHTS = A4.breite - 71
const SCHWARZ = rgb(0, 0, 0)
const GRAU = rgb(0.35, 0.35, 0.35)
const HELLGRAU = rgb(0.75, 0.75, 0.75)

function euro(n: number): string {
  return `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

function datumDe(d: Date): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

interface PdfKontext {
  doc: PDFDocument
  font: PDFFont
  fontFett: PDFFont
}

async function neuesDokument(): Promise<PdfKontext> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontFett = await doc.embedFont(StandardFonts.HelveticaBold)
  return { doc, font, fontFett }
}

// Briefkopf (Wappen links, Verbandslogo rechts, Vereinsname mittig) —
// liefert die Start-Y-Position für den Inhalt
async function briefkopf(ctx: PdfKontext, seite: PDFPage): Promise<number> {
  const kopfOben = A4.hoehe - 45
  const wappen = await ctx.doc.embedJpg(WAPPEN_JPEG_BASE64)
  seite.drawImage(wappen, { x: LINKS, y: kopfOben - 58, width: 54, height: 58 })
  const verband = await ctx.doc.embedJpg(VERBAND_JPEG_BASE64)
  seite.drawImage(verband, { x: RECHTS - 60, y: kopfOben - 47, width: 60, height: 47 })
  const titel = 'DJK SG Ottenhofen e.V.'
  const titelBreite = ctx.fontFett.widthOfTextAtSize(titel, 16)
  seite.drawText(titel, { x: (A4.breite - titelBreite) / 2, y: kopfOben - 34, size: 16, font: ctx.fontFett })
  return A4.hoehe - 160
}

// ── 1. Quittung (Empfangsbestätigung) ──────────────────────────────────────

export async function erzeugeDkQuittungPdf(
  payload: DkQuittungPayload,
  unterschriftPng: Buffer | Uint8Array,
  signiertAm: Date,
  hash: string,
): Promise<Uint8Array> {
  const ctx = await neuesDokument()
  const seite = ctx.doc.addPage([A4.breite, A4.hoehe])
  const text = (t: string, x: number, y: number, groesse = 11, fett = false, farbe = SCHWARZ) => {
    seite.drawText(t, { x, y, size: groesse, font: fett ? ctx.fontFett : ctx.font, color: farbe })
  }

  let y = await briefkopf(ctx, seite)
  text(`Empfangsbestätigung — Dauerkarte Saison ${payload.saison}`, LINKS, y, 14, true)
  y -= 18
  text(
    `Ottenhofen, ${signiertAm.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    LINKS, y, 10, false, GRAU,
  )

  // Empfänger
  y -= 32
  text('Karteninhaber:', LINKS, y, 10, true)
  y -= 16
  text(payload.inhaberName, LINKS, y, 12, true)

  // Kartendaten
  y -= 28
  const zeilen: [string, string][] = [
    ['Kartennummer', payload.kartennummer],
    ['Laufende Nummer', String(payload.lfdNr)],
    ['Kategorie', payload.kategorie],
    ['Kartenpreis', euro(payload.preis)],
  ]
  if (payload.abweichung !== 0) {
    zeilen.push(['Abweichung (Spende/Abzug)', euro(payload.abweichung)])
    zeilen.push(['Zahlbetrag', euro(payload.zahlbetrag)])
  }
  for (const [label, wert] of zeilen) {
    text(label, LINKS, y, 10, false, GRAU)
    text(wert, LINKS + 180, y, 11)
    y -= 17
  }

  // Zahlung — der Text steht wörtlich so im signierten Payload
  y -= 8
  seite.drawLine({ start: { x: LINKS, y: y + 8 }, end: { x: RECHTS, y: y + 8 }, thickness: 0.5, color: GRAU })
  for (const zeile of zeilenUmbruch(payload.zahlungsText, ctx.fontFett, 11, RECHTS - LINKS)) {
    text(zeile, LINKS, y - 6, 11, true)
    y -= 15
  }

  // Bestätigungstext
  y -= 24
  const bestaetigung = `Hiermit bestätige ich, ${payload.inhaberName}, den Empfang der oben aufgeführten Dauerkarte der DJK SG Ottenhofen e.V. für die Saison ${payload.saison}.`
  for (const zeile of zeilenUmbruch(bestaetigung, ctx.font, 10.5, RECHTS - LINKS)) {
    text(zeile, LINKS, y, 10.5)
    y -= 14
  }

  // Unterschrift
  y -= 30
  const sig = await ctx.doc.embedPng(unterschriftPng)
  const faktor = Math.min(200 / sig.width, 70 / sig.height, 1)
  const sigB = sig.width * faktor
  const sigH = sig.height * faktor
  seite.drawImage(sig, { x: LINKS, y: y - sigH, width: sigB, height: sigH })
  y -= sigH + 6
  seite.drawLine({ start: { x: LINKS, y }, end: { x: LINKS + 220, y }, thickness: 0.5, color: SCHWARZ })
  y -= 12
  text(`Unterschrift ${payload.inhaberName}`, LINKS, y, 9, false, GRAU)
  if (payload.verteiler) {
    y -= 14
    text(`Ausgegeben durch: ${payload.verteiler}`, LINKS, y, 9, false, GRAU)
  }

  // Fußzeile: Signaturzeitpunkt + Prüfsumme
  const fussY = 64
  seite.drawLine({ start: { x: LINKS, y: fussY + 24 }, end: { x: RECHTS, y: fussY + 24 }, thickness: 0.5, color: GRAU })
  const zeitpunkt = signiertAm.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  text(`Digital signiert am ${zeitpunkt} Uhr · Karte ${payload.karteId}`, LINKS, fussY + 10, 8, false, GRAU)
  text(`Prüfsumme (SHA-256): ${hash}`, LINKS, fussY, 7, false, GRAU)

  return ctx.doc.save()
}

// ── Gemeinsamer Tabellen-Renderer mit Seitenumbruch ────────────────────────

interface Spalte {
  titel: string
  x: number // Offset ab LINKS
  breite: number
  rechts?: boolean // rechtsbündig
}

interface TabellenOptionen {
  titel: string
  untertitel: string
  spalten: Spalte[]
  zeilen: string[][]
  zeilenHoehe?: number
  zeileTrennlinie?: boolean
}

async function erzeugeListenPdf(opt: TabellenOptionen): Promise<Uint8Array> {
  const ctx = await neuesDokument()
  const zeilenHoehe = opt.zeilenHoehe ?? 22

  let seite = ctx.doc.addPage([A4.breite, A4.hoehe])
  let y = await briefkopf(ctx, seite)
  const text = (t: string, x: number, ty: number, groesse = 10, fett = false, farbe = SCHWARZ) => {
    seite.drawText(t, { x, y: ty, size: groesse, font: fett ? ctx.fontFett : ctx.font, color: farbe })
  }

  const kopfzeile = () => {
    for (const s of opt.spalten) {
      const tx = s.rechts
        ? LINKS + s.x + s.breite - ctx.fontFett.widthOfTextAtSize(s.titel, 9)
        : LINKS + s.x
      text(s.titel, tx, y, 9, true, GRAU)
    }
    y -= 6
    seite.drawLine({ start: { x: LINKS, y }, end: { x: RECHTS, y }, thickness: 0.75, color: SCHWARZ })
    y -= 4
  }

  text(opt.titel, LINKS, y, 14, true)
  y -= 16
  text(opt.untertitel, LINKS, y, 10, false, GRAU)
  y -= 26
  kopfzeile()

  for (const zeile of opt.zeilen) {
    if (y < 80) {
      seite = ctx.doc.addPage([A4.breite, A4.hoehe])
      y = A4.hoehe - 60
      text(`${opt.titel} (Fortsetzung)`, LINKS, y, 11, true)
      y -= 24
      kopfzeile()
    }
    y -= zeilenHoehe - 8
    zeile.forEach((wert, i) => {
      const s = opt.spalten[i]
      const kuerzung = kuerzeText(wert, ctx.font, 10, s.breite)
      const tx = s.rechts
        ? LINKS + s.x + s.breite - ctx.font.widthOfTextAtSize(kuerzung, 10)
        : LINKS + s.x
      text(kuerzung, tx, y, 10)
    })
    y -= 8
    if (opt.zeileTrennlinie !== false) {
      seite.drawLine({ start: { x: LINKS, y }, end: { x: RECHTS, y }, thickness: 0.4, color: HELLGRAU })
    }
  }

  return ctx.doc.save()
}

function kuerzeText(text: string, font: PDFFont, groesse: number, maxBreite: number): string {
  if (font.widthOfTextAtSize(text, groesse) <= maxBreite) return text
  let t = text
  while (t.length > 1 && font.widthOfTextAtSize(`${t}…`, groesse) > maxBreite) {
    t = t.slice(0, -1)
  }
  return `${t}…`
}

// ── 2. Verteilerliste je Austeiler ─────────────────────────────────────────

export interface DkVerteilerZeile {
  kartennummer: string
  vorname: string
  nachname: string
  preis: number
  quittiert: string // '' = Unterschriftenfeld frei | Hinweis "elektronisch quittiert" o.ä.
}

export async function erzeugeVerteilerlistePdf(
  verteiler: string,
  saison: string,
  zeilen: DkVerteilerZeile[],
  stand: Date,
): Promise<Uint8Array> {
  return erzeugeListenPdf({
    titel: `Dauerkarten-Ausgabeliste — ${verteiler}`,
    untertitel: `Saison ${saison} · Stand ${datumDe(stand)} · ${zeilen.length} Karten · Unterschrift nur nötig, wenn die Karte ohne das Tool ausgegeben wird`,
    spalten: [
      { titel: 'Karten-Nr.', x: 0, breite: 60 },
      { titel: 'Vorname', x: 65, breite: 105 },
      { titel: 'Nachname', x: 175, breite: 115 },
      { titel: 'Preis', x: 295, breite: 45, rechts: true },
      { titel: 'Unterschrift Empfänger', x: 355, breite: 100 },
    ],
    zeilen: zeilen.map(z => [z.kartennummer, z.vorname, z.nachname, euro(z.preis), z.quittiert]),
    zeilenHoehe: 26, // Platz zum Unterschreiben
  })
}

// ── 3. Platzkassierer-Liste (nach Nachname, nur ausgegebene Karten) ────────

export interface DkKassiererZeile {
  nachname: string
  vorname: string
  kartennummer: string
}

export async function erzeugeKassiererlistePdf(
  saison: string,
  zeilen: DkKassiererZeile[],
  stand: Date,
): Promise<Uint8Array> {
  return erzeugeListenPdf({
    titel: 'Dauerkarten — Liste für Platzkassierer',
    untertitel: `Saison ${saison} · Stand ${datumDe(stand)} · ${zeilen.length} ausgegebene Karten, sortiert nach Nachname`,
    spalten: [
      { titel: 'Nachname', x: 0, breite: 170 },
      { titel: 'Vorname', x: 180, breite: 170 },
      { titel: 'Karten-Nr.', x: 360, breite: 80 },
    ],
    zeilen: zeilen.map(z => [z.nachname, z.vorname, z.kartennummer]),
    zeilenHoehe: 20,
  })
}

// ── 4. Saison-Abrechnung ───────────────────────────────────────────────────

export async function erzeugeAbrechnungPdf(a: DkAbrechnung, stand: Date): Promise<Uint8Array> {
  const ctx = await neuesDokument()
  const seite = ctx.doc.addPage([A4.breite, A4.hoehe])
  const text = (t: string, x: number, y: number, groesse = 10.5, fett = false, farbe = SCHWARZ) => {
    seite.drawText(t, { x, y, size: groesse, font: fett ? ctx.fontFett : ctx.font, color: farbe })
  }
  const zeile = (y: number, label: string, mitte: string, betrag: string, fett = false) => {
    text(label, LINKS, y, 10.5, fett)
    if (mitte) text(mitte, LINKS + 250, y, 10.5, false, GRAU)
    text(betrag, RECHTS - ctx[fett ? 'fontFett' : 'font'].widthOfTextAtSize(betrag, 10.5), y, 10.5, fett)
  }
  const linie = (y: number, dick = false) =>
    seite.drawLine({ start: { x: LINKS, y }, end: { x: RECHTS, y }, thickness: dick ? 0.75 : 0.4, color: dick ? SCHWARZ : HELLGRAU })

  let y = await briefkopf(ctx, seite)
  text(`Dauerkarten-Abrechnung — Saison ${a.saison}`, LINKS, y, 14, true)
  y -= 16
  text(`Stand ${datumDe(stand)} · ${a.anzahlKarten} Karten (zzgl. ${a.anzahlDruck} Nur-Druck)`, LINKS, y, 10, false, GRAU)

  // Einnahmen
  y -= 34
  text('Einnahmen', LINKS, y, 11, true)
  y -= 8
  linie(y, true)
  y -= 18
  zeile(y, 'Erwachsene (Normalpreis)', `${a.verkauft.normal.anzahl} × ${euro(a.preisNormal)}`, euro(a.verkauft.normal.summe))
  y -= 17
  zeile(y, 'Ermäßigt (Rentner, Frauen, Schwerbehinderte)', `${a.verkauft.ermaessigt.anzahl} × ${euro(a.preisErmaessigt)}`, euro(a.verkauft.ermaessigt.summe))
  y -= 17
  zeile(y, 'Sonderpreis (Verkauf während der Saison)', `${a.verkauft.sonderpreis.anzahl} Karten`, euro(a.verkauft.sonderpreis.summe))
  y -= 17
  zeile(y, 'Zusatzzahlungen / Abzüge (Spenden, Rundungen)', '', euro(a.zusatzzahlungen))
  y -= 8
  linie(y)
  y -= 17
  zeile(y, `Gesamteinnahmen (${a.verkauft.gesamtAnzahl} verkaufte Karten)`, '', euro(a.gesamtEinnahmen), true)

  // Kartenstatus
  y -= 34
  text('Kartenstatus', LINKS, y, 11, true)
  y -= 8
  linie(y, true)
  y -= 18
  zeile(y, 'Geschenkte Karten', '', String(a.geschenke))
  y -= 17
  zeile(y, 'Noch offene Zahlungen', `${a.offen.anzahl} Karten`, euro(a.offen.summe))
  y -= 17
  zeile(y, 'Noch nicht ausgegebene Karten', '', String(a.nichtAusgegeben))

  // Wo ist das Geld?
  y -= 34
  text('Wo ist das Geld?', LINKS, y, 11, true)
  y -= 8
  linie(y, true)
  y -= 18
  zeile(y, 'Bar', '', euro(a.zahlarten.bar))
  y -= 17
  zeile(y, 'Überweisung (Privatkonto Kassier, wie Bargeld)', '', euro(a.zahlarten.ueberweisung))
  y -= 17
  zeile(y, 'PayPal (Privatkonto Kassier, wie Bargeld)', '', euro(a.zahlarten.paypal))
  y -= 8
  linie(y)
  y -= 17
  zeile(y, 'Summe Bargeldtopf', '', euro(a.bargeldtopf), true)
  y -= 17
  zeile(y, '- Einzahlungen aufs Vereinskonto', '', euro(a.einzahlungenSumme))
  y -= 17
  zeile(y, 'Noch im Topf', '', euro(a.topfRest), true)
  y -= 26
  zeile(y, `POS-Zahlungen direkt aufs Vereinskonto (${a.zahlarten.posAnzahl} Stück)`, '', euro(a.kontoPos), true)

  // Einzahlungen
  if (a.einzahlungen.length > 0) {
    y -= 34
    text('Einzahlungen aufs Vereinskonto', LINKS, y, 11, true)
    y -= 8
    linie(y, true)
    for (const e of a.einzahlungen) {
      y -= 18
      zeile(y, datumDe(new Date(e.datum)), e.notiz, euro(e.betrag))
    }
  }

  return ctx.doc.save()
}
