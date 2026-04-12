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

  const bereichId = searchParams.get('bereichId')
  if (bereichId) where.bereichId = bereichId

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: true,
      bereich: true,
      assignments: { include: { person: true } },
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
      detail: body.detail || null,
      assigneeId: body.assigneeId || null,
      bereichId: body.bereichId || null,
      deadline: body.deadline ? new Date(body.deadline) : null,
      status: body.status || 'offen',
      eventDay: body.eventDay || null,
      category: body.category || null,
      priority: body.priority || 'medium',
    },
  })

  // Optional: Personen-Zuweisungen direkt mitgeben
  if (Array.isArray(body.personIds) && body.personIds.length > 0) {
    await prisma.taskAssignment.createMany({
      data: body.personIds.map((personId: string) => ({ taskId: task.id, personId })),
    })
  }

  const full = await prisma.task.findUnique({
    where: { id: task.id },
    include: { assignee: true, bereich: true, assignments: { include: { person: true } } },
  })

  return NextResponse.json(full, { status: 201 })
}
