import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [forecasts, entryForecasts, products] = await Promise.all([
    prisma.forecastEntry.findMany({ include: { product: true }, orderBy: { eventDay: 'asc' } }),
    prisma.entryForecast.findMany({ orderBy: { eventDay: 'asc' } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { category: 'asc' } }),
  ])
  return NextResponse.json({ forecasts, entryForecasts, products })
}

export async function PUT(req: Request) {
  const data = await req.json()

  if (data.type === 'entry') {
    const { eventDay, scenario, visitors, entryFee } = data
    const entry = await prisma.entryForecast.upsert({
      where: { eventDay_scenario: { eventDay, scenario } },
      update: { visitors, entryFee },
      create: { eventDay, scenario, visitors, entryFee },
    })
    return NextResponse.json(entry)
  }

  const { productId, eventDay, scenario, quantity } = data
  const forecast = await prisma.forecastEntry.upsert({
    where: { productId_eventDay_scenario: { productId, eventDay, scenario } },
    update: { quantity },
    create: { productId, eventDay, scenario, quantity },
  })
  return NextResponse.json(forecast)
}

export async function POST(req: Request) {
  const { entries } = await req.json()
  const results = await Promise.all(
    entries.map((e: { productId: string; eventDay: string; scenario: string; quantity: number }) =>
      prisma.forecastEntry.upsert({
        where: { productId_eventDay_scenario: { productId: e.productId, eventDay: e.eventDay, scenario: e.scenario } },
        update: { quantity: e.quantity },
        create: e,
      })
    )
  )
  return NextResponse.json(results)
}
