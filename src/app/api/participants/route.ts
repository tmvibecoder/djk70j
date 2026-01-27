import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const eventDay = searchParams.get('eventDay')
  const teamId = searchParams.get('teamId')
  const paid = searchParams.get('paid')

  const where: Record<string, unknown> = {}
  if (eventDay) where.eventDay = eventDay
  if (teamId) where.teamId = teamId
  if (paid !== null) where.paid = paid === 'true'

  const participants = await prisma.participant.findMany({
    where,
    include: {
      team: true,
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(participants)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const participant = await prisma.participant.create({
    data: {
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      eventDay: body.eventDay || 'thursday',
      paid: body.paid || false,
      teamId: body.teamId || null,
    },
    include: {
      team: true,
    },
  })

  return NextResponse.json(participant, { status: 201 })
}
