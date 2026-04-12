import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  await prisma.task.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      detail: body.detail ?? null,
      assigneeId: body.assigneeId || null,
      bereichId: body.bereichId || null,
      deadline: body.deadline ? new Date(body.deadline) : null,
      status: body.status,
      eventDay: body.eventDay || null,
      category: body.category || null,
      priority: body.priority,
    },
  })

  // Personen-Zuweisungen vollständig ersetzen, wenn personIds übergeben wurde
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
    include: { assignee: true, bereich: true, assignments: { include: { person: true } } },
  })

  return NextResponse.json(task)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.task.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
