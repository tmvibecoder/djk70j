import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      inventories: {
        orderBy: { date: 'desc' },
        take: 10,
      },
    },
  })

  if (!product) {
    return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(product)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      purchasePrice: parseFloat(body.purchasePrice),
      salePrice: parseFloat(body.salePrice),
      unit: body.unit,
      category: body.category,
      isActive: body.isActive,
      isCritical: body.isCritical ?? false,
    },
  })

  return NextResponse.json(product)
}

// Teil-Update: aktualisiert nur die übergebenen Felder (z.B. nur isCritical),
// ohne Preise o.ä. zu überschreiben. Genutzt vom Stern-Umschalter in der Inventur.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}
  if (typeof body.isCritical === 'boolean') data.isCritical = body.isCritical
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive
  if (typeof body.trackInventory === 'boolean') data.trackInventory = body.trackInventory
  if (body.name !== undefined) data.name = body.name
  if (body.unit !== undefined) data.unit = body.unit
  if (body.category !== undefined) data.category = body.category
  if (body.purchasePrice !== undefined) data.purchasePrice = parseFloat(body.purchasePrice)
  if (body.salePrice !== undefined) data.salePrice = parseFloat(body.salePrice)

  const product = await prisma.product.update({ where: { id }, data })
  return NextResponse.json(product)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.product.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
