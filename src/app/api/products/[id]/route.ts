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
    },
  })

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
