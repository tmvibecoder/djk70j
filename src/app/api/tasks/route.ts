import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_EVENT_ID } from '@/data/veranstaltungen'
import { erfordereRolle } from '@/lib/session'

export async function GET(request: NextRequest) {
  const verboten = await erfordereRolle(request, 'veranstaltungen', 'lesen')
  if (verboten) return verboten

  const searchParams = request.nextUrl.searchParams
  const eventDay = searchParams.get('eventDay')
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const bereichId = searchParams.get('bereichId')

  const where: Record<string, unknown> = {
    eventId: searchParams.get('event') ?? DEFAULT_EVENT_ID,
  }
  if (eventDay) where.eventDay = eventDay
  if (status) where.status = status
  if (category) where.category = category
  if (bereichId) where.bereichId = bereichId

  const tasks = await prisma.task.findMany({
    where,
    include: {
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
  const verboten = await erfordereRolle(request, 'veranstaltungen', 'bearbeiten')
  if (verboten) return verboten

  const body = await request.json()

  const task = await prisma.task.create({
    data: {
      eventId: body.eventId ?? DEFAULT_EVENT_ID,
      title: body.title,
      description: body.description || null,
      detail: body.detail || null,
      bereichId: body.bereichId || null,
      deadline: body.deadline ? new Date(body.deadline) : null,
      status: body.status || 'offen',
      eventDay: body.eventDay || null,
      category: body.category || null,
      priority: body.priority || 'medium',
    },
  })

  if (Array.isArray(body.personIds) && body.personIds.length > 0) {
    await prisma.taskAssignment.createMany({
      data: body.personIds.map((personId: string) => ({ taskId: task.id, personId })),
    })
  }

  const full = await prisma.task.findUnique({
    where: { id: task.id },
    include: { bereich: true, assignments: { include: { person: true } } },
  })

  return NextResponse.json(full, { status: 201 })
}
