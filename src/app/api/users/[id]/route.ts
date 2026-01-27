import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      shiftAssignments: {
        include: {
          shift: {
            include: {
              station: true,
            },
          },
        },
      },
      tasks: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email || null,
      role: body.role,
    },
  })

  return NextResponse.json(user)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.user.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
