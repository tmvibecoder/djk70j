import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      assigneeId: body.assigneeId || null,
      deadline: body.deadline ? new Date(body.deadline) : null,
      status: body.status,
      eventDay: body.eventDay || null,
      category: body.category || null,
      priority: body.priority,
    },
    include: {
      assignee: true,
    },
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
