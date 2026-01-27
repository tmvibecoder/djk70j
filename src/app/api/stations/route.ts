import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const stations = await prisma.station.findMany({
    include: {
      shifts: {
        include: {
          assignments: {
            include: {
              user: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(stations)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const station = await prisma.station.create({
    data: {
      name: body.name,
      description: body.description || null,
    },
  })

  return NextResponse.json(station, { status: 201 })
}
