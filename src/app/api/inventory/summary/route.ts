import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { inventorySessionRank } from '@/types'

// Nie cachen: muss live den aktuellen Zählstand widerspiegeln.
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Übersicht für die Inventur (nur Inventur-Artikel = trackInventory).
// Verbrauch = erste erfasste Zählung (+ Lieferungen) − letzte erfasste Zählung.
// Warenwert basiert auf dem Einkaufspreis (EK), da es sich um eingekaufte Ware handelt.
export async function GET() {
  const products = await prisma.product.findMany({
    where: { trackInventory: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  const orderIndex = (key: string | null) => inventorySessionRank(key)

  const summaryData = await Promise.all(
    products.map(async (product) => {
      const inventories = await prisma.inventory.findMany({
        where: { productId: product.id },
      })

      // Zählungen pro Session sammeln
      const sessions: Record<string, { quantity: number; packs: number | null; loose: number | null }> = {}
      let delivery = 0
      for (const inv of inventories) {
        if (inv.type === 'delivery') {
          delivery += inv.quantity
          continue
        }
        const key = inv.session ?? inv.eventDay
        sessions[key] = {
          quantity: inv.quantity,
          packs: inv.packs ?? null,
          loose: inv.loose ?? null,
        }
      }

      const countedKeys = Object.keys(sessions).sort((a, b) => orderIndex(a) - orderIndex(b))
      const firstKey = countedKeys[0]
      const lastKey = countedKeys[countedKeys.length - 1]

      const baselineStock = firstKey ? sessions[firstKey].quantity + delivery : 0
      const currentStock = lastKey ? sessions[lastKey].quantity : 0
      const consumption = countedKeys.length >= 2 ? Math.max(0, baselineStock - currentStock) : 0

      const stockValue = currentStock * product.purchasePrice
      const consumptionValue = consumption * product.purchasePrice
      const deliveredValue = (firstKey ? sessions[firstKey].quantity : 0) * product.purchasePrice

      return {
        product,
        currentStock,
        baselineStock,
        consumption,
        delivery,
        sessions,
        countedSessions: countedKeys.length,
        stockValue,
        consumptionValue,
        deliveredValue,
      }
    })
  )

  const byCategory: Record<string, typeof summaryData> = {}
  for (const item of summaryData) {
    const cat = item.product.category
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(item)
  }

  const totals = {
    stockValue: summaryData.reduce((s, i) => s + i.stockValue, 0),
    consumptionValue: summaryData.reduce((s, i) => s + i.consumptionValue, 0),
    deliveredValue: summaryData.reduce((s, i) => s + i.deliveredValue, 0),
    consumption: summaryData.reduce((s, i) => s + i.consumption, 0),
  }

  return NextResponse.json({ products: summaryData, byCategory, totals })
}
