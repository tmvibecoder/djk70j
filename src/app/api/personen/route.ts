import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const personen = await prisma.person.findMany({
    orderBy: { ordering: 'asc' },
  })
  return NextResponse.json(personen)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const person = await prisma.person.create({
    data: {
      name: body.name,
      initials: body.initials,
      color: body.color,
      ordering: body.ordering ?? 0,
      isCatchAll: body.isCatchAll ?? false,
    },
  })
  return NextResponse.json(person, { status: 201 })
}
