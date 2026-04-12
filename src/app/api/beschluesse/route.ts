import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const bereichId = request.nextUrl.searchParams.get('bereichId')
  const beschluesse = await prisma.beschluss.findMany({
    where: bereichId ? { bereichId } : undefined,
    orderBy: [{ bereichId: 'asc' }, { ordering: 'asc' }],
  })
  return NextResponse.json(beschluesse)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  if (!body.bereichId || !body.text) {
    return NextResponse.json({ error: 'bereichId und text erforderlich' }, { status: 400 })
  }
  const beschluss = await prisma.beschluss.create({
    data: {
      text: body.text,
      bereichId: body.bereichId,
      ordering: body.ordering ?? 0,
    },
  })
  return NextResponse.json(beschluss, { status: 201 })
}
