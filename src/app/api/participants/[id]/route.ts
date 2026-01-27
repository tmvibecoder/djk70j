import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const participant = await prisma.participant.update({
    where: { id },
    data: {
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      eventDay: body.eventDay,
      paid: body.paid,
      teamId: body.teamId || null,
    },
    include: {
      team: true,
    },
  })

  return NextResponse.json(participant)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.participant.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
