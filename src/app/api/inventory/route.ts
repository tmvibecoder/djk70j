import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const eventDay = searchParams.get('eventDay')
  const productId = searchParams.get('productId')
  const type = searchParams.get('type')
  const time = searchParams.get('time')

  const where: Record<string, unknown> = {}
  if (eventDay) where.eventDay = eventDay
  if (productId) where.productId = productId
  if (type) where.type = type
  if (time) where.time = time

  const inventories = await prisma.inventory.findMany({
    where,
    include: {
      product: true,
    },
    orderBy: [{ date: 'desc' }],
  })

  return NextResponse.json(inventories)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const inventory = await prisma.inventory.create({
    data: {
      productId: body.productId,
      quantity: parseFloat(body.quantity),
      eventDay: body.eventDay,
      time: body.time ?? null,
      type: body.type,
      notes: body.notes,
      date: body.date ? new Date(body.date) : new Date(),
    },
    include: {
      product: true,
    },
  })

  return NextResponse.json(inventory, { status: 201 })
}

// Bulk upsert für schnelle Inventur-Erfassung
export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { entries, eventDay, type, time } = body
  const slot = time ?? null

  const results = await Promise.all(
    entries.map(async (entry: { productId: string; quantity: number; notes?: string }) => {
      // Prüfen ob bereits ein Eintrag für dieses Produkt/Tag/Typ/Uhrzeit existiert
      const existing = await prisma.inventory.findFirst({
        where: {
          productId: entry.productId,
          eventDay,
          type,
          time: slot,
        },
      })

      if (existing) {
        return prisma.inventory.update({
          where: { id: existing.id },
          data: {
            quantity: entry.quantity,
            notes: entry.notes,
            date: new Date(),
          },
        })
      } else {
        return prisma.inventory.create({
          data: {
            productId: entry.productId,
            quantity: entry.quantity,
            eventDay,
            time: slot,
            type,
            notes: entry.notes,
          },
        })
      }
    })
  )

  return NextResponse.json(results)
}
