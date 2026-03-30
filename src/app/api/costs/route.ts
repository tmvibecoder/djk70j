import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const costs = await prisma.costItem.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(costs)
}

export async function POST(req: Request) {
  const data = await req.json()
  const cost = await prisma.costItem.create({ data })
  return NextResponse.json(cost, { status: 201 })
}

export async function PUT(req: Request) {
  const data = await req.json()
  const { id, ...rest } = data
  const cost = await prisma.costItem.update({ where: { id }, data: rest })
  return NextResponse.json(cost)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.costItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
