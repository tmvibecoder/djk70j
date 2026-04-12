'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { bereichStats, globalStats, type BereichDTO, type TaskDTO } from '@/types/protokolle'

interface SimpleForecast {
  eventDay: string
  scenario: string
  visitors: number
  revenuePerPerson: number
  entryFee: number
  costPercent: number
}

interface CostItem {
  id: string
  name: string
  projected: number
  actual: number | null
  dueDate: string
  costType: string
  status: string
}

interface Sponsor {
  id: string
  name: string
  amount: number
  received: boolean
}

const EVENT_START = new Date('2026-07-09T00:00:00')

const EVENT_DAYS = [
  { key: 'thursday', label: 'Do', date: '09.07.', event: 'Watt-Turnier', icon: '🃏' },
  { key: 'friday', label: 'Fr', date: '10.07.', event: 'DJ Josch', icon: '🎶' },
  { key: 'saturday', label: 'Sa', date: '11.07.', event: 'Drunter & Drüber', icon: '🎉' },
  { key: 'sunday', label: 'So', date: '12.07.', event: 'Festsonntag', icon: '⛪' },
]

const fmtEur = (v: number) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

function Countdown() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const diff = EVENT_START.getTime() - now.getTime()
  if (diff <= 0) return <span className="text-green-400 font-bold text-lg">Das Fest läuft!</span>

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  return (
    <div className="text-center">
      <div className="text-xl font-bold text-white">{days}</div>
      <div className="text-[10px] text-gray-500 uppercase">Tage</div>
    </div>
  )
}

export default function Dashboard() {
  const [forecasts, setForecasts] = useState<SimpleForecast[]>([])
  const [costs, setCosts] = useState<CostItem[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [bereiche, setBereiche] = useState<BereichDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      try {
        const [forecastRes, costsRes, sponsorsRes, bereicheRes] = await Promise.all([
          fetch('/api/simple-forecast'),
          fetch('/api/costs'),
          fetch('/api/sponsors'),
          fetch('/api/bereiche'),
        ])
        const [forecastData, costsData, sponsorsData, bereicheData] = await Promise.all([
          forecastRes.json(),
          costsRes.json(),
          sponsorsRes.json(),
          bereicheRes.json(),
        ])
        setForecasts(forecastData)
        setCosts(costsData)
        setSponsors(sponsorsData)
        setBereiche(bereicheData)
      } catch {
        // ignore
      }
      setLoading(false)
    }
    loadAll()
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

  // --- Finanzen aus SimpleForecast (realistisch) ---
  const realisticForecasts = forecasts.filter(f => f.scenario === 'realistic')
  let totalRevenue = 0
  let totalEntryCost = 0
  let totalEntryFee = 0
  for (const f of realisticForecasts) {
    const umsatz = f.visitors * f.revenuePerPerson
    totalRevenue += umsatz
    totalEntryCost += umsatz * (f.costPercent / 100)
    totalEntryFee += f.visitors * f.entryFee
  }

  const totalCosts = costs.reduce((s, c) => s + c.projected, 0)
  const totalCostsPaid = costs.filter(c => c.dueDate === 'paid').reduce((s, c) => s + c.projected, 0)
  const totalSponsoring = sponsors.reduce((s, sp) => s + sp.amount, 0)
  const totalSponsoringReceived = sponsors.filter(sp => sp.received).reduce((s, sp) => s + sp.amount, 0)

  const grossRevenue = totalRevenue + totalEntryFee + totalSponsoring
  const grossExpenses = totalCosts + totalEntryCost
  const expectedProfit = grossRevenue - grossExpenses

  // --- Protokoll-Aufgaben aggregiert ---
  const allTasks: TaskDTO[] = bereiche.flatMap(b => b.tasks)
  const openTasks = allTasks.filter(t => t.status === 'offen')
  const inProgressTasks = allTasks.filter(t => t.status === 'in_arbeit')
  const doneTasks = allTasks.filter(t => t.status === 'erledigt')
  const highPrioTasks = openTasks.slice(0, 5)

  // --- Protokoll-Fortschritt ---
  const bereicheWithStats = bereiche.map(b => {
    const stats = bereichStats(b)
    const pct = stats.total > 0 ? Math.round((stats.erledigt / stats.total) * 100) : 100
    return { ...b, stats, pct }
  }).sort((a, b) => b.pct - a.pct)

  const protokollGlobal = globalStats(bereiche)
  const overallPct = protokollGlobal.total > 0 ? Math.round((protokollGlobal.erledigt / protokollGlobal.total) * 100) : 0

  // --- Dringende Aufgaben & Beschlüsse aus Protokollen ---
  const dringend = bereiche.flatMap(b =>
    b.tasks
      .filter(t => t.status === 'offen' && t.assignments.filter(a => !a.person.isCatchAll).length === 0)
      .map(t => ({ bereich: b, task: t }))
  )
  const recentBeschluesse = bereiche.filter(b => b.beschluesse.length > 0).slice(0, 4)
  const offeneProtokollAufgaben = bereiche.flatMap(b =>
    b.tasks.filter(t => t.status === 'offen').map(t => ({ bereich: b, task: t }))
  ).slice(0, 3)

  // --- Warnungen ---
  const warnings: { message: string; detail?: string; severity: 'high' | 'medium' | 'low' }[] = []
  const unklar = costs.filter(c => c.costType === 'unklar')
  if (unklar.length > 0) {
    warnings.push({ message: `${unklar.length} Kostenposition(en) unklar`, detail: fmtEur(unklar.reduce((s, c) => s + c.projected, 0)), severity: 'medium' })
  }
  const sponsorsOpen = sponsors.filter(sp => !sp.received && sp.amount > 0).length
  if (sponsorsOpen > 0) {
    warnings.push({ message: `${sponsorsOpen} Sponsor(en) ausstehend`, detail: fmtEur(totalSponsoring - totalSponsoringReceived), severity: 'low' })
  }
  if (dringend.length > 0) {
    warnings.push({ message: `${dringend.length} Protokoll-Aufgabe(n) ohne Verantwortlichen`, severity: 'high' })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gray-900 rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase mb-1">DJK Ottenhofen e.V.</p>
            <h1 className="text-2xl font-bold text-white">70-Jahre Jubiläumsfest</h1>
            <p className="text-gray-400 text-sm mt-1">09. – 12. Juli 2026</p>
          </div>
          <div className="bg-gray-800 rounded-xl px-4 py-2">
            <Countdown />
          </div>
        </div>

        {/* Event-Tage Mini-Karten */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {EVENT_DAYS.map(day => (
            <div key={day.key} className="bg-gray-800 rounded-lg px-3 py-2 min-w-[80px] text-center shrink-0">
              <div className="text-xs text-gray-500">{day.label} {day.date}</div>
              <div className="text-sm font-semibold text-white">{day.icon}</div>
              <div className="text-[10px] text-gray-400">{day.event}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Erwarteter Gewinn */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-1">Erwarteter Gewinn</div>
            <div className="text-3xl font-bold">{expectedProfit >= 0 ? '+' : ''}{fmtEur(expectedProfit)}</div>
            <div className="text-xs text-indigo-200 mt-1">Realistisches Szenario</div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-xs text-indigo-200">Einnahmen: <span className="text-white font-semibold">{fmtEur(grossRevenue)}</span></div>
            <div className="text-xs text-indigo-200">Ausgaben: <span className="text-white font-semibold">{fmtEur(grossExpenses)}</span></div>
            <Link href="/finanzen" className="text-xs text-indigo-200 underline hover:text-white">Finanzplanung →</Link>
          </div>
        </div>
      </div>

      {/* Planungsfortschritt */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-sm">Planungsfortschritt</h3>
          <Link href="/protokolle" className="text-xs text-indigo-600 font-medium">Protokolle →</Link>
        </div>
        <div className="space-y-3">
          {bereicheWithStats.map(b => {
            const barColor = b.pct >= 80 ? 'bg-green-500' : b.pct >= 50 ? 'bg-amber-500' : 'bg-red-400'
            const textColor = b.pct >= 80 ? 'text-green-600' : b.pct >= 50 ? 'text-amber-600' : 'text-red-500'
            return (
              <div key={b.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{b.icon}</span>
                    <span className="text-xs font-medium text-gray-800">{b.name}</span>
                  </div>
                  <span className={`text-xs font-bold ${textColor}`}>{b.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${b.pct}%` }} />
                </div>
                {b.stats.offen > 0 && (
                  <div className="text-[10px] text-amber-600 mt-0.5 font-medium">
                    {b.stats.offen} offen · {b.stats.inArbeit} in Arbeit
                  </div>
                )}
              </div>
            )
          })}
          {/* Gesamt */}
          <div className="border-t mt-3 pt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-900">Gesamt</span>
              <span className="text-xs font-bold text-indigo-600">{overallPct}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Finanzen kompakt */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-[10px] text-gray-500 font-medium uppercase mb-2">Kosten</div>
          <div className="text-lg font-bold text-gray-900 mb-1">{fmtEur(totalCosts)}</div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalCosts > 0 ? (totalCostsPaid / totalCosts) * 100 : 0}%` }} />
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-green-600 font-medium">{fmtEur(totalCostsPaid)} bezahlt</span>
            <span className="text-red-500">{fmtEur(totalCosts - totalCostsPaid)} offen</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-[10px] text-gray-500 font-medium uppercase mb-2">Sponsoring</div>
          <div className="text-lg font-bold text-gray-900 mb-1">{fmtEur(totalSponsoring)}</div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalSponsoring > 0 ? (totalSponsoringReceived / totalSponsoring) * 100 : 0}%` }} />
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-green-600 font-medium">{fmtEur(totalSponsoringReceived)} erhalten</span>
            <span className="text-amber-500">{fmtEur(totalSponsoring - totalSponsoringReceived)} offen</span>
          </div>
        </div>
      </div>

      {/* Offene Aufgaben */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 text-sm">Offene Aufgaben</h3>
            {openTasks.length > 0 && (
              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{openTasks.length}</span>
            )}
          </div>
          <Link href="/protokolle" className="text-xs text-indigo-600 font-medium">Alle →</Link>
        </div>
        {highPrioTasks.length > 0 ? (
          <div className="space-y-2">
            {highPrioTasks.map(task => {
              const owners = task.assignments.filter(a => !a.person.isCatchAll).map(a => a.person.name).join(', ')
              return (
                <div key={task.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                  <span className="text-red-400 text-xs mt-1 shrink-0">⬤</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    <div className="text-xs text-gray-500">
                      {owners || 'Kein Verantwortlicher'}
                      {task.detail ? ` · ${task.detail}` : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Keine offenen Aufgaben</p>
        )}
        {/* Aufgaben-Zusammenfassung */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{openTasks.length}</div>
            <div className="text-[10px] text-gray-500 font-medium">Offen</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-600">{inProgressTasks.length}</div>
            <div className="text-[10px] text-gray-500 font-medium">In Arbeit</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{doneTasks.length}</div>
            <div className="text-[10px] text-gray-500 font-medium">Erledigt</div>
          </div>
        </div>
      </div>

      {/* Beschlüsse & offene Protokoll-Punkte */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-sm">Aktuelle Beschlüsse & Offene Punkte</h3>
          <Link href="/protokolle" className="text-xs text-indigo-600 font-medium">Protokolle →</Link>
        </div>
        <div className="space-y-3">
          {recentBeschluesse.map((bereich, idx) => (
            <div key={`b-${idx}`} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                {idx < recentBeschluesse.length - 1 || offeneProtokollAufgaben.length > 0 ? (
                  <div className="w-0.5 flex-1 bg-gray-200" />
                ) : null}
              </div>
              <div className="pb-3 min-w-0">
                <div className="text-xs text-gray-400">{bereich.icon} {bereich.name}</div>
                <div className="text-sm font-medium text-gray-900 mt-0.5">
                  {bereich.beschluesse[0]?.text}
                  {bereich.beschluesse.length > 1 && (
                    <span className="text-xs text-gray-400 ml-1">+{bereich.beschluesse.length - 1} weitere</span>
                  )}
                </div>
                <div className="text-xs text-green-600 font-medium mt-0.5">✓ Beschluss</div>
              </div>
            </div>
          ))}
          {offeneProtokollAufgaben.map((entry, idx) => {
            const owners = entry.task.assignments.filter(a => !a.person.isCatchAll).map(a => a.person.name).join(', ')
            return (
              <div key={`a-${entry.task.id}`} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                  {idx < offeneProtokollAufgaben.length - 1 ? (
                    <div className="w-0.5 flex-1 bg-gray-200" />
                  ) : null}
                </div>
                <div className="pb-3 min-w-0">
                  <div className="text-xs text-gray-400">{entry.bereich.icon} {entry.bereich.name}</div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5">{entry.task.title}</div>
                  <div className="text-xs text-amber-600 font-medium mt-0.5">⬤ Offen{owners ? ` · ${owners}` : ''}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Handlungsbedarf */}
      {warnings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Handlungsbedarf</h3>
          <div className="space-y-2">
            {warnings.map((w, i) => {
              const cfg = w.severity === 'high'
                ? { bg: 'bg-red-50', border: 'border-red-200', icon: '🔴', text: 'text-red-800' }
                : w.severity === 'medium'
                  ? { bg: 'bg-amber-50', border: 'border-amber-200', icon: '🟡', text: 'text-amber-800' }
                  : { bg: 'bg-blue-50', border: 'border-blue-200', icon: '🔵', text: 'text-blue-800' }
              return (
                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg ${cfg.bg} ${cfg.border} border`}>
                  <span className="shrink-0 text-sm">{cfg.icon}</span>
                  <div>
                    <span className={`text-sm font-medium ${cfg.text}`}>{w.message}</span>
                    {w.detail && <span className={`text-xs ${cfg.text} ml-1 opacity-75`}>({w.detail})</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
