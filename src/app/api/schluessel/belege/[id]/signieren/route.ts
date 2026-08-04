import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { belegHash, BelegPayload } from '@/lib/beleg-hash'
import { erzeugeBelegPdf } from '@/lib/beleg-pdf'
import { speichereDatei, unterschriftPfad, pdfPfad } from '@/lib/schluessel-dateien'

// Signieren eines offenen Belegs: Unterschrift-PNG speichern, kanonischen
// Payload einfrieren, SHA-256-Prüfsumme bilden, PDF erzeugen. Erst danach
// wechselt der Beleg auf „signiert". Bereits signierte Belege sind
// unveränderlich (409).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}))
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

  const beleg = await prisma.schluesselBeleg.findUnique({
    where: { id: params.id },
    include: {
      person: true,
      ausgaben: { include: { exemplar: { include: { typ: true } } } },
      rueckgaben: { include: { exemplar: { include: { typ: true } } } },
    },
  })
  if (!beleg) {
    return NextResponse.json({ error: 'Beleg nicht gefunden' }, { status: 404 })
  }
  if (beleg.status === 'signiert') {
    return NextResponse.json({ error: 'Beleg ist bereits signiert' }, { status: 409 })
  }

  const einstellung = await prisma.schluesselEinstellung.findUnique({ where: { id: 'schluessel' } })
  const positionen = (beleg.art === 'ausgabe' ? beleg.ausgaben : beleg.rueckgaben).map(a => ({
    schluessel: [a.exemplar.typ.code, a.exemplar.typ.bezeichnung].filter(Boolean).join(' — '),
    nummer: a.exemplar.nummer,
  }))
  const pfandBetrag =
    beleg.art === 'ausgabe'
      ? beleg.ausgaben.reduce((s, a) => s + a.pfandBetrag, 0)
      : beleg.rueckgaben.reduce((s, a) => s + a.pfandZurueck, 0)

  const payload: BelegPayload = {
    belegId: beleg.id,
    art: beleg.art,
    person: { name: beleg.person.name, bereich: beleg.person.bereich, funktion: beleg.person.funktion },
    positionen,
    pfandBetrag,
    ausgeberName: einstellung?.ausgeberName ?? '',
    erstelltAm: beleg.createdAt.toISOString(),
  }
  const payloadJson = JSON.stringify(payload)
  const signiertAm = new Date()
  const hash = belegHash(payloadJson, png, signiertAm.toISOString())

  const sigPfad = unterschriftPfad(beleg.id)
  const belegPdfPfad = pdfPfad(beleg.id)
  await speichereDatei(sigPfad, png)
  const pdf = await erzeugeBelegPdf(payload, png, signiertAm, hash)
  await speichereDatei(belegPdfPfad, pdf)

  const gespeichert = await prisma.schluesselBeleg.update({
    where: { id: beleg.id },
    data: {
      status: 'signiert',
      payloadJson,
      unterschriftPfad: sigPfad,
      pdfPfad: belegPdfPfad,
      hash,
      signiertAm,
    },
  })
  return NextResponse.json({ id: gespeichert.id, hash, signiertAm })
}
