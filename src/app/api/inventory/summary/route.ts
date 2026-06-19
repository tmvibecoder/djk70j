import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { INVENTORY_DAY_ORDER, inventoryTimeRank } from '@/types'

// Ein Bestands-Reading mit globalem Rang (über alle Tage hinweg sortierbar).
interface Reading {
  qty: number
  rank: number
  eventDay: string
}
interface Delivery {
  qty: number
  rank: number
  eventDay: string
}

// Globaler Rang: erst nach Tag (chronologisch), dann nach Uhrzeit.
function dayRank(eventDay: string): number {
  const order = INVENTORY_DAY_ORDER[eventDay]
  return (order === undefined || order < 0 ? 99 : order) * 100000
}

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

      // Readings (Bestand-Zählungen) und Lieferungen sammeln.
      // Legacy: "start" zählt als erste, "end" als letzte Zählung des Tages.
      const readings: Reading[] = []
      const deliveries: Delivery[] = []

      for (const inv of inventories) {
        const base = dayRank(inv.eventDay)
        if (inv.type === 'delivery') {
          deliveries.push({ qty: inv.quantity, rank: base + inventoryTimeRank(inv.time), eventDay: inv.eventDay })
        } else if (inv.type === 'start') {
          readings.push({ qty: inv.quantity, rank: base + 0, eventDay: inv.eventDay })
        } else if (inv.type === 'end') {
          readings.push({ qty: inv.quantity, rank: base + 99999, eventDay: inv.eventDay })
        } else {
          // "count" (neue, flexible Zählung) oder unbekannt → nach Uhrzeit
          readings.push({ qty: inv.quantity, rank: base + inventoryTimeRank(inv.time), eventDay: inv.eventDay })
        }
      }

      readings.sort((a, b) => a.rank - b.rank)
      deliveries.sort((a, b) => a.rank - b.rank)

      // Verbrauch zwischen aufeinanderfolgenden Zählungen:
      // verbrauch = vorherige Zählung + Lieferungen dazwischen − nächste Zählung.
      const dayData: Record<string, { start: number; end: number; delivery: number; consumption: number }> = {}
      const ensureDay = (d: string) => {
        if (!dayData[d]) dayData[d] = { start: 0, end: 0, delivery: 0, consumption: 0 }
        return dayData[d]
      }

      for (const del of deliveries) ensureDay(del.eventDay).delivery += del.qty

      for (let i = 0; i < readings.length - 1; i++) {
        const prev = readings[i]
        const next = readings[i + 1]
        const deliveredBetween = deliveries
          .filter((d) => d.rank > prev.rank && d.rank <= next.rank)
          .reduce((s, d) => s + d.qty, 0)
        const consumed = prev.qty + deliveredBetween - next.qty
        // Verbrauch dem Tag der späteren Zählung zuordnen
        ensureDay(next.eventDay).consumption += consumed
      }

      // start/end je Tag für die Anzeige (erste/letzte Zählung des Tages)
      const byDay: Record<string, Reading[]> = {}
      for (const r of readings) (byDay[r.eventDay] ||= []).push(r)
      for (const [d, rs] of Object.entries(byDay)) {
        ensureDay(d).start = rs[0].qty
        ensureDay(d).end = rs[rs.length - 1].qty
      }

      // Aktueller Bestand: letzte Zählung + danach erfasste Lieferungen
      let currentStock = 0
      if (readings.length > 0) {
        const last = readings[readings.length - 1]
        const deliveredAfter = deliveries.filter((d) => d.rank > last.rank).reduce((s, d) => s + d.qty, 0)
        currentStock = last.qty + deliveredAfter
      } else {
        currentStock = deliveries.reduce((s, d) => s + d.qty, 0)
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
