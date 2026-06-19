import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category')
  const active = searchParams.get('active')
  const inventory = searchParams.get('inventory')

  const where: Record<string, unknown> = {}
  if (category) where.category = category
  if (active !== null) where.isActive = active === 'true'
  // Trennung Katalog (Verkaufsware) vs. Inventur (eingekaufte Ware).
  // Standard: nur Katalogware. Mit ?inventory=true nur Inventur-Artikel, ?inventory=all = alle.
  if (inventory === 'true') {
    where.trackInventory = true
  } else if (inventory !== 'all') {
    where.trackInventory = false
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const product = await prisma.product.create({
    data: {
      name: body.name,
      purchasePrice: parseFloat(body.purchasePrice),
      salePrice: parseFloat(body.salePrice),
      unit: body.unit,
      category: body.category,
      isActive: body.isActive ?? true,
    },
  })

  return NextResponse.json(product, { status: 201 })
}
