import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const forecasts = await prisma.simpleForecast.findMany({ orderBy: [{ eventDay: 'asc' }, { scenario: 'asc' }] })
  return NextResponse.json(forecasts)
}

export async function PUT(req: Request) {
  const data = await req.json()
  const { eventDay, scenario, visitors, revenuePerPerson, entryFee, costPercent } = data
  const forecast = await prisma.simpleForecast.upsert({
    where: { eventDay_scenario: { eventDay, scenario } },
    update: { visitors, revenuePerPerson, entryFee, costPercent },
    create: { eventDay, scenario, visitors, revenuePerPerson, entryFee, costPercent },
  })
  return NextResponse.json(forecast)
}
