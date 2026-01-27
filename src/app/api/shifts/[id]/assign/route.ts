import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: shiftId } = await params
  const body = await request.json()
  const { userId } = body

  // Prüfen ob bereits zugewiesen
  const existing = await prisma.shiftAssignment.findUnique({
    where: {
      shiftId_userId: {
        shiftId,
        userId,
      },
    },
  })

  if (existing) {
    return NextResponse.json({ error: 'Helfer bereits zugewiesen' }, { status: 400 })
  }

  const assignment = await prisma.shiftAssignment.create({
    data: {
      shiftId,
      userId,
    },
    include: {
      user: true,
      shift: {
        include: {
          station: true,
        },
      },
    },
  })

  return NextResponse.json(assignment, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: shiftId } = await params
  const body = await request.json()
  const { userId } = body

  await prisma.shiftAssignment.delete({
    where: {
      shiftId_userId: {
        shiftId,
        userId,
      },
    },
  })

  return NextResponse.json({ success: true })
}
