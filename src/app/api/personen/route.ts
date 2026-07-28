import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_EVENT_ID } from '@/data/veranstaltungen'

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get('event') ?? DEFAULT_EVENT_ID
  const personen = await prisma.person.findMany({
    where: { eventId },
    orderBy: { ordering: 'asc' },
  })
  return NextResponse.json(personen)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const person = await prisma.person.create({
    data: {
      eventId: body.eventId ?? DEFAULT_EVENT_ID,
      name: body.name,
      initials: body.initials,
      color: body.color,
      ordering: body.ordering ?? 0,
      isCatchAll: body.isCatchAll ?? false,
    },
  })
  return NextResponse.json(person, { status: 201 })
}
