import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const bereich = await prisma.bereich.findUnique({
    where: { id },
    include: {
      beschluesse: { orderBy: { ordering: 'asc' } },
      tasks: {
        include: { assignments: { include: { person: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!bereich) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(bereich)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const bereich = await prisma.bereich.update({
    where: { id },
    data: {
      name: body.name,
      icon: body.icon,
      verantwortliche: body.verantwortliche,
      ordering: body.ordering,
    },
  })
  return NextResponse.json(bereich)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.bereich.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
