'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanerState {
  days: { id: string; name: string; date: string; event: string; hasEntry: boolean; entryFee: number }[]
  scenarios: Record<string, Record<string, { visitors: number; drinksPerPerson: number; drinkSplit: Record<string, number> }>>
  actuals: Record<string, Record<string, number | null>>
  profitPerDrink: number
  prices: { id: number; name: string; category: string; sellPrice: number; costPrice: number }[]
  costs: { id: number; name: string; projected: number; actual: number | null; status: string; costType?: string }[]
  sponsors: { id: number; name: string; amount: number; received: boolean }[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_START = new Date('2026-07-09T00:00:00')

const DAY_META: Record<string, { icon: string; date: string; event: string }> = {
  do: { icon: '🃏', date: '09.07.', event: 'Watt-Turnier' },
  fr: { icon: '🎶', date: '10.07.', event: 'Disco-Party mit DJ Josch' },
  sa: { icon: '🎉', date: '11.07.', event: 'Drunter & Drüber' },
  so: { icon: '⛪', date: '12.07.', event: 'Bayrischer Festsonntag' },
}

const COST_TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  fix: { label: 'Fixkosten', color: '#DC2626', icon: '📌' },
  variabel_getraenke: { label: 'Variabel (Getränke)', color: '#D97706', icon: '🍺' },
  variabel_sonstig: { label: 'Variabel (Sonstiges)', color: '#2563EB', icon: '📦' },
  unklar: { label: 'Unklar / Geschätzt', color: '#7C3AED', icon: '❓' },
}

const SCENARIO_META: Record<string, { label: string; color: string; bg: string }> = {
  conservative: { label: 'Vorsichtig', color: '#6B7280', bg: 'bg-gray-50' },
  realistic: { label: 'Realistisch', color: '#2563EB', bg: 'bg-blue-50' },
  optimistic: { label: 'Optimistisch', color: '#16A34A', bg: 'bg-green-50' },
}

const fmtEur = (v: number) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

// ─── Countdown Component ──────────────────────────────────────────────────────

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

// ─── Revenue Calculation from Scenarios ───────────────────────────────────────

function calcScenarioRevenue(state: PlanerState, scenario: string) {
  let totalDrinkRevenue = 0
  let totalDrinkCost = 0
  let totalEntryRevenue = 0

  const avgPrices: Record<string, { sell: number; cost: number }> = {}
  for (const cat of ['bier', 'softdrinks', 'schnaps']) {
    const catPrices = state.prices.filter(p => p.category === cat)
    if (catPrices.length > 0) {
      avgPrices[cat] = {
        sell: catPrices.reduce((s, p) => s + p.sellPrice, 0) / catPrices.length,
        cost: catPrices.reduce((s, p) => s + p.costPrice, 0) / catPrices.length,
      }
    } else {
      avgPrices[cat] = { sell: 5, cost: 2 }
    }
  }

  for (const day of state.days) {
    const sc = state.scenarios[day.id]?.[scenario]
    if (!sc) continue

    const totalDrinks = sc.visitors * sc.drinksPerPerson
    for (const [cat, pct] of Object.entries(sc.drinkSplit)) {
      const drinks = totalDrinks * (pct / 100)
      const prices = avgPrices[cat] || { sell: 5, cost: 2 }
      totalDrinkRevenue += drinks * prices.sell
      totalDrinkCost += drinks * prices.cost
    }

    if (day.hasEntry) {
      totalEntryRevenue += sc.visitors * day.entryFee
    }
  }

  return { drinkRevenue: totalDrinkRevenue, drinkCost: totalDrinkCost, entryRevenue: totalEntryRevenue }
}

function calcDayScenarioRevenue(state: PlanerState, dayId: string, scenario: string) {
  const day = state.days.find(d => d.id === dayId)
  if (!day) return { revenue: 0, visitors: 0 }

  const sc = state.scenarios[dayId]?.[scenario]
  if (!sc) return { revenue: 0, visitors: 0 }

  const avgPrices: Record<string, { sell: number }> = {}
  for (const cat of ['bier', 'softdrinks', 'schnaps']) {
    const catPrices = state.prices.filter(p => p.category === cat)
    avgPrices[cat] = { sell: catPrices.length > 0 ? catPrices.reduce((s, p) => s + p.sellPrice, 0) / catPrices.length : 5 }
  }

  const totalDrinks = sc.visitors * sc.drinksPerPerson
  let revenue = 0
  for (const [cat, pct] of Object.entries(sc.drinkSplit)) {
    revenue += totalDrinks * (pct / 100) * (avgPrices[cat]?.sell || 5)
  }
  if (day.hasEntry) revenue += sc.visitors * day.entryFee

  return { revenue, visitors: sc.visitors }
}

// ─── Dashboard Component ──────────────────────────────────────────────────────

export default function Dashboard() {
  const [planer, setPlaner] = useState<PlanerState | null>(null)
  const [loading, setLoading] = useState(true)
  const [scenariosOpen, setScenariosOpen] = useState(false)

  useEffect(() => {
    // Load localStorage planer state
    try {
      const saved = localStorage.getItem('djk-planer-state')
      if (saved) setPlaner(JSON.parse(saved))
    } catch { /* ignore */ }

    setLoading(false)
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

  // ── Calculate financial data from planer state ──
  const costs = planer?.costs || []
  const sponsors = planer?.sponsors || []

  const totalFixCosts = costs.filter(c => (c.costType || 'fix') === 'fix').reduce((s, c) => s + (c.projected || 0), 0)
  const totalVarGetraenke = costs.filter(c => c.costType === 'variabel_getraenke').reduce((s, c) => s + (c.projected || 0), 0)
  const totalVarSonstig = costs.filter(c => c.costType === 'variabel_sonstig').reduce((s, c) => s + (c.projected || 0), 0)
  const totalUnklar = costs.filter(c => c.costType === 'unklar').reduce((s, c) => s + (c.projected || 0), 0)
  const totalCosts = costs.reduce((s, c) => s + (c.projected || 0), 0)
  const totalCostsPaid = costs.filter(c => c.status === 'paid').reduce((s, c) => s + (c.projected || 0), 0)
  const totalCostsOpen = totalCosts - totalCostsPaid

  const totalSponsoring = sponsors.reduce((s, sp) => s + (sp.amount || 0), 0)
  const totalSponsoringReceived = sponsors.filter(sp => sp.received).reduce((s, sp) => s + (sp.amount || 0), 0)

  // Scenario calculations
  const scenarios = ['conservative', 'realistic', 'optimistic'] as const
  const scenarioResults = planer ? scenarios.map(sc => {
    const rev = calcScenarioRevenue(planer, sc)
    const totalRevenue = rev.drinkRevenue + rev.entryRevenue + totalSponsoring
    const profit = totalRevenue - totalCosts - rev.drinkCost
    return {
      scenario: sc,
      ...SCENARIO_META[sc],
      drinkRevenue: rev.drinkRevenue,
      drinkCost: rev.drinkCost,
      entryRevenue: rev.entryRevenue,
      sponsoring: totalSponsoring,
      totalRevenue,
      totalCosts: totalCosts + rev.drinkCost,
      profit,
    }
  }) : []

  const realisticResult = scenarioResults.find(s => s.scenario === 'realistic')

  // Day breakdown (realistic)
  const dayBreakdown = planer ? planer.days.map(day => {
    const calc = calcDayScenarioRevenue(planer, day.id, 'realistic')
    return { ...day, ...DAY_META[day.id], ...calc }
  }) : []

  const maxDayRevenue = Math.max(...dayBreakdown.map(d => d.revenue), 1)

  // Cost type breakdown for display
  const costTypeGroups = [
    { type: 'fix', total: totalFixCosts },
    { type: 'variabel_getraenke', total: totalVarGetraenke },
    { type: 'variabel_sonstig', total: totalVarSonstig },
    { type: 'unklar', total: totalUnklar },
  ].filter(g => g.total > 0)

  // Warnings
  const warnings: { message: string; severity: 'high' | 'medium' | 'low' }[] = []
  if (totalUnklar > 0) {
    warnings.push({ message: `${costs.filter(c => c.costType === 'unklar').length} Kostenposition(en) mit unklarem Betrag (${fmtEur(totalUnklar)})`, severity: 'medium' })
  }
  const costsWithoutActual = costs.filter(c => c.actual === null && c.status !== 'paid').length
  if (costsWithoutActual > 0) {
    warnings.push({ message: `${costsWithoutActual} Kostenposition(en) noch ohne Ist-Wert`, severity: 'low' })
  }
  const sponsorsOpen = sponsors.filter(sp => !sp.received && sp.amount > 0).length
  if (sponsorsOpen > 0) {
    warnings.push({ message: `${sponsorsOpen} Sponsor(en) ausstehend`, severity: 'low' })
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

      {/* ── 2. Kostenübersicht & Sponsoring ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Kostenübersicht</h3>
              <Link href="/kosten" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                Details →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bereits bezahlt</span>
                  <span className="font-medium text-green-600">{fmtEur(totalCostsPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Noch offen</span>
                  <span className="font-medium text-red-600">{fmtEur(totalCostsOpen)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
                  <span>Gesamt</span>
                  <span>{fmtEur(totalCosts)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Sponsoring</h3>
              <Link href="/sponsoring" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                Details →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
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
                    <span>{totalSponsoring > 0 ? Math.round((totalSponsoringReceived / totalSponsoring) * 100) : 0}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${totalSponsoring > 0 ? (totalSponsoringReceived / totalSponsoring) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Umsatz pro Tag (realistisch) ──────────────────────────── */}
      {dayBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Umsatz pro Tag (realistisch)</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dayBreakdown.map(day => {
                const pct = maxDayRevenue > 0 ? (day.revenue / maxDayRevenue) * 100 : 0
                return (
                  <div key={day.id} className="flex items-center gap-3">
                    <div className="w-6 text-center text-lg">{day.icon}</div>
                    <div className="w-20 shrink-0">
                      <div className="font-semibold text-gray-900 text-sm">{day.name.substring(0, 2)}.</div>
                      <div className="text-xs text-gray-500">{day.date}</div>
                    </div>
                    <div className="flex-1">
                      <div className="h-7 bg-gray-100 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
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
          </CardContent>
        </Card>
      )}

      {/* ── 4. Erwartetes Ergebnis (einklappbar) ─────────────────────── */}
      {scenarioResults.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => setScenariosOpen(!scenariosOpen)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="font-semibold text-gray-900">Erwartetes Ergebnis</h3>
              <div className="flex items-center gap-3">
                <div className="flex gap-4">
                  {scenarioResults.map(sr => (
                    <div key={sr.scenario} className="text-right">
                      <div className="text-xs font-medium" style={{ color: sr.color }}>{sr.label}</div>
                      <div className={`text-sm font-bold ${sr.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {sr.profit >= 0 ? '+' : ''}{fmtEur(sr.profit)}
                      </div>
                    </div>
                  ))}
                </div>
                <span className={`text-gray-400 transition-transform ${scenariosOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
            </button>
          </CardHeader>
          {scenariosOpen && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scenarioResults.map(sr => {
                  const isRealistic = sr.scenario === 'realistic'
                  return (
                    <div
                      key={sr.scenario}
                      className={`rounded-xl border-2 p-5 transition-shadow ${isRealistic ? 'border-blue-300 shadow-lg shadow-blue-100' : 'border-gray-200'} ${sr.bg}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold" style={{ color: sr.color }}>{sr.label}</span>
                        {isRealistic && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Empfohlen</span>}
                      </div>
                      <div className={`text-3xl font-bold mb-2 ${sr.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {sr.profit >= 0 ? '+' : ''}{fmtEur(sr.profit)}
                      </div>
                      <div className="space-y-1 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>Getränke-Umsatz</span>
                          <span className="font-medium">{fmtEur(sr.drinkRevenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Eintrittsgelder</span>
                          <span className="font-medium">{fmtEur(sr.entryRevenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sponsoring</span>
                          <span className="font-medium">{fmtEur(sr.sponsoring)}</span>
                        </div>
                        <div className="border-t pt-1 mt-1 flex justify-between font-semibold text-gray-900">
                          <span>Einnahmen gesamt</span>
                          <span>{fmtEur(sr.drinkRevenue + sr.entryRevenue + sr.sponsoring)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Kosten gesamt</span>
                          <span className="font-medium">−{fmtEur(sr.totalCosts)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Einnahmen vs. Ausgaben (realistisch) */}
              {realisticResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <Card className="border-green-200">
                    <CardHeader className="pb-2">
                      <h3 className="font-semibold text-green-800">Einnahmen (realistisch)</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🍺</span>
                            <span className="text-gray-800 font-medium">Getränke-Umsatz</span>
                          </div>
                          <span className="font-bold text-gray-900">{fmtEur(realisticResult.drinkRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🎟️</span>
                            <span className="text-gray-800 font-medium">Eintrittsgelder</span>
                          </div>
                          <span className="font-bold text-gray-900">{fmtEur(realisticResult.entryRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🤝</span>
                            <span className="text-gray-800 font-medium">Sponsoring</span>
                          </div>
                          <span className="font-bold text-gray-900">{fmtEur(realisticResult.sponsoring)}</span>
                        </div>
                        <div className="border-t-2 border-green-200 pt-2 flex justify-between">
                          <span className="font-bold text-green-800">Gesamt Einnahmen</span>
                          <span className="font-bold text-green-700 text-lg">{fmtEur(realisticResult.drinkRevenue + realisticResult.entryRevenue + realisticResult.sponsoring)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200">
                    <CardHeader className="pb-2">
                      <h3 className="font-semibold text-red-800">Ausgaben</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {costTypeGroups.map(g => {
                          const meta = COST_TYPE_META[g.type]
                          return (
                            <div key={g.type} className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{meta.icon}</span>
                                <span className="text-gray-800 font-medium">{meta.label}</span>
                              </div>
                              <span className="font-bold text-gray-900">{fmtEur(g.total)}</span>
                            </div>
                          )
                        })}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🍺</span>
                            <span className="text-gray-800 font-medium">Wareneinsatz (Getränke)</span>
                          </div>
                          <span className="font-bold text-gray-900">{fmtEur(realisticResult.drinkCost)}</span>
                        </div>
                        <div className="border-t-2 border-red-200 pt-2 flex justify-between">
                          <span className="font-bold text-red-800">Gesamt Ausgaben</span>
                          <span className="font-bold text-red-700 text-lg">{fmtEur(realisticResult.totalCosts)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* ── 5. Hinweise ──────────────────────────────────────────────── */}
      {warnings.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Hinweise</h3>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
