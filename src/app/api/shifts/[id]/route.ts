import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const shift = await prisma.shift.update({
    where: { id },
    data: {
      stationId: body.stationId,
      eventDay: body.eventDay,
      startTime: body.startTime,
      endTime: body.endTime,
      requiredHelpers: parseInt(body.requiredHelpers) || 1,
    },
    include: {
      station: true,
      assignments: {
        include: {
          user: true,
        },
      },
    },
  })

  return NextResponse.json(shift)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.shift.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
