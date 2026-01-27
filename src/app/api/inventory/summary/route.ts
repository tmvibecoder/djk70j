import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const eventDay = searchParams.get('eventDay')

  // Alle aktiven Produkte holen
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  // Inventur-Daten für jedes Produkt sammeln
  const summaryData = await Promise.all(
    products.map(async (product) => {
      const inventories = await prisma.inventory.findMany({
        where: {
          productId: product.id,
          ...(eventDay ? { eventDay } : {}),
        },
        orderBy: { date: 'asc' },
      })

      // Berechne aktuellen Bestand
      let currentStock = 0
      const dayData: Record<string, { start: number; end: number; delivery: number; consumption: number }> = {}

      for (const inv of inventories) {
        if (!dayData[inv.eventDay]) {
          dayData[inv.eventDay] = { start: 0, end: 0, delivery: 0, consumption: 0 }
        }

        if (inv.type === 'start') {
          dayData[inv.eventDay].start = inv.quantity
          currentStock = inv.quantity
        } else if (inv.type === 'delivery') {
          dayData[inv.eventDay].delivery += inv.quantity
          currentStock += inv.quantity
        } else if (inv.type === 'end') {
          dayData[inv.eventDay].end = inv.quantity
          dayData[inv.eventDay].consumption =
            dayData[inv.eventDay].start + dayData[inv.eventDay].delivery - inv.quantity
          currentStock = inv.quantity
        }
      }

      // Berechne Gesamtverbrauch und Umsatz
      const totalConsumption = Object.values(dayData).reduce((sum, d) => sum + d.consumption, 0)
      const revenue = totalConsumption * product.salePrice
      const cost = totalConsumption * product.purchasePrice
      const profit = revenue - cost

      return {
        product,
        currentStock,
        dayData,
        totalConsumption,
        revenue,
        cost,
        profit,
      }
    })
  )

  // Gruppiere nach Kategorie
  const byCategory: Record<string, typeof summaryData> = {}
  for (const item of summaryData) {
    const cat = item.product.category
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(item)
  }

  // Gesamtübersicht
  const totals = {
    revenue: summaryData.reduce((sum, item) => sum + item.revenue, 0),
    cost: summaryData.reduce((sum, item) => sum + item.cost, 0),
    profit: summaryData.reduce((sum, item) => sum + item.profit, 0),
  }

  return NextResponse.json({
    products: summaryData,
    byCategory,
    totals,
  })
}
