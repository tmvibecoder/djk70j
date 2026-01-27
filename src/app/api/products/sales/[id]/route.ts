import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// PUT: Verkaufseintrag aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const entry = await prisma.salesEntry.update({
    where: { id },
    data: {
      quantity: parseInt(body.quantity),
      notes: body.notes || null,
    },
    include: {
      product: true,
      user: {
        select: { id: true, name: true },
      },
    },
  })

  return NextResponse.json(entry)
}

// DELETE: Verkaufseintrag löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await prisma.salesEntry.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
