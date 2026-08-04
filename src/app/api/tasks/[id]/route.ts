import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { erfordereRolle } from '@/lib/session'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const verboten = await erfordereRolle(request, 'veranstaltungen', 'bearbeiten')
  if (verboten) return verboten

  const { id } = await params
  const body = await request.json()

  await prisma.task.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      detail: body.detail ?? null,
      bereichId: body.bereichId || null,
      deadline: body.deadline ? new Date(body.deadline) : null,
      status: body.status,
      eventDay: body.eventDay || null,
      category: body.category || null,
      priority: body.priority,
    },
  })

  if (Array.isArray(body.personIds)) {
    await prisma.taskAssignment.deleteMany({ where: { taskId: id } })
    if (body.personIds.length > 0) {
      await prisma.taskAssignment.createMany({
        data: body.personIds.map((personId: string) => ({ taskId: id, personId })),
      })
    }
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: { bereich: true, assignments: { include: { person: true } } },
  })

  return NextResponse.json(task)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const verboten = await erfordereRolle(request, 'veranstaltungen', 'bearbeiten')
  if (verboten) return verboten

  const { id } = await params
  await prisma.task.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
