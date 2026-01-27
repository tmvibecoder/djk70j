import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const eventDay = searchParams.get('eventDay')

  const where: Record<string, unknown> = {}
  if (eventDay) where.eventDay = eventDay

  const estimates = await prisma.salesEstimate.findMany({
    where,
    include: {
      product: true,
    },
  })

  return NextResponse.json(estimates)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { productId, eventDay, estimatedQuantity } = body

  if (estimatedQuantity === 0 || estimatedQuantity === null) {
    // Löschen wenn 0
    await prisma.salesEstimate.deleteMany({
      where: { productId, eventDay },
    })
    return NextResponse.json({ deleted: true })
  }

  const estimate = await prisma.salesEstimate.upsert({
    where: {
      productId_eventDay: {
        productId,
        eventDay,
      },
    },
    update: {
      estimatedQuantity,
    },
    create: {
      productId,
      eventDay,
      estimatedQuantity,
    },
    include: {
      product: true,
    },
  })

  return NextResponse.json(estimate)
}
