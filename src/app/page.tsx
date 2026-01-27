'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { Badge } from '@/components/ui'
import { EVENT_DAY_LABELS, EVENT_DAY_EVENTS } from '@/types'

interface DashboardData {
  products: number
  users: number
  taskStats: {
    total: number
    open: number
    inProgress: number
    done: number
    highPriority: number
  }
  participantStats: {
    total: number
    paid: number
    unpaid: number
  }
  shiftStats: {
    total: number
    filled: number
    understaffed: number
    totalAssignments: number
    totalRequired: number
  }
  warnings: { type: string; message: string; severity: 'low' | 'medium' | 'high' }[]
  dayOverview: {
    day: string
    shifts: { total: number; filled: number }
    tasks: { total: number; done: number }
    participants: number
  }[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Laden...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Fehler beim Laden der Daten</p>
      </div>
    )
  }

  const severityColors = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
  } as const

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">70 Jahre DJK Fest - Planungsübersicht</p>
      </div>

      {/* Warnungen */}
      {data.warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <h2 className="text-lg font-semibold text-yellow-800">Hinweise</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.warnings.map((warning, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Badge variant={severityColors[warning.severity]}>
                    {warning.severity === 'high' ? '!' : warning.severity === 'medium' ? '?' : 'i'}
                  </Badge>
                  <span className="text-yellow-900">{warning.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tagesübersicht */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Veranstaltungstage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.dayOverview.map((day) => (
            <Card key={day.day}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {EVENT_DAY_LABELS[day.day as keyof typeof EVENT_DAY_LABELS]}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {EVENT_DAY_EVENTS[day.day as keyof typeof EVENT_DAY_EVENTS]}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Schichten:</span>
                    <span className={day.shifts.filled < day.shifts.total ? 'text-yellow-600' : 'text-green-600'}>
                      {day.shifts.filled}/{day.shifts.total} besetzt
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aufgaben:</span>
                    <span>
                      {day.tasks.done}/{day.tasks.total} erledigt
                    </span>
                  </div>
                  {day.day === 'thursday' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Teilnehmer:</span>
                      <span>{day.participants}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Schnellübersicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/getraenke">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🍺</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.products}</p>
                  <p className="text-sm text-gray-500">Produkte</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/aufgaben">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="text-3xl">✅</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.taskStats.done}/{data.taskStats.total}
                  </p>
                  <p className="text-sm text-gray-500">Aufgaben erledigt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/helfer">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="text-3xl">👥</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.shiftStats.totalAssignments}/{data.shiftStats.totalRequired}
                  </p>
                  <p className="text-sm text-gray-500">Schichten besetzt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teilnehmer">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🎯</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.participantStats.total}</p>
                  <p className="text-sm text-gray-500">
                    Watt-Teilnehmer ({data.participantStats.paid} bezahlt)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Aufgaben-Status */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Aufgaben-Status</h2>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm">{data.taskStats.open} Offen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm">{data.taskStats.inProgress} In Bearbeitung</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">{data.taskStats.done} Erledigt</span>
            </div>
          </div>
          {data.taskStats.total > 0 && (
            <div className="mt-4 h-4 bg-gray-200 rounded-full overflow-hidden flex">
              <div
                className="bg-green-500"
                style={{ width: `${(data.taskStats.done / data.taskStats.total) * 100}%` }}
              />
              <div
                className="bg-blue-500"
                style={{ width: `${(data.taskStats.inProgress / data.taskStats.total) * 100}%` }}
              />
              <div
                className="bg-gray-400"
                style={{ width: `${(data.taskStats.open / data.taskStats.total) * 100}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
