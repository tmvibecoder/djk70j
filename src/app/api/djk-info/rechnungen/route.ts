import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rechnungDaten } from '@/lib/info-felder'
import { erfordereRolle } from '@/lib/info-auth'
import { formatRechnungsnummer, naechsteInfoLaufnummer } from '@/lib/rechnungsnummer'

export async function GET(req: NextRequest) {
  const jahrParam = req.nextUrl.searchParams.get('jahr')
  const jahr = jahrParam && jahrParam !== 'alle' ? parseInt(jahrParam, 10) : null
  const rechnungen = await prisma.infoRechnung.findMany({
    where: jahr ? { leistungsjahr: jahr } : undefined,
    orderBy: [{ jahr: 'desc' }, { laufnummer: 'desc' }],
    include: { kunde: { select: { id: true, firma: true } } },
  })
  return NextResponse.json(rechnungen)
}

// Einzelne Rechnung anlegen (Nummer wird automatisch im Kreis "I" vergeben)
export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = rechnungDaten(body)
  if (!daten.firma) {
    return NextResponse.json({ error: 'Firma ist erforderlich' }, { status: 400 })
  }
  const jahr = Number.isInteger(body.jahr) ? (body.jahr as number) : new Date().getFullYear()
  const leistungsjahr = Number.isInteger(body.leistungsjahr) ? (body.leistungsjahr as number) : jahr
  const kundeId = typeof body.kundeId === 'string' ? body.kundeId : null

  const rechnung = await prisma.$transaction(async tx => {
    const laufnummer = await naechsteInfoLaufnummer(tx, jahr)
    return tx.infoRechnung.create({
      data: {
        ...daten,
        datum: daten.datum ?? new Date(),
        kundeId,
        leistungsjahr,
        jahr,
        laufnummer,
        nummer: formatRechnungsnummer(jahr, laufnummer, 'I'),
      },
    })
  })
  return NextResponse.json(rechnung, { status: 201 })
}
