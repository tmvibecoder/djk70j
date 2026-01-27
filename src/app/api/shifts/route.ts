import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const eventDay = searchParams.get('eventDay')
  const stationId = searchParams.get('stationId')

  const where: Record<string, unknown> = {}
  if (eventDay) where.eventDay = eventDay
  if (stationId) where.stationId = stationId

  const shifts = await prisma.shift.findMany({
    where,
    include: {
      station: true,
      assignments: {
        include: {
          user: true,
        },
      },
    },
    orderBy: [{ eventDay: 'asc' }, { startTime: 'asc' }],
  })

  return NextResponse.json(shifts)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const shift = await prisma.shift.create({
    data: {
      stationId: body.stationId,
      eventDay: body.eventDay,
      startTime: body.startTime,
      endTime: body.endTime,
      requiredHelpers: parseInt(body.requiredHelpers) || 1,
    },
    include: {
      station: true,
      assignments: {
        include: {
          user: true,
        },
      },
    },
  })

  return NextResponse.json(shift, { status: 201 })
}
