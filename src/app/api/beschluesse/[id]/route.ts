import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const beschluss = await prisma.beschluss.update({
    where: { id },
    data: {
      text: body.text,
      ordering: body.ordering,
    },
  })
  return NextResponse.json(beschluss)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.beschluss.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
