import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_EVENT_ID } from '@/data/veranstaltungen'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event') ?? DEFAULT_EVENT_ID
  const sponsors = await prisma.sponsor.findMany({
    where: { eventId },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(sponsors)
}

export async function POST(req: Request) {
  const data = await req.json()
  const sponsor = await prisma.sponsor.create({
    data: { ...data, eventId: data.eventId ?? DEFAULT_EVENT_ID },
  })
  return NextResponse.json(sponsor, { status: 201 })
}

export async function PUT(req: Request) {
  const data = await req.json()
  const { id, ...rest } = data
  const sponsor = await prisma.sponsor.update({ where: { id }, data: rest })
  return NextResponse.json(sponsor)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.sponsor.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
