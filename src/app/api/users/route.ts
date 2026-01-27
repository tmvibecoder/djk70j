import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const role = searchParams.get('role')

  const where: Record<string, unknown> = {}
  if (role) where.role = role

  const users = await prisma.user.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email || null,
      role: body.role || 'helper',
    },
  })

  return NextResponse.json(user, { status: 201 })
}
