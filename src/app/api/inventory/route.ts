import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const eventDay = searchParams.get('eventDay')
  const productId = searchParams.get('productId')
  const type = searchParams.get('type')
  const session = searchParams.get('session')

  const where: Record<string, unknown> = {}
  if (eventDay) where.eventDay = eventDay
  if (productId) where.productId = productId
  if (type) where.type = type
  if (session) where.session = session

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

// Bulk upsert für schnelle Inventur-Erfassung.
// Neu: pro Zähl-Session (session). Träger + lose werden zur Gesamtmenge verrechnet.
// Backward-compatible: ohne session greift weiter der alte eventDay/type-Pfad.
export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { entries, session, eventDay, type } = body

  type Entry = {
    productId: string
    quantity?: number
    packs?: number | null
    loose?: number | null
    notes?: string
  }

  const results = await Promise.all(
    (entries as Entry[]).map(async (entry) => {
      const packs = entry.packs == null || entry.packs === undefined ? null : Number(entry.packs)
      const loose = entry.loose == null || entry.loose === undefined ? null : Number(entry.loose)
      const quantity = Number(entry.quantity ?? 0)

      // Eindeutiger Schlüssel: bei Sessions (productId, session), sonst (productId, eventDay, type)
      const where = session
        ? { productId: entry.productId, session }
        : { productId: entry.productId, eventDay, type }

      const existing = await prisma.inventory.findFirst({ where })

      const data = {
        quantity,
        packs,
        loose,
        notes: entry.notes,
        date: new Date(),
      }

      if (existing) {
        return prisma.inventory.update({ where: { id: existing.id }, data })
      }
      return prisma.inventory.create({
        data: {
          ...data,
          productId: entry.productId,
          session: session ?? null,
          // eventDay/type sind NOT NULL: bei Sessions Session-Key bzw. "count" ablegen
          eventDay: session ?? eventDay ?? 'unknown',
          type: session ? 'count' : (type ?? 'count'),
        },
      })
    })
  )

  return NextResponse.json(results)
}
