// DIN-A4-PDFs für die Heft-Verteilung der DJK Info (druckfertige Listen für
// die Austräger und Verantwortlichen). Aufbau auf den Briefkopf-Primitiven
// aus src/lib/pdf-brief.ts.
//
// Ziele:
//   gesamt      — eine Übersicht: alle Bereiche + Verteilerliste + Summen
//   alle        — Sammel-PDF: Übersicht + je Bereich eine eigene Seite
//   ottenhofen  — je Ottenhofener Austragegebiet eine Seite (mit Straßenliste)
//   auslagen    — alle Auslagestellen auf einer Seite
//   postversand — Postversand-Seite
//   <gebietId>  — einzelnes Gebiet/Ortsteil als eigene Seite

import { PDFDocument, PDFPage } from 'pdf-lib'
import {
  A4, LINKS, RECHTS, GRAU, SCHWARZ,
  BriefFonts, ladeBriefFonts, textZeichner, zeichneBriefkopf,
} from './pdf-brief'
import { PACKEINHEIT, PAECKCHEN, PAKET } from '@/data/djk-info'

export interface GebietFuerPdf {
  id: string
  name: string
  kategorie: string
  beschreibung: string | null
  hefte: number
  strassen: { name: string; hefte: number }[]
}

export interface VerteilerFuerPdf {
  person: string
  zustaendigkeit: string
  stueckzahl: number
  verguetung: string
  betrag: number | null
}

export interface VerteilungsDaten {
  gebiete: GebietFuerPdf[]
  verteiler: VerteilerFuerPdf[]
  vereinsname: string
}

const KATEGORIE_LABEL: Record<string, string> = {
  gebiet: 'Austragegebiet Ottenhofen',
  ortsteil: 'Ortsteil',
  auslage: 'Auslagestelle',
  postversand: 'Postversand',
}

function einheiten(hefte: number): string {
  return (hefte / PACKEINHEIT).toLocaleString('de-DE', { maximumFractionDigits: 1 })
}

function datumHeute(): string {
  return new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Seiten-Cursor mit automatischem Umbruch (für die Gesamtübersicht)
class Zeichner {
  seite: PDFPage
  y = 0
  private letzteBaseline = 0
  constructor(private doc: PDFDocument, private fonts: BriefFonts, private vereinsname: string) {
    this.seite = doc.addPage([A4.breite, A4.hoehe])
  }
  async initKopf(titel: string, untertitel?: string) {
    await zeichneBriefkopf(this.doc, this.seite, this.fonts, { vereinsname: this.vereinsname, kopfKontaktblock: '' })
    const { text } = textZeichner(this.seite, this.fonts)
    this.y = A4.hoehe - 150
    text(titel, LINKS, this.y, 14, true)
    this.y -= 16
    text(untertitel ?? `Stand: ${datumHeute()}`, LINKS, this.y, 9, false, GRAU)
    this.y -= 24
  }
  private neueSeite() {
    this.seite = this.doc.addPage([A4.breite, A4.hoehe])
    this.y = A4.hoehe - 60
  }
  zeile(fn: (text: ReturnType<typeof textZeichner>['text'], textRechts: ReturnType<typeof textZeichner>['textRechts'], y: number) => void, hoehe = 16) {
    if (this.y < 80) this.neueSeite()
    const { text, textRechts } = textZeichner(this.seite, this.fonts)
    fn(text, textRechts, this.y)
    this.letzteBaseline = this.y
    this.y -= hoehe
  }
  // Linie knapp unter der zuletzt geschriebenen Zeile (nie durch Text)
  linie(dick = false) {
    const yLinie = this.letzteBaseline - 4
    if (yLinie < 70) return
    this.seite.drawLine({
      start: { x: LINKS, y: yLinie },
      end: { x: RECHTS, y: yLinie },
      thickness: dick ? 0.75 : 0.5,
      color: dick ? SCHWARZ : GRAU,
    })
    if (this.y > yLinie - 12) this.y = yLinie - 12
  }
  abstand(px = 12) {
    this.y -= px
  }
}

// Eine Seite für ein einzelnes Gebiet / einen Ortsteil (Handzettel)
async function seiteFuerGebiet(doc: PDFDocument, fonts: BriefFonts, gebiet: GebietFuerPdf, vereinsname: string) {
  const seite = doc.addPage([A4.breite, A4.hoehe])
  await zeichneBriefkopf(doc, seite, fonts, { vereinsname, kopfKontaktblock: '' })
  const { text, textRechts } = textZeichner(seite, fonts)

  let y = A4.hoehe - 150
  text(`DJK Info — Verteilung: ${gebiet.name}`, LINKS, y, 14, true)
  y -= 16
  text(`${KATEGORIE_LABEL[gebiet.kategorie] ?? gebiet.kategorie} · Stand: ${datumHeute()}`, LINKS, y, 9, false, GRAU)
  if (gebiet.beschreibung) {
    y -= 14
    text(gebiet.beschreibung, LINKS, y, 10, false, GRAU)
  }

  y -= 28
  text('Verteilung durch:', LINKS, y, 11)
  seite.drawLine({ start: { x: LINKS + 95, y: y - 2 }, end: { x: LINKS + 320, y: y - 2 }, thickness: 0.5, color: GRAU })

  y -= 30
  if (gebiet.strassen.length > 0) {
    text('Straße', LINKS, y, 10, true)
    textRechts('Hefte', LINKS + 320, y, 10, true)
    y -= 6
    seite.drawLine({ start: { x: LINKS, y }, end: { x: LINKS + 320, y }, thickness: 0.75, color: SCHWARZ })
    y -= 16
    for (const s of gebiet.strassen) {
      text(s.name, LINKS, y)
      textRechts(String(s.hefte), LINKS + 320, y)
      y -= 16
    }
    seite.drawLine({ start: { x: LINKS, y: y + 10 }, end: { x: LINKS + 320, y: y + 10 }, thickness: 0.5, color: GRAU })
    y -= 4
    const summe = gebiet.strassen.reduce((s, x) => s + x.hefte, 0)
    text('Summe Straßen', LINKS, y, 11, true)
    textRechts(String(summe), LINKS + 320, y, 11, true)
    y -= 20
  }

  text(`Hefte gesamt: ${gebiet.hefte}`, LINKS, y, 12, true)
  y -= 16
  text(`= ${einheiten(gebiet.hefte)} Einheiten à ${PACKEINHEIT} Hefte`, LINKS, y, 10, false, GRAU)

  // Fußnote Packeinheiten
  const fussnote = `Packeinheiten: 1 Einheit mit Paketband = ${PACKEINHEIT} Hefte · 1 kleines Päckchen = ${PAECKCHEN} Hefte · 1 Paket = ${PAKET} Hefte`
  text(fussnote, LINKS, 60, 8, false, GRAU)
}

// Eine Seite für eine ganze Kategorie (Auslagestellen bzw. Postversand)
async function seiteFuerKategorie(
  doc: PDFDocument,
  fonts: BriefFonts,
  kategorie: 'auslage' | 'postversand',
  gebiete: GebietFuerPdf[],
  vereinsname: string,
) {
  const eintraege = gebiete.filter(g => g.kategorie === kategorie)
  const seite = doc.addPage([A4.breite, A4.hoehe])
  await zeichneBriefkopf(doc, seite, fonts, { vereinsname, kopfKontaktblock: '' })
  const { text, textRechts } = textZeichner(seite, fonts)

  const titel = kategorie === 'auslage' ? 'Auslagestellen' : 'Postversand'
  let y = A4.hoehe - 150
  text(`DJK Info — Verteilung: ${titel}`, LINKS, y, 14, true)
  y -= 16
  text(`Stand: ${datumHeute()}`, LINKS, y, 9, false, GRAU)

  y -= 28
  text(kategorie === 'auslage' ? 'Auslagestelle' : 'Empfänger/Bereich', LINKS, y, 10, true)
  textRechts('Hefte', RECHTS, y, 10, true)
  y -= 6
  seite.drawLine({ start: { x: LINKS, y }, end: { x: RECHTS, y }, thickness: 0.75, color: SCHWARZ })
  y -= 16
  for (const g of eintraege) {
    text(g.name, LINKS, y)
    textRechts(String(g.hefte), RECHTS, y)
    if (g.beschreibung) {
      y -= 13
      text(g.beschreibung, LINKS + 12, y, 8.5, false, GRAU)
    }
    y -= 18
  }
  seite.drawLine({ start: { x: LINKS, y: y + 12 }, end: { x: RECHTS, y: y + 12 }, thickness: 0.5, color: GRAU })
  y -= 2
  const summe = eintraege.reduce((s, g) => s + g.hefte, 0)
  text('Summe', LINKS, y, 11, true)
  textRechts(String(summe), RECHTS, y, 11, true)
}

// Gesamtübersicht (alle Bereiche + Verteilerliste + Summen)
async function seitenGesamt(doc: PDFDocument, fonts: BriefFonts, daten: VerteilungsDaten) {
  const z = new Zeichner(doc, fonts, daten.vereinsname)
  await z.initKopf('DJK Info — Verteilübersicht')

  // Bereiche
  z.zeile((text, textRechts, y) => {
    text('Bereich', LINKS, y, 10, true)
    text('Art', LINKS + 240, y, 10, true)
    textRechts('Hefte', RECHTS - 90, y, 10, true)
    textRechts(`Einheiten à ${PACKEINHEIT}`, RECHTS, y, 10, true)
  }, 6)
  z.linie(true)
  // Kurze Art-Labels, damit die Spalte nicht in die Heftzahlen läuft
  const KURZ_LABEL: Record<string, string> = {
    gebiet: 'Austragegebiet', ortsteil: 'Ortsteil', auslage: 'Auslagestelle', postversand: 'Postversand',
  }
  let summeGebiete = 0
  for (const g of daten.gebiete) {
    summeGebiete += g.hefte
    z.zeile((text, textRechts, y) => {
      text(g.name, LINKS, y)
      text(KURZ_LABEL[g.kategorie] ?? g.kategorie, LINKS + 250, y, 9, false, GRAU)
      textRechts(String(g.hefte), RECHTS - 90, y)
      textRechts(einheiten(g.hefte), RECHTS, y)
    })
  }
  z.linie()
  z.zeile((text, textRechts, y) => {
    text('Gesamt', LINKS, y, 11, true)
    textRechts(String(summeGebiete), RECHTS - 90, y, 11, true)
    textRechts(einheiten(summeGebiete), RECHTS, y, 11, true)
  }, 20)

  z.abstand(16)

  // Verteilerliste
  z.zeile((text, _r, y) => text('Verteilerliste — wer trägt was aus?', LINKS, y, 12, true), 20)
  z.zeile((text, textRechts, y) => {
    text('Person', LINKS, y, 10, true)
    text('Zuständigkeit', LINKS + 130, y, 10, true)
    textRechts('Stück', RECHTS, y, 10, true)
  }, 6)
  z.linie(true)
  let summeVerteiler = 0
  for (const v of daten.verteiler) {
    summeVerteiler += v.stueckzahl
    z.zeile((text, textRechts, y) => {
      text(v.person || 'noch offen', LINKS, y, 10, !v.person ? false : false, v.person ? SCHWARZ : GRAU)
      // Zuständigkeit ggf. kürzen, damit die Zeile nicht in die Stückzahl läuft
      const max = 68
      const zust = v.zustaendigkeit.length > max ? v.zustaendigkeit.slice(0, max - 1) + '…' : v.zustaendigkeit
      text(zust, LINKS + 130, y, 9)
      textRechts(String(v.stueckzahl), RECHTS, y, 10)
    })
  }
  z.linie()
  z.zeile((text, textRechts, y) => {
    text('Gesamt', LINKS, y, 11, true)
    textRechts(String(summeVerteiler), RECHTS, y, 11, true)
  }, 20)

  z.abstand(8)
  z.zeile((text, _r, y) => {
    text(
      `Packeinheiten: 1 Einheit mit Paketband = ${PACKEINHEIT} Hefte · 1 kleines Päckchen = ${PAECKCHEN} Hefte · 1 Paket = ${PAKET} Hefte`,
      LINKS, y, 8, false, GRAU,
    )
  })
}

export async function erzeugeVerteilungsPdf(
  ziel: string,
  daten: VerteilungsDaten,
): Promise<{ pdf: Uint8Array; dateiname: string }> {
  const doc = await PDFDocument.create()
  const fonts = await ladeBriefFonts(doc)
  let dateiname = 'DJK-Info-Verteilung.pdf'

  const ottenhofener = daten.gebiete.filter(g => g.kategorie === 'gebiet')

  if (ziel === 'gesamt') {
    await seitenGesamt(doc, fonts, daten)
    dateiname = 'DJK-Info-Verteiluebersicht.pdf'
  } else if (ziel === 'alle') {
    // Übersicht + je Bereich eine eigene Seite (druckfertig zum Austeilen)
    await seitenGesamt(doc, fonts, daten)
    for (const g of ottenhofener) await seiteFuerGebiet(doc, fonts, g, daten.vereinsname)
    for (const g of daten.gebiete.filter(x => x.kategorie === 'ortsteil')) {
      await seiteFuerGebiet(doc, fonts, g, daten.vereinsname)
    }
    if (daten.gebiete.some(g => g.kategorie === 'auslage')) {
      await seiteFuerKategorie(doc, fonts, 'auslage', daten.gebiete, daten.vereinsname)
    }
    if (daten.gebiete.some(g => g.kategorie === 'postversand')) {
      await seiteFuerKategorie(doc, fonts, 'postversand', daten.gebiete, daten.vereinsname)
    }
    dateiname = 'DJK-Info-Verteilung-alle-Listen.pdf'
  } else if (ziel === 'ottenhofen') {
    for (const g of ottenhofener) await seiteFuerGebiet(doc, fonts, g, daten.vereinsname)
    dateiname = 'DJK-Info-Verteilung-Ottenhofen.pdf'
  } else if (ziel === 'auslagen') {
    await seiteFuerKategorie(doc, fonts, 'auslage', daten.gebiete, daten.vereinsname)
    dateiname = 'DJK-Info-Verteilung-Auslagestellen.pdf'
  } else if (ziel === 'postversand') {
    await seiteFuerKategorie(doc, fonts, 'postversand', daten.gebiete, daten.vereinsname)
    dateiname = 'DJK-Info-Verteilung-Postversand.pdf'
  } else {
    const gebiet = daten.gebiete.find(g => g.id === ziel)
    if (!gebiet) throw new Error('Unbekanntes PDF-Ziel')
    await seiteFuerGebiet(doc, fonts, gebiet, daten.vereinsname)
    dateiname = `DJK-Info-Verteilung-${gebiet.name.replace(/[^\wäöüÄÖÜß-]+/g, '-')}.pdf`
  }

  return { pdf: await doc.save(), dateiname }
}
