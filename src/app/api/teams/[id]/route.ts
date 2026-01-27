import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const team = await prisma.team.update({
    where: { id },
    data: {
      name: body.name,
      eventDay: body.eventDay,
    },
    include: {
      participants: true,
    },
  })

  return NextResponse.json(team)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.team.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
