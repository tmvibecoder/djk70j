'use client'

import { useState, useEffect, useCallback } from 'react'

interface Product {
  id: string
  name: string
  purchasePrice: number
  salePrice: number
  unit: string
  category: string
}

interface ForecastEntry {
  productId: string
  eventDay: string
  scenario: string
  quantity: number
}

interface EntryForecast {
  eventDay: string
  scenario: string
  visitors: number
  entryFee: number
}

const EVENT_DAYS = [
  { key: 'thursday', label: 'Donnerstag', short: 'Do', date: '09.07.', event: 'Watt-Turnier', icon: '🃏' },
  { key: 'friday', label: 'Freitag', short: 'Fr', date: '10.07.', event: 'Disco-Party mit DJ Josch', icon: '🎶' },
  { key: 'saturday', label: 'Samstag', short: 'Sa', date: '11.07.', event: 'Drunter & Drüber', icon: '🎉' },
  { key: 'sunday', label: 'Sonntag', short: 'So', date: '12.07.', event: 'Bayrischer Festsonntag', icon: '⛪' },
]

const SCENARIOS = [
  { key: 'pessimistic', label: 'Pessimistisch', color: '#DC2626', bg: 'bg-red-50', textColor: 'text-red-600', borderColor: 'border-red-200' },
  { key: 'realistic', label: 'Realistisch', color: '#2563EB', bg: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-300' },
  { key: 'optimistic', label: 'Optimistisch', color: '#16A34A', bg: 'bg-green-50', textColor: 'text-green-600', borderColor: 'border-green-200' },
]

const CATEGORIES = ['Bier & Radler', 'Softdrinks', 'Schnaps & Shots', 'Longdrinks', 'Wein & Sekt', 'Warme Speisen', 'Snacks']
const CAT_ICONS: Record<string, string> = {
  'Bier & Radler': '🍺', 'Softdrinks': '🥤', 'Schnaps & Shots': '🥃',
  'Longdrinks': '🍹', 'Wein & Sekt': '🍷', 'Warme Speisen': '🍖', 'Snacks': '🥨',
}

const fmtEur = (v: number) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

export default function PrognosePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [forecasts, setForecasts] = useState<ForecastEntry[]>([])
  const [entryForecasts, setEntryForecasts] = useState<EntryForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDay, setSelectedDay] = useState('thursday')
  const [selectedScenario, setSelectedScenario] = useState('realistic')

  // Local edits (key: `${productId}-${day}-${scenario}` => quantity)
  const [localEdits, setLocalEdits] = useState<Record<string, number>>({})
  const [localEntryEdits, setLocalEntryEdits] = useState<Record<string, { visitors: number; entryFee: number }>>({})

  const load = useCallback(async () => {
    const res = await fetch('/api/forecast')
    const data = await res.json()
    setProducts(data.products)
    setForecasts(data.forecasts.map((f: ForecastEntry & { product: Product }) => ({
      productId: f.productId,
      eventDay: f.eventDay,
      scenario: f.scenario,
      quantity: f.quantity,
    })))
    setEntryForecasts(data.entryForecasts)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const getQuantity = (productId: string, day: string, scenario: string): number => {
    const key = `${productId}-${day}-${scenario}`
    if (key in localEdits) return localEdits[key]
    const entry = forecasts.find(f => f.productId === productId && f.eventDay === day && f.scenario === scenario)
    return entry?.quantity || 0
  }

  const setQuantity = (productId: string, day: string, scenario: string, qty: number) => {
    const key = `${productId}-${day}-${scenario}`
    setLocalEdits(prev => ({ ...prev, [key]: qty }))
  }

  const getEntry = (day: string, scenario: string) => {
    const key = `${day}-${scenario}`
    if (key in localEntryEdits) return localEntryEdits[key]
    const entry = entryForecasts.find(f => f.eventDay === day && f.scenario === scenario)
    return { visitors: entry?.visitors || 0, entryFee: entry?.entryFee || 0 }
  }

  const setEntry = (day: string, scenario: string, field: 'visitors' | 'entryFee', value: number) => {
    const key = `${day}-${scenario}`
    const current = getEntry(day, scenario)
    setLocalEntryEdits(prev => ({ ...prev, [key]: { ...current, [field]: value } }))
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      // Save forecast entries
      const entries = Object.entries(localEdits).map(([key, quantity]) => {
        const [productId, eventDay, scenario] = key.split('-')
        return { productId, eventDay, scenario, quantity }
      })
      if (entries.length > 0) {
        await fetch('/api/forecast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries }) })
      }

      // Save entry forecasts
      for (const [key, data] of Object.entries(localEntryEdits)) {
        const [eventDay, scenario] = key.split('-')
        await fetch('/api/forecast', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'entry', eventDay, scenario, ...data }),
        })
      }

      setLocalEdits({})
      setLocalEntryEdits({})
      await load()
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = Object.keys(localEdits).length > 0 || Object.keys(localEntryEdits).length > 0

  // Calculate totals for current view
  const calcDayRevenue = (day: string, scenario: string) => {
    let revenue = 0
    let cost = 0
    for (const p of products) {
      const qty = getQuantity(p.id, day, scenario)
      revenue += qty * p.salePrice
      cost += qty * p.purchasePrice
    }
    const entry = getEntry(day, scenario)
    const entryRevenue = entry.visitors * entry.entryFee
    return { revenue, cost, margin: revenue - cost, entryRevenue, total: revenue + entryRevenue }
  }

  const calcScenarioTotal = (scenario: string) => {
    let revenue = 0
    let cost = 0
    let entryRevenue = 0
    for (const day of EVENT_DAYS) {
      const r = calcDayRevenue(day.key, scenario)
      revenue += r.revenue
      cost += r.cost
      entryRevenue += r.entryRevenue
    }
    return { revenue, cost, margin: revenue - cost, entryRevenue, total: revenue + entryRevenue }
  }

  // Group products by category
  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    icon: CAT_ICONS[cat] || '📦',
    items: products.filter(p => p.category === cat),
  })).filter(g => g.items.length > 0)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Laden...</div></div>

  const currentDay = EVENT_DAYS.find(d => d.key === selectedDay)!
  const currentScenario = SCENARIOS.find(s => s.key === selectedScenario)!

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 -mx-4 -mt-16 lg:-mt-6 px-4 pt-16 lg:pt-6 pb-4 mb-6 rounded-b-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
            <h1 className="text-2xl font-bold text-white">Prognose</h1>
          </div>
          <button onClick={saveAll} disabled={!hasChanges || saving}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}>
            {saving ? 'Speichern...' : hasChanges ? 'Speichern' : 'Gespeichert'}
          </button>
        </div>
      </div>

      {/* Scenario overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SCENARIOS.map(sc => {
          const totals = calcScenarioTotal(sc.key)
          return (
            <button key={sc.key} onClick={() => setSelectedScenario(sc.key)}
              className={`bg-white rounded-lg shadow border-2 p-4 text-left transition-all ${
                selectedScenario === sc.key ? sc.borderColor + ' shadow-lg' : 'border-gray-200'
              }`}>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${sc.textColor}`}>{sc.label}</div>
              <div className="text-xl font-bold text-gray-900">{fmtEur(totals.total)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Getränke {fmtEur(totals.revenue)} + Eintritt {fmtEur(totals.entryRevenue)}
              </div>
              <div className="text-xs font-medium text-green-600 mt-0.5">Marge: {fmtEur(totals.margin)}</div>
            </button>
          )
        })}
      </div>

      {/* Day selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {EVENT_DAYS.map(day => {
          const dayTotals = calcDayRevenue(day.key, selectedScenario)
          return (
            <button key={day.key} onClick={() => setSelectedDay(day.key)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                selectedDay === day.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{day.icon}</span>
                <div>
                  <div className="font-semibold text-sm text-gray-900">{day.label}</div>
                  <div className="text-xs text-gray-500">{day.date} · {day.event}</div>
                </div>
              </div>
              <div className="text-sm font-bold text-gray-900 mt-2">{fmtEur(dayTotals.total)}</div>
            </button>
          )
        })}
      </div>

      {/* Entry fee / visitors for current day & scenario */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className={`text-sm font-semibold ${currentScenario.textColor}`}>
            {currentScenario.label} · {currentDay.label} ({currentDay.date})
          </span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Besucher:</label>
            <input type="number" value={getEntry(selectedDay, selectedScenario).visitors || ''}
              onChange={e => setEntry(selectedDay, selectedScenario, 'visitors', +e.target.value || 0)}
              className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Eintritt (EUR):</label>
            <input type="number" step="0.50" value={getEntry(selectedDay, selectedScenario).entryFee || ''}
              onChange={e => setEntry(selectedDay, selectedScenario, 'entryFee', +e.target.value || 0)}
              className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div className="text-sm text-gray-500 ml-auto">
            Eintritts-Einnahmen: <span className="font-bold text-gray-900">{fmtEur(getEntry(selectedDay, selectedScenario).visitors * getEntry(selectedDay, selectedScenario).entryFee)}</span>
          </div>
        </div>
      </div>

      {/* Products table by category */}
      {grouped.map(g => (
        <div key={g.category} className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-3 flex items-center gap-2">
            <span className="text-lg">{g.icon}</span>
            <h3 className="font-semibold text-gray-900">{g.category}</h3>
            <span className="text-xs text-gray-500 ml-auto">{g.items.length} Produkte</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Produkt</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">VK</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Menge</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Umsatz</th>
                  <th className="px-3 py-2 text-right font-medium text-green-600">Marge</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map(p => {
                  const qty = getQuantity(p.id, selectedDay, selectedScenario)
                  const revenue = qty * p.salePrice
                  const margin = qty * (p.salePrice - p.purchasePrice)
                  return (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{p.name} <span className="text-gray-400 text-xs">({p.unit})</span></td>
                      <td className="px-3 py-2 text-right text-gray-600">{fmtEur(p.salePrice)}</td>
                      <td className="px-3 py-2 text-right">
                        <input type="number" min="0" value={qty || ''}
                          onChange={e => setQuantity(p.id, selectedDay, selectedScenario, +e.target.value || 0)}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right" />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">{fmtEur(revenue)}</td>
                      <td className="px-3 py-2 text-right font-medium text-green-600">{fmtEur(margin)}</td>
                    </tr>
                  )
                })}
                {/* Category subtotal */}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-2 text-gray-700" colSpan={2}>Summe {g.category}</td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {g.items.reduce((s, p) => s + getQuantity(p.id, selectedDay, selectedScenario), 0)} Stk.
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {fmtEur(g.items.reduce((s, p) => s + getQuantity(p.id, selectedDay, selectedScenario) * p.salePrice, 0))}
                  </td>
                  <td className="px-3 py-2 text-right text-green-600">
                    {fmtEur(g.items.reduce((s, p) => s + getQuantity(p.id, selectedDay, selectedScenario) * (p.salePrice - p.purchasePrice), 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Day total summary */}
      {(() => {
        const dayTotals = calcDayRevenue(selectedDay, selectedScenario)
        return (
          <div className={`rounded-lg border-2 p-4 ${currentScenario.bg} ${currentScenario.borderColor}`}>
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wider ${currentScenario.textColor}`}>
                  Tagessumme · {currentDay.label} · {currentScenario.label}
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <div><span className="text-gray-600">Getränke:</span> <span className="font-bold">{fmtEur(dayTotals.revenue)}</span></div>
                <div><span className="text-gray-600">Eintritt:</span> <span className="font-bold">{fmtEur(dayTotals.entryRevenue)}</span></div>
                <div><span className="text-gray-600">Marge:</span> <span className="font-bold text-green-600">{fmtEur(dayTotals.margin)}</span></div>
                <div className={`font-bold text-lg ${currentScenario.textColor}`}>{fmtEur(dayTotals.total)}</div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* All-days comparison table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="bg-gray-50 border-b px-4 py-3">
          <h3 className="font-semibold text-gray-900">Gesamtvergleich aller Szenarien</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-2 text-left font-medium text-gray-600">Tag</th>
                {SCENARIOS.map(sc => (
                  <th key={sc.key} className={`px-4 py-2 text-right font-medium ${sc.textColor}`}>{sc.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EVENT_DAYS.map(day => (
                <tr key={day.key} className="border-b">
                  <td className="px-4 py-2">
                    <span className="mr-2">{day.icon}</span>
                    <span className="font-medium text-gray-900">{day.label}</span>
                    <span className="text-gray-500 text-xs ml-1">({day.date})</span>
                  </td>
                  {SCENARIOS.map(sc => {
                    const t = calcDayRevenue(day.key, sc.key)
                    return (
                      <td key={sc.key} className="px-4 py-2 text-right font-medium text-gray-900">{fmtEur(t.total)}</td>
                    )
                  })}
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold border-t-2">
                <td className="px-4 py-3 text-gray-900">Gesamt</td>
                {SCENARIOS.map(sc => {
                  const t = calcScenarioTotal(sc.key)
                  return (
                    <td key={sc.key} className={`px-4 py-3 text-right text-lg ${sc.textColor}`}>{fmtEur(t.total)}</td>
                  )
                })}
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td className="px-4 py-2 text-green-700">Marge</td>
                {SCENARIOS.map(sc => {
                  const t = calcScenarioTotal(sc.key)
                  return (
                    <td key={sc.key} className="px-4 py-2 text-right text-green-600">{fmtEur(t.margin)}</td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
