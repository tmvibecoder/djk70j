import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ausgabeDaten } from '@/lib/info-felder'
import { erfordereRolle, rolleAusRequest } from '@/lib/info-auth'

export async function GET(req: NextRequest) {
  const jahrParam = req.nextUrl.searchParams.get('jahr')
  const jahr = jahrParam ? parseInt(jahrParam, 10) : null
  const ausgaben = await prisma.infoAusgabe.findMany({
    where: jahr ? { jahr } : undefined,
    orderBy: [{ jahr: 'desc' }, { nummer: 'asc' }],
    include: {
      _count: { select: { schaltungen: true, dateien: true } },
      dateien: { orderBy: { createdAt: 'desc' } },
    },
  })
  return NextResponse.json(ausgaben)
}

// Ausgaben anlegen dürfen Kassier und Redakteur (gehört zur Ausgaben-Pflege).
// Das Druckkosten-Feld bleibt dem Kassier vorbehalten.
export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'schaltungen')
  if (verboten) return verboten
  const rolle = await rolleAusRequest(req)

  const body = await req.json().catch(() => ({}))
  const daten = ausgabeDaten(body)
  if (rolle !== 'kassier') daten.druckKosten = null

  const vorhanden = await prisma.infoAusgabe.findUnique({
    where: { jahr_nummer: { jahr: daten.jahr, nummer: daten.nummer } },
  })
  if (vorhanden) {
    return NextResponse.json({ error: `Ausgabe ${daten.bezeichnung} existiert bereits` }, { status: 409 })
  }
  const ausgabe = await prisma.infoAusgabe.create({ data: daten })
  return NextResponse.json(ausgabe, { status: 201 })
}
