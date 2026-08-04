import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { partnerDaten } from '@/lib/werbebanden-felder'
import { erfordereRolle } from '@/lib/session'

export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'werbebanden', 'lesen')
  if (verboten) return verboten

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const partner = await prisma.werbepartner.findMany({
    where: status && status !== 'alle' ? { status } : undefined,
    orderBy: [
      { abschnitt: { sort: 'asc', nulls: 'last' } },
      { positionNr: { sort: 'asc', nulls: 'last' } },
      { firma: 'asc' },
    ],
    include: { _count: { select: { dateien: true, rechnungen: true } } },
  })
  return NextResponse.json(partner)
}

export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'werbebanden', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = partnerDaten(body)
  if (!daten.firma) {
    return NextResponse.json({ error: 'Firma ist erforderlich' }, { status: 400 })
  }
  const partner = await prisma.werbepartner.create({ data: daten })
  return NextResponse.json(partner, { status: 201 })
}
