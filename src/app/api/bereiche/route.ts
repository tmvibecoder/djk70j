import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const bereiche = await prisma.bereich.findMany({
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
  const body = await request.json()
  const bereich = await prisma.bereich.create({
    data: {
      name: body.name,
      icon: body.icon,
      verantwortliche: body.verantwortliche || '',
      ordering: body.ordering ?? 0,
    },
  })
  return NextResponse.json(bereich, { status: 201 })
}
