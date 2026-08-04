import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_EVENT_ID } from '@/data/veranstaltungen'
import { erfordereRolle } from '@/lib/session'

export async function GET(request: NextRequest) {
  const verboten = await erfordereRolle(request, 'veranstaltungen', 'lesen')
  if (verboten) return verboten

  const eventId = request.nextUrl.searchParams.get('event') ?? DEFAULT_EVENT_ID
  const bereiche = await prisma.bereich.findMany({
    where: { eventId },
    orderBy: { ordering: 'asc' },
    include: {
      beschluesse: { orderBy: { ordering: 'asc' } },
      tasks: {
        include: {
          assignments: { include: { person: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  return NextResponse.json(bereiche)
}

export async function POST(request: NextRequest) {
  const verboten = await erfordereRolle(request, 'veranstaltungen', 'bearbeiten')
  if (verboten) return verboten

  const body = await request.json()
  const bereich = await prisma.bereich.create({
    data: {
      eventId: body.eventId ?? DEFAULT_EVENT_ID,
      name: body.name,
      icon: body.icon,
      verantwortliche: body.verantwortliche || '',
      ordering: body.ordering ?? 0,
    },
  })
  return NextResponse.json(bereich, { status: 201 })
}
