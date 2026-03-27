'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui'

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
  topTasks?: { id: string; title: string; priority: string; status: string; eventDay?: string; category?: string }[]
}

const EVENT_START = new Date('2026-07-09T00:00:00')
const DAY_LABELS: Record<string, string> = {
  monday: 'Montag',
  tuesday: 'Dienstag',
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag',
  sunday: 'Sonntag',
}
const DAY_DATES: Record<string, string> = {
  monday: '06.07.',
  tuesday: '07.07.',
  thursday: '09.07.',
  friday: '10.07.',
  saturday: '11.07.',
  sunday: '12.07.',
}
const DAY_EVENTS: Record<string, string> = {
  monday: 'Aufbau Innenzelt',
  tuesday: 'Aufbau Zelt',
  thursday: 'Watt-Turnier',
  friday: 'Disco-Party mit DJ Josch',
  saturday: 'Festzeltparty mit Drunter & Drüber',
  sunday: 'Bayrischer Festsonntag',
}
const DAY_ICONS: Record<string, string> = {
  monday: '🔨',
  tuesday: '🏗️',
  thursday: '🃏',
  friday: '🎶',
  saturday: '🎉',
  sunday: '⛪',
}

function Countdown() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const diff = EVENT_START.getTime() - now.getTime()
  if (diff <= 0) return <span className="text-green-400 font-bold text-lg">Das Fest läuft!</span>

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  return (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-white">{days}</div>
        <div className="text-xs text-gray-400 uppercase">Tage</div>
      </div>
      <div className="text-gray-600 text-2xl">:</div>
      <div className="text-center">
        <div className="text-3xl font-bold text-white">{hours}</div>
        <div className="text-xs text-gray-400 uppercase">Stunden</div>
      </div>
    </div>
  )
}

function StatusLight({ value, total, label, href }: { value: number; total: number; label: string; href: string }) {
  const pct = total > 0 ? value / total : 0
  const color = pct >= 0.8 ? 'bg-green-500' : pct >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
  const textColor = pct >= 0.8 ? 'text-green-600' : pct >= 0.5 ? 'text-yellow-600' : 'text-red-600'
  const ringColor = pct >= 0.8 ? 'ring-green-200' : pct >= 0.5 ? 'ring-yellow-200' : 'ring-red-200'

  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">{label}</span>
          <div className={`w-3 h-3 rounded-full ${color} ring-4 ${ringColor}`} />
        </div>
        <div className={`text-2xl font-bold ${textColor}`}>
          {value}/{total}
        </div>
        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct * 100}%` }} />
        </div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
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

  const severityConfig = {
    high: { bg: 'bg-red-50', border: 'border-red-200', icon: '🔴', text: 'text-red-800' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '🟡', text: 'text-yellow-800' },
    low: { bg: 'bg-blue-50', border: 'border-blue-200', icon: '🔵', text: 'text-blue-800' },
  }

  const highWarnings = data.warnings.filter(w => w.severity === 'high')
  const otherWarnings = data.warnings.filter(w => w.severity !== 'high')

  return (
    <div className="space-y-6">
      {/* Header mit Countdown */}
      <div className="bg-gray-900 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase mb-1">DJK Ottenhofen e.V.</p>
          <h1 className="text-2xl font-bold text-white">70-Jahre Jubiläumsfest</h1>
          <p className="text-gray-400 text-sm mt-1">09. – 12. Juli 2026</p>
        </div>
        <div className="bg-gray-800 rounded-xl px-6 py-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Countdown</div>
          <Countdown />
        </div>
      </div>

      {/* Kritische Warnungen */}
      {highWarnings.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🚨</span>
            <h2 className="font-bold text-red-800">Achtung – Handlungsbedarf</h2>
          </div>
          <div className="space-y-2">
            {highWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="shrink-0 mt-0.5">•</span>
                <span>{w.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ampel-Übersicht */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Status-Übersicht</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusLight
            value={data.shiftStats.totalAssignments}
            total={data.shiftStats.totalRequired}
            label="Schichten besetzt"
            href="/team"
          />
          <StatusLight
            value={data.taskStats.done}
            total={data.taskStats.total}
            label="Aufgaben erledigt"
            href="/aufgaben"
          />
          <StatusLight
            value={data.participantStats.paid}
            total={data.participantStats.total}
            label="Teilnehmer bezahlt"
            href="/team"
          />
          <Link href="/getraenke" className="block">
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Produkte aktiv</span>
                <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-200" />
              </div>
              <div className="text-2xl font-bold text-green-600">{data.products}</div>
              <div className="mt-2 text-xs text-gray-400">Getränke & Speisen</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Tagesübersicht als Timeline */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Veranstaltungstage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.dayOverview.map((day) => {
            const shiftPct = day.shifts.total > 0 ? day.shifts.filled / day.shifts.total : 0
            const shiftColor = shiftPct >= 0.8 ? 'text-green-600' : shiftPct >= 0.5 ? 'text-yellow-600' : 'text-red-600'
            const shiftBg = shiftPct >= 0.8 ? 'bg-green-500' : shiftPct >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
            const icon = DAY_ICONS[day.day] || '📅'
            const label = DAY_LABELS[day.day] || day.day
            const date = DAY_DATES[day.day] || ''
            const event = DAY_EVENTS[day.day] || ''

            return (
              <Card key={day.day} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">{label}</h3>
                        <span className="text-xs text-gray-400">{date}</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{event}</p>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Helfer</span>
                          <span className={`font-semibold ${shiftColor}`}>
                            {day.shifts.filled}/{day.shifts.total}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${shiftBg} rounded-full`} style={{ width: `${shiftPct * 100}%` }} />
                        </div>

                        {day.tasks.total > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Aufgaben</span>
                            <span className="text-gray-700">{day.tasks.done}/{day.tasks.total}</span>
                          </div>
                        )}

                        {day.day === 'thursday' && day.participants > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Teilnehmer</span>
                            <span className="text-gray-700">{day.participants}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Zwei-Spalten: Aufgaben + Hinweise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aufgaben-Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Aufgaben</h2>
              <Link href="/aufgaben" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                Alle anzeigen →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">{data.taskStats.open}</div>
                <div className="text-xs text-gray-500">Offen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{data.taskStats.inProgress}</div>
                <div className="text-xs text-gray-500">In Arbeit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{data.taskStats.done}</div>
                <div className="text-xs text-gray-500">Erledigt</div>
              </div>
              {data.taskStats.highPriority > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{data.taskStats.highPriority}</div>
                  <div className="text-xs text-gray-500">Dringend</div>
                </div>
              )}
            </div>
            {data.taskStats.total > 0 && (
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="bg-green-500 transition-all" style={{ width: `${(data.taskStats.done / data.taskStats.total) * 100}%` }} />
                <div className="bg-blue-500 transition-all" style={{ width: `${(data.taskStats.inProgress / data.taskStats.total) * 100}%` }} />
                <div className="bg-gray-300 transition-all" style={{ width: `${(data.taskStats.open / data.taskStats.total) * 100}%` }} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hinweise & Infos */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Hinweise</h2>
          </CardHeader>
          <CardContent>
            {otherWarnings.length > 0 ? (
              <div className="space-y-2">
                {otherWarnings.map((w, i) => {
                  const cfg = severityConfig[w.severity]
                  return (
                    <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg ${cfg.bg} ${cfg.border} border`}>
                      <span className="shrink-0 text-sm">{cfg.icon}</span>
                      <span className={`text-sm ${cfg.text}`}>{w.message}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm">Alles im grünen Bereich!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Helfer-Schnellübersicht */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Helfer-Besetzung</h2>
            <Link href="/team" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Schichtplan öffnen →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{data.users}</div>
              <div className="text-sm text-gray-500 mt-1">Registrierte Helfer</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600">{data.shiftStats.total}</div>
              <div className="text-sm text-gray-500 mt-1">Schichten gesamt</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{data.shiftStats.filled}</div>
              <div className="text-sm text-gray-500 mt-1">Voll besetzt</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className={`text-3xl font-bold ${data.shiftStats.understaffed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {data.shiftStats.understaffed}
              </div>
              <div className="text-sm text-gray-500 mt-1">Unterbesetzt</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
