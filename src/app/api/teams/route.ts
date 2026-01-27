import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const eventDay = searchParams.get('eventDay')

  const where: Record<string, unknown> = {}
  if (eventDay) where.eventDay = eventDay

  const teams = await prisma.team.findMany({
    where,
    include: {
      participants: true,
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(teams)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const team = await prisma.team.create({
    data: {
      name: body.name,
      eventDay: body.eventDay || 'thursday',
    },
    include: {
      participants: true,
    },
  })

  return NextResponse.json(team, { status: 201 })
}
