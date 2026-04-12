import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const person = await prisma.person.update({
    where: { id },
    data: {
      name: body.name,
      initials: body.initials,
      color: body.color,
      ordering: body.ordering,
      isCatchAll: body.isCatchAll,
    },
  })
  return NextResponse.json(person)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.person.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
