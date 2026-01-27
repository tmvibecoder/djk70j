import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const station = await prisma.station.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description || null,
    },
  })

  return NextResponse.json(station)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.station.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
