import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const [
    products,
    salesEstimates,
    salesEntries,
  ] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true } }),
    prisma.salesEstimate.findMany({ include: { product: true } }),
    prisma.salesEntry.findMany({ include: { product: true } }),
  ])

  // Product revenue forecast (from DB estimates)
  const eventDays = ['thursday', 'friday', 'saturday', 'sunday']
  const dayLabels: Record<string, string> = {
    thursday: 'Donnerstag',
    friday: 'Freitag',
    saturday: 'Samstag',
    sunday: 'Sonntag',
  }

  const productRevenue = {
    estimated: { revenue: 0, cost: 0 },
    actual: { revenue: 0, cost: 0 },
  }

  // Per-day product breakdown
  const perDayProducts: Record<string, { estRevenue: number; estCost: number; actRevenue: number; actCost: number }> = {}
  for (const day of eventDays) {
    perDayProducts[day] = { estRevenue: 0, estCost: 0, actRevenue: 0, actCost: 0 }
  }

  for (const est of salesEstimates) {
    const rev = est.estimatedQuantity * est.product.salePrice
    const cost = est.estimatedQuantity * est.product.purchasePrice
    productRevenue.estimated.revenue += rev
    productRevenue.estimated.cost += cost
    if (perDayProducts[est.eventDay]) {
      perDayProducts[est.eventDay].estRevenue += rev
      perDayProducts[est.eventDay].estCost += cost
    }
  }

  for (const entry of salesEntries) {
    const rev = entry.quantity * entry.product.salePrice
    const cost = entry.quantity * entry.product.purchasePrice
    productRevenue.actual.revenue += rev
    productRevenue.actual.cost += cost
    if (perDayProducts[entry.eventDay]) {
      perDayProducts[entry.eventDay].actRevenue += rev
      perDayProducts[entry.eventDay].actCost += cost
    }
  }

  // Category breakdown
  const categoryBreakdown: Record<string, { estRevenue: number; actRevenue: number }> = {}
  for (const est of salesEstimates) {
    const cat = est.product.category
    if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { estRevenue: 0, actRevenue: 0 }
    categoryBreakdown[cat].estRevenue += est.estimatedQuantity * est.product.salePrice
  }
  for (const entry of salesEntries) {
    const cat = entry.product.category
    if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { estRevenue: 0, actRevenue: 0 }
    categoryBreakdown[cat].actRevenue += entry.quantity * entry.product.salePrice
  }

  return NextResponse.json({
    productCount: products.length,
    productRevenue,
    perDayProducts,
    categoryBreakdown,
    dayLabels,
  })
}
