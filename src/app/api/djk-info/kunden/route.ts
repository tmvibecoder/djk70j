import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { kundeDaten } from '@/lib/info-felder'
import { erfordereRolle } from '@/lib/info-auth'

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status')
  const kunden = await prisma.infoKunde.findMany({
    where: status && status !== 'alle' ? { status } : undefined,
    orderBy: { firma: 'asc' },
    include: { _count: { select: { dateien: true, rechnungen: true, schaltungen: true } } },
  })
  return NextResponse.json(kunden)
}

export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = kundeDaten(body)
  if (!daten.firma) {
    return NextResponse.json({ error: 'Firma ist erforderlich' }, { status: 400 })
  }
  const kunde = await prisma.infoKunde.create({ data: daten })
  return NextResponse.json(kunde, { status: 201 })
}
