import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET: Alle Verkaufseinträge abrufen
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const eventDay = searchParams.get('eventDay')
  const productId = searchParams.get('productId')

  const where: Record<string, unknown> = {}
  if (eventDay) where.eventDay = eventDay
  if (productId) where.productId = productId

  const entries = await prisma.salesEntry.findMany({
    where,
    include: {
      product: true,
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Berechne auch Summen pro Produkt
  const totals = await prisma.salesEntry.groupBy({
    by: ['productId'],
    where,
    _sum: {
      quantity: true,
    },
  })

  const totalsMap: Record<string, number> = {}
  for (const t of totals) {
    totalsMap[t.productId] = t._sum.quantity || 0
  }

  return NextResponse.json({ entries, totals: totalsMap })
}

// POST: Neuen Verkaufseintrag erstellen
export async function POST(request: NextRequest) {
  const body = await request.json()

  const entry = await prisma.salesEntry.create({
    data: {
      productId: body.productId,
      quantity: parseInt(body.quantity),
      eventDay: body.eventDay,
      enteredBy: body.enteredBy || null,
      notes: body.notes || null,
    },
    include: {
      product: true,
      user: {
        select: { id: true, name: true },
      },
    },
  })

  return NextResponse.json(entry, { status: 201 })
}
