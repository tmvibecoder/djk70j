import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { DK_KATEGORIE_LABELS, zahlbetrag } from '@/lib/dauerkarten-felder'
import type { DkKategorie } from '@/lib/dauerkarten-felder'
import { DkQuittungPayload, quittungHash, zahlungsText } from '@/lib/dauerkarten-quittung'
import { erzeugeDkQuittungPdf } from '@/lib/dauerkarten-pdf'
import { quittungPdfPfad, speichereDatei, unterschriftPfad, loescheDatei } from '@/lib/dauerkarten-dateien'

// Karte ausgeben — zwei Wege:
// a) mit Finger-Unterschrift (body.unterschrift = PNG-DataURL): kanonischen
//    Payload einfrieren, SHA-256-Prüfsumme bilden, Quittungs-PDF erzeugen
//    (Muster Schlüssel-Beleg). Danach unveränderlich (409 bei erneutem Aufruf).
// b) ohne elektronische Signatur (body.ohneSignatur = true): Papier-Ausgabe
//    über die Verteilerliste — nur Status + Vermerk, keine Quittung.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const karte = await prisma.dkKarte.findUnique({
    where: { id: params.id },
    include: { inhaber: true, saison: true },
  })
  if (!karte) return NextResponse.json({ error: 'Karte nicht gefunden' }, { status: 404 })
  if (karte.status === 'ausgegeben') {
    return NextResponse.json({ error: 'Karte ist bereits ausgegeben' }, { status: 409 })
  }
  if (karte.kategorie === 'druck') {
    return NextResponse.json({ error: 'Nur-Druck-Karten werden nicht über die Ausgabe quittiert' }, { status: 400 })
  }

  // Weg b: Papier-Ausgabe ohne elektronische Signatur
  if (body.ohneSignatur === true) {
    const gespeichert = await prisma.dkKarte.update({
      where: { id: karte.id },
      data: { status: 'ausgegeben', ohneSignatur: true, ausgabeDatum: new Date() },
      include: { inhaber: true },
    })
    return NextResponse.json(gespeichert)
  }

  // Weg a: Finger-Unterschrift
  const dataUrl: string = typeof body.unterschrift === 'string' ? body.unterschrift : ''
  const prefix = 'data:image/png;base64,'
  if (!dataUrl.startsWith(prefix)) {
    return NextResponse.json({ error: 'Unterschrift (PNG) erforderlich' }, { status: 400 })
  }
  let png: Buffer
  try {
    png = Buffer.from(dataUrl.slice(prefix.length), 'base64')
  } catch {
    return NextResponse.json({ error: 'Unterschrift konnte nicht gelesen werden' }, { status: 400 })
  }
  if (png.length === 0 || png.length > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Unterschrift leer oder zu groß' }, { status: 400 })
  }

  const payload: DkQuittungPayload = {
    karteId: karte.id,
    saison: karte.saison.bezeichnung,
    lfdNr: karte.lfdNr,
    kartennummer: karte.kartennummer,
    inhaberName: `${karte.inhaber.vorname} ${karte.inhaber.nachname}`,
    kategorie: DK_KATEGORIE_LABELS[karte.kategorie as DkKategorie] ?? karte.kategorie,
    preis: karte.preis,
    abweichung: karte.abweichung,
    zahlbetrag: zahlbetrag(karte),
    zahlungsText: zahlungsText(karte),
    verteiler: karte.verteiler,
    erstelltAm: new Date().toISOString(),
  }
  const payloadJson = JSON.stringify(payload)
  const signiertAm = new Date()
  const hash = quittungHash(payloadJson, png, signiertAm.toISOString())

  const sigPfad = unterschriftPfad(karte.id)
  const pdfPfadWert = quittungPdfPfad(karte.id)
  await speichereDatei(sigPfad, png)
  const pdf = await erzeugeDkQuittungPdf(payload, png, signiertAm, hash)
  await speichereDatei(pdfPfadWert, pdf)

  const gespeichert = await prisma.dkKarte.update({
    where: { id: karte.id },
    data: {
      status: 'ausgegeben',
      ohneSignatur: false,
      ausgabeDatum: signiertAm,
      payloadJson,
      unterschriftPfad: sigPfad,
      pdfPfad: pdfPfadWert,
      hash,
      signiertAm,
    },
    include: { inhaber: true },
  })
  return NextResponse.json({ ...gespeichert, hash })
}

// Ausgabe zurücknehmen (Fehlbedienung) — nur "verwalten": Status zurück auf
// angelegt, Signatur/Quittung werden gelöscht.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'verwalten')
  if (verboten) return verboten

  const karte = await prisma.dkKarte.findUnique({ where: { id: params.id } })
  if (!karte) return NextResponse.json({ error: 'Karte nicht gefunden' }, { status: 404 })

  if (karte.unterschriftPfad) await loescheDatei(karte.unterschriftPfad)
  if (karte.pdfPfad) await loescheDatei(karte.pdfPfad)
  const gespeichert = await prisma.dkKarte.update({
    where: { id: karte.id },
    data: {
      status: 'angelegt',
      ohneSignatur: false,
      ausgabeDatum: null,
      payloadJson: '',
      unterschriftPfad: null,
      pdfPfad: null,
      hash: null,
      signiertAm: null,
    },
    include: { inhaber: true },
  })
  return NextResponse.json(gespeichert)
}
