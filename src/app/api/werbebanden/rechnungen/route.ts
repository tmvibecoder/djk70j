import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rechnungDaten } from '@/lib/werbebanden-felder'
import { formatRechnungsnummer, naechsteLaufnummer } from '@/lib/rechnungsnummer'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const saison = searchParams.get('saison')
  const rechnungen = await prisma.werbebandenRechnung.findMany({
    where: saison && saison !== 'alle' ? { saison } : undefined,
    orderBy: [{ jahr: 'desc' }, { laufnummer: 'desc' }],
    include: { partner: { select: { id: true, firma: true } } },
  })
  return NextResponse.json(rechnungen)
}

// Einzelne Rechnung anlegen (Nummer wird automatisch vergeben)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const daten = rechnungDaten(body)
  if (!daten.saison || !daten.firma) {
    return NextResponse.json({ error: 'Saison und Firma sind erforderlich' }, { status: 400 })
  }
  const jahr = Number.isInteger(body.jahr) ? (body.jahr as number) : new Date().getFullYear()
  const partnerId = typeof body.partnerId === 'string' ? body.partnerId : null

  const rechnung = await prisma.$transaction(async tx => {
    const laufnummer = await naechsteLaufnummer(tx, jahr)
    return tx.werbebandenRechnung.create({
      data: {
        ...daten,
        datum: daten.datum ?? new Date(),
        partnerId,
        jahr,
        laufnummer,
        nummer: formatRechnungsnummer(jahr, laufnummer),
      },
    })
  })
  return NextResponse.json(rechnung, { status: 201 })
}
