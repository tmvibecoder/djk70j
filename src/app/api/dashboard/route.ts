import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  // Parallele Abfragen für Performance
  const [
    products,
    tasks,
    participants,
    shifts,
    users,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.task.findMany({
      select: { status: true, priority: true, eventDay: true },
    }),
    prisma.participant.findMany({
      select: { eventDay: true, paid: true },
    }),
    prisma.shift.findMany({
      include: {
        assignments: true,
        station: true,
      },
    }),
    prisma.user.count(),
  ])

  // Task-Statistiken
  const taskStats = {
    total: tasks.length,
    open: tasks.filter((t: { status: string; priority: string }) => t.status === 'open').length,
    inProgress: tasks.filter((t: { status: string; priority: string }) => t.status === 'in_progress').length,
    done: tasks.filter((t: { status: string; priority: string }) => t.status === 'done').length,
    highPriority: tasks.filter((t: { status: string; priority: string }) => t.priority === 'high' && t.status !== 'done').length,
  }

  // Teilnehmer-Statistiken (Watt-Turnier)
  const participantStats = {
    total: participants.filter((p: { eventDay: string; paid: boolean }) => p.eventDay === 'thursday').length,
    paid: participants.filter((p: { eventDay: string; paid: boolean }) => p.eventDay === 'thursday' && p.paid).length,
    unpaid: participants.filter((p: { eventDay: string; paid: boolean }) => p.eventDay === 'thursday' && !p.paid).length,
  }

  // Schicht-Statistiken
  type ShiftType = { eventDay: string; requiredHelpers: number; assignments: unknown[]; station: unknown }
  const shiftStats = {
    total: shifts.length,
    filled: shifts.filter((s: ShiftType) => s.assignments.length >= s.requiredHelpers).length,
    understaffed: shifts.filter((s: ShiftType) => s.assignments.length < s.requiredHelpers).length,
    totalAssignments: shifts.reduce((sum: number, s: ShiftType) => sum + s.assignments.length, 0),
    totalRequired: shifts.reduce((sum: number, s: ShiftType) => sum + s.requiredHelpers, 0),
  }

  // Warnungen generieren
  const warnings: { type: string; message: string; severity: 'low' | 'medium' | 'high' }[] = []

  if (taskStats.highPriority > 0) {
    warnings.push({
      type: 'tasks',
      message: `${taskStats.highPriority} wichtige Aufgabe(n) noch offen`,
      severity: 'high',
    })
  }

  if (shiftStats.understaffed > 0) {
    warnings.push({
      type: 'shifts',
      message: `${shiftStats.understaffed} Schicht(en) unterbesetzt`,
      severity: 'medium',
    })
  }

  if (participantStats.unpaid > 0) {
    warnings.push({
      type: 'participants',
      message: `${participantStats.unpaid} Teilnehmer haben noch nicht bezahlt`,
      severity: 'low',
    })
  }

  // Tagesübersicht
  const eventDays = ['thursday', 'friday', 'saturday', 'sunday']
  type TaskType = { status: string; priority: string; eventDay: string | null }
  type ParticipantType = { eventDay: string; paid: boolean }
  const dayOverview = eventDays.map((day) => {
    const dayShifts = shifts.filter((s: ShiftType) => s.eventDay === day)
    const dayTasks = tasks.filter((t: TaskType) => t.eventDay === day)
    const dayParticipants = participants.filter((p: ParticipantType) => p.eventDay === day)

    return {
      day,
      shifts: {
        total: dayShifts.length,
        filled: dayShifts.filter((s: ShiftType) => s.assignments.length >= s.requiredHelpers).length,
      },
      tasks: {
        total: dayTasks.length,
        done: dayTasks.filter((t: TaskType) => t.status === 'done').length,
      },
      participants: dayParticipants.length,
    }
  })

  return NextResponse.json({
    products,
    users,
    taskStats,
    participantStats,
    shiftStats,
    warnings,
    dayOverview,
  })
}
