import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const eventDay = searchParams.get('eventDay')
  const status = searchParams.get('status')
  const assigneeId = searchParams.get('assigneeId')
  const category = searchParams.get('category')

  const where: Record<string, unknown> = {}
  if (eventDay) where.eventDay = eventDay
  if (status) where.status = status
  if (assigneeId) where.assigneeId = assigneeId
  if (category) where.category = category

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: true,
    },
    orderBy: [
      { priority: 'desc' },
      { deadline: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  return NextResponse.json(tasks)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description || null,
      assigneeId: body.assigneeId || null,
      deadline: body.deadline ? new Date(body.deadline) : null,
      status: body.status || 'open',
      eventDay: body.eventDay || null,
      category: body.category || null,
      priority: body.priority || 'medium',
    },
    include: {
      assignee: true,
    },
  })

  return NextResponse.json(task, { status: 201 })
}
