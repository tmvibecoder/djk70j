'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardData {
  products: { id: string; name: string; salePrice: number; purchasePrice: number; category: string; isActive: boolean }[]
  costs: { id: string; name: string; projected: number; actual: number | null; dueDate: string; costType: string }[]
  sponsors: { id: string; name: string; amount: number; received: boolean }[]
  forecasts: { productId: string; eventDay: string; scenario: string; quantity: number; product: { salePrice: number; purchasePrice: number } }[]
  entryForecasts: { eventDay: string; scenario: string; visitors: number; entryFee: number }[]
}

const EVENT_START = new Date('2026-07-09T00:00:00')

const EVENT_DAYS = [
  { key: 'thursday', label: 'Do', date: '09.07.', event: 'Watt-Turnier', icon: '🃏' },
  { key: 'friday', label: 'Fr', date: '10.07.', event: 'DJ Josch', icon: '🎶' },
  { key: 'saturday', label: 'Sa', date: '11.07.', event: 'Drunter & Drüber', icon: '🎉' },
  { key: 'sunday', label: 'So', date: '12.07.', event: 'Festsonntag', icon: '⛪' },
]

const SCENARIOS = [
  { key: 'pessimistic', label: 'Pessimistisch', color: 'text-red-600' },
  { key: 'realistic', label: 'Realistisch', color: 'text-blue-600' },
  { key: 'optimistic', label: 'Optimistisch', color: 'text-green-600' },
]

const COST_TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  fix: { label: 'Fixkosten', color: '#DC2626', icon: '📌' },
  variabel_getraenke: { label: 'Variabel (Getränke)', color: '#D97706', icon: '🍺' },
  variabel_sonstig: { label: 'Variabel (Sonstiges)', color: '#2563EB', icon: '📦' },
  unklar: { label: 'Unklar / Geschätzt', color: '#7C3AED', icon: '❓' },
}

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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      try {
        const [productsRes, costsRes, sponsorsRes, forecastRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/costs'),
          fetch('/api/sponsors'),
          fetch('/api/forecast'),
        ])
        const [products, costs, sponsors, forecastData] = await Promise.all([
          productsRes.json(),
          costsRes.json(),
          sponsorsRes.json(),
          forecastRes.json(),
        ])
        setData({
          products,
          costs,
          sponsors,
          forecasts: forecastData.forecasts,
          entryForecasts: forecastData.entryForecasts,
        })
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

  if (!data) return <div className="text-center text-gray-400 py-12">Fehler beim Laden der Daten.</div>

  const { costs, sponsors, forecasts, entryForecasts } = data

  // Cost calculations
  const totalCosts = costs.reduce((s, c) => s + c.projected, 0)
  const totalCostsPaid = costs.filter(c => c.dueDate === 'paid').reduce((s, c) => s + c.projected, 0)

  // Sponsoring calculations
  const totalSponsoring = sponsors.reduce((s, sp) => s + sp.amount, 0)
  const totalSponsoringReceived = sponsors.filter(sp => sp.received).reduce((s, sp) => s + sp.amount, 0)

  // Revenue per scenario
  const calcScenarioRevenue = (scenario: string) => {
    const entries = forecasts.filter(f => f.scenario === scenario)
    let drinkRevenue = 0
    let drinkCost = 0
    for (const e of entries) {
      drinkRevenue += e.quantity * e.product.salePrice
      drinkCost += e.quantity * e.product.purchasePrice
    }
    const entryEntries = entryForecasts.filter(f => f.scenario === scenario)
    const entryRevenue = entryEntries.reduce((s, e) => s + e.visitors * e.entryFee, 0)
    return { drinkRevenue, drinkCost, entryRevenue }
  }

  const scenarioResults = SCENARIOS.map(sc => {
    const rev = calcScenarioRevenue(sc.key)
    const totalRevenue = rev.drinkRevenue + rev.entryRevenue + totalSponsoring
    const totalExpenses = totalCosts + rev.drinkCost
    const profit = totalRevenue - totalExpenses
    return { ...sc, ...rev, totalRevenue, totalExpenses, profit }
  })

  // Day breakdown (realistic)
  const dayBreakdown = EVENT_DAYS.map(day => {
    const dayForecasts = forecasts.filter(f => f.eventDay === day.key && f.scenario === 'realistic')
    const revenue = dayForecasts.reduce((s, e) => s + e.quantity * e.product.salePrice, 0)
    const dayEntry = entryForecasts.find(f => f.eventDay === day.key && f.scenario === 'realistic')
    const entryRevenue = dayEntry ? dayEntry.visitors * dayEntry.entryFee : 0
    return { ...day, revenue: revenue + entryRevenue, visitors: dayEntry?.visitors || 0 }
  })
  const maxDayRevenue = Math.max(...dayBreakdown.map(d => d.revenue), 1)

  // Cost type groups
  const costTypeGroups = ['fix', 'variabel_getraenke', 'variabel_sonstig', 'unklar']
    .map(type => ({ type, total: costs.filter(c => c.costType === type).reduce((s, c) => s + c.projected, 0) }))
    .filter(g => g.total > 0)

  // Warnings
  const warnings: { message: string; severity: 'high' | 'medium' | 'low' }[] = []
  const unklar = costs.filter(c => c.costType === 'unklar')
  if (unklar.length > 0) {
    warnings.push({ message: `${unklar.length} Kostenposition(en) mit unklarem Betrag (${fmtEur(unklar.reduce((s, c) => s + c.projected, 0))})`, severity: 'medium' })
  }
  const sponsorsOpen = sponsors.filter(sp => !sp.received && sp.amount > 0).length
  if (sponsorsOpen > 0) {
    warnings.push({ message: `${sponsorsOpen} Sponsor(en) ausstehend`, severity: 'low' })
  }
  const activeProducts = data.products.filter(p => p.isActive).length
  if (activeProducts === 0) {
    warnings.push({ message: 'Noch keine Produkte angelegt. Produkte sind Grundlage für die Prognose.', severity: 'high' })
  }
  if (forecasts.length === 0) {
    warnings.push({ message: 'Noch keine Prognose-Daten erfasst.', severity: 'medium' })
  }

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

      {/* Erwartetes Ergebnis - 3 Szenarien */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarioResults.map(sr => {
          const isRealistic = sr.key === 'realistic'
          return (
            <div key={sr.key} className={`bg-white rounded-xl border-2 p-5 ${isRealistic ? 'border-blue-300 shadow-lg shadow-blue-100' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold ${sr.color}`}>{sr.label}</span>
                {isRealistic && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Empfohlen</span>}
              </div>
              <div className={`text-3xl font-bold mb-1 ${sr.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {sr.profit >= 0 ? '+' : ''}{fmtEur(sr.profit)}
              </div>
              <div className="text-xs text-gray-500">
                Einnahmen {fmtEur(sr.totalRevenue)} – Ausgaben {fmtEur(sr.totalExpenses)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Kosten & Sponsoring nebeneinander */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kostenübersicht */}
        <div className="bg-white rounded-lg shadow border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Kostenübersicht</h3>
            <Link href="/finanzen" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Details →</Link>
          </div>
          <div className="space-y-3">
            {costTypeGroups.map(g => {
              const meta = COST_TYPE_META[g.type]
              const pct = totalCosts > 0 ? (g.total / totalCosts) * 100 : 0
              return (
                <div key={g.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800">{meta.icon} {meta.label}</span>
                    <span className="font-bold" style={{ color: meta.color }}>{fmtEur(g.total)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                  </div>
                </div>
              )
            })}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bezahlt</span>
                <span className="font-medium text-green-600">{fmtEur(totalCostsPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Offen</span>
                <span className="font-medium text-red-600">{fmtEur(totalCosts - totalCostsPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
                <span>Gesamt</span>
                <span>{fmtEur(totalCosts)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sponsoring */}
        <div className="bg-white rounded-lg shadow border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Sponsoring</h3>
            <Link href="/finanzen" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Details →</Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Zugesagt</span>
              <span className="font-bold text-gray-900">{fmtEur(totalSponsoring)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Erhalten</span>
              <span className="font-bold text-green-600">{fmtEur(totalSponsoringReceived)}</span>
            </div>
            {totalSponsoring > 0 && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Fortschritt</span>
                  <span>{Math.round((totalSponsoringReceived / totalSponsoring) * 100)}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${(totalSponsoringReceived / totalSponsoring) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Umsatz pro Tag (realistisch) */}
      <div className="bg-white rounded-lg shadow border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Umsatz pro Tag (realistisch)</h3>
          <Link href="/prognose" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Prognose →</Link>
        </div>
        <div className="space-y-3">
          {dayBreakdown.map(day => {
            const pct = maxDayRevenue > 0 ? (day.revenue / maxDayRevenue) * 100 : 0
            return (
              <div key={day.key} className="flex items-center gap-3">
                <div className="w-6 text-center text-lg">{day.icon}</div>
                <div className="w-20 shrink-0">
                  <div className="font-semibold text-gray-900 text-sm">{day.label}</div>
                  <div className="text-xs text-gray-500">{day.date}</div>
                </div>
                <div className="flex-1">
                  <div className="h-7 bg-gray-100 rounded-full overflow-hidden relative">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                      {fmtEur(day.revenue)}
                    </span>
                  </div>
                </div>
                <div className="w-20 text-right text-xs text-gray-500 shrink-0">
                  ~{day.visitors} Besucher
                </div>
              </div>
            )
          })}
          <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
            <span>Gesamt</span>
            <span>{fmtEur(dayBreakdown.reduce((s, d) => s + d.revenue, 0))}</span>
          </div>
        </div>
      </div>

      {/* Hinweise */}
      {warnings.length > 0 && (
        <div className="bg-white rounded-lg shadow border p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Hinweise</h3>
          <div className="space-y-2">
            {warnings.map((w, i) => {
              const cfg = w.severity === 'high'
                ? { bg: 'bg-red-50', border: 'border-red-200', icon: '🔴', text: 'text-red-800' }
                : w.severity === 'medium'
                  ? { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '🟡', text: 'text-yellow-800' }
                  : { bg: 'bg-blue-50', border: 'border-blue-200', icon: '🔵', text: 'text-blue-800' }
              return (
                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg ${cfg.bg} ${cfg.border} border`}>
                  <span className="shrink-0 text-sm">{cfg.icon}</span>
                  <span className={`text-sm ${cfg.text}`}>{w.message}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
