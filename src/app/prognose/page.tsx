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
  { key: 'pessimistic', label: 'Pessimistisch', color: '#DC2626', bg: 'bg-red-50', textColor: 'text-red-600', borderColor: 'border-red-200', headerBg: 'bg-red-600' },
  { key: 'realistic', label: 'Realistisch', color: '#2563EB', bg: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-300', headerBg: 'bg-blue-600' },
  { key: 'optimistic', label: 'Optimistisch', color: '#16A34A', bg: 'bg-green-50', textColor: 'text-green-600', borderColor: 'border-green-200', headerBg: 'bg-green-600' },
]

const CATEGORIES = ['Bier & Radler', 'Softdrinks', 'Schnaps & Shots', 'Longdrinks', 'Wein & Sekt', 'Warme Speisen', 'Snacks']
const CAT_ICONS: Record<string, string> = {
  'Bier & Radler': '🍺', 'Softdrinks': '🥤', 'Schnaps & Shots': '🥃',
  'Longdrinks': '🍹', 'Wein & Sekt': '🍷', 'Warme Speisen': '🍖', 'Snacks': '🥨',
}

const fmtEur = (v: number) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
const fmtNum = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 1 })

export default function PrognosePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [forecasts, setForecasts] = useState<ForecastEntry[]>([])
  const [entryForecasts, setEntryForecasts] = useState<EntryForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDay, setSelectedDay] = useState('thursday')
  const [selectedScenario, setSelectedScenario] = useState('realistic')

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
      const entries = Object.entries(localEdits).map(([key, quantity]) => {
        const [productId, eventDay, scenario] = key.split('-')
        return { productId, eventDay, scenario, quantity }
      })
      if (entries.length > 0) {
        await fetch('/api/forecast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries }) })
      }
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

  // --- Berechnungen ---

  const calcDayRevenue = (day: string, scenario: string) => {
    let revenue = 0
    let cost = 0
    let totalDrinks = 0
    for (const p of products) {
      const qty = getQuantity(p.id, day, scenario)
      revenue += qty * p.salePrice
      cost += qty * p.purchasePrice
      totalDrinks += qty
    }
    const entry = getEntry(day, scenario)
    const entryRevenue = entry.visitors * entry.entryFee
    return {
      revenue, cost, margin: revenue - cost, entryRevenue,
      total: revenue + entryRevenue - cost,
      totalBrutto: revenue + entryRevenue,
      totalDrinks,
      visitors: entry.visitors,
      entryFee: entry.entryFee,
      drinksPerPerson: entry.visitors > 0 ? totalDrinks / entry.visitors : 0,
      spendPerPerson: entry.visitors > 0 ? (revenue + entryRevenue) / entry.visitors : 0,
    }
  }

  const calcScenarioTotal = (scenario: string) => {
    let revenue = 0
    let cost = 0
    let entryRevenue = 0
    let totalDrinks = 0
    let totalVisitors = 0
    for (const day of EVENT_DAYS) {
      const r = calcDayRevenue(day.key, scenario)
      revenue += r.revenue
      cost += r.cost
      entryRevenue += r.entryRevenue
      totalDrinks += r.totalDrinks
      totalVisitors += r.visitors
    }
    return {
      revenue, cost, margin: revenue - cost, entryRevenue,
      total: revenue + entryRevenue - cost,
      totalBrutto: revenue + entryRevenue,
      totalDrinks, totalVisitors,
      drinksPerPerson: totalVisitors > 0 ? totalDrinks / totalVisitors : 0,
      spendPerPerson: totalVisitors > 0 ? (revenue + entryRevenue) / totalVisitors : 0,
    }
  }

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
      {/* Header */}
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ERGEBNISSE — Szenario-Vergleich                        */}
      {/* ═══════════════════════════════════════════════════════ */}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Ergebnisse — Szenario-Vergleich</h2>
        </div>

        {/* Drei Szenario-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCENARIOS.map(sc => {
            const t = calcScenarioTotal(sc.key)
            return (
              <div key={sc.key} className={`bg-white rounded-xl border-2 overflow-hidden ${
                selectedScenario === sc.key ? sc.borderColor + ' shadow-lg' : 'border-gray-200'
              }`}>
                {/* Szenario-Header */}
                <div className={`${sc.headerBg} px-5 py-3`}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/80">{sc.label}</div>
                  <div className="text-2xl font-bold text-white mt-0.5">{fmtEur(t.total)}</div>
                  <div className="text-xs text-white/70">Gewinn (Umsatz − Wareneinsatz)</div>
                </div>

                {/* Kennzahlen */}
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Gäste gesamt</div>
                      <div className="text-lg font-bold text-gray-900">{fmtNum(t.totalVisitors)}</div>
                      <div className="text-[10px] text-gray-400">alle 4 Tage</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Getränke/Person</div>
                      <div className="text-lg font-bold text-gray-900">{fmtNum(t.drinksPerPerson)}</div>
                      <div className="text-[10px] text-gray-400">Durchschnitt</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Umsatz/Person</div>
                      <div className="text-lg font-bold text-gray-900">{fmtEur(t.spendPerPerson)}</div>
                      <div className="text-[10px] text-gray-400">inkl. Eintritt</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Getränke total</div>
                      <div className="text-lg font-bold text-gray-900">{fmtNum(t.totalDrinks)}</div>
                      <div className="text-[10px] text-gray-400">Stück</div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Getränke-Umsatz</span>
                      <span className="font-medium text-gray-900">{fmtEur(t.revenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Eintritts-Einnahmen</span>
                      <span className="font-medium text-gray-900">{fmtEur(t.entryRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Wareneinsatz</span>
                      <span className="font-medium text-red-600">−{fmtEur(t.cost)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-100 pt-1.5">
                      <span className="text-gray-500">Brutto-Umsatz</span>
                      <span className="font-bold text-gray-900">{fmtEur(t.totalBrutto)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={`font-semibold ${sc.textColor}`}>Gewinn</span>
                      <span className={`font-bold ${sc.textColor}`}>{fmtEur(t.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Auswahl-Button */}
                <div className="px-5 pb-4">
                  <button
                    onClick={() => setSelectedScenario(sc.key)}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedScenario === sc.key
                        ? sc.headerBg + ' text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {selectedScenario === sc.key ? '✓ Ausgewählt' : 'Auswählen'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tagesvergleich-Tabelle */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="bg-gray-50 border-b px-5 py-3">
          <h3 className="font-semibold text-gray-900">Tagesvergleich aller Szenarien</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Tag</th>
                {SCENARIOS.map(sc => (
                  <th key={sc.key} className="px-3 py-2.5 text-right" colSpan={1}>
                    <span className={`text-xs font-semibold uppercase ${sc.textColor}`}>{sc.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EVENT_DAYS.map(day => (
                <tr key={day.key} className="border-b">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span>{day.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{day.label}</div>
                        <div className="text-xs text-gray-400">{day.date} {day.event}</div>
                      </div>
                    </div>
                  </td>
                  {SCENARIOS.map(sc => {
                    const r = calcDayRevenue(day.key, sc.key)
                    return (
                      <td key={sc.key} className="px-3 py-2.5 text-right">
                        <div className="font-bold text-gray-900">{fmtEur(r.total)}</div>
                        <div className="text-[10px] text-gray-400">{fmtNum(r.visitors)} Gäste · {fmtNum(r.drinksPerPerson)} Getr./P.</div>
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <td className="px-4 py-3 text-gray-900">Gesamt</td>
                {SCENARIOS.map(sc => {
                  const t = calcScenarioTotal(sc.key)
                  return (
                    <td key={sc.key} className={`px-3 py-3 text-right text-lg ${sc.textColor}`}>{fmtEur(t.total)}</td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* EINGABE — Daten pro Tag & Szenario                     */}
      {/* ═══════════════════════════════════════════════════════ */}

      <div className="relative">
        {/* Trennlinie */}
        <div className="border-t-2 border-dashed border-gray-300 my-2" />
        <div className="flex items-center gap-2 mt-4 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Eingabe — Mengen & Besucher</h2>
            <p className="text-xs text-gray-500">Werte pro Tag und Szenario eingeben. Die Ergebnisse oben aktualisieren sich automatisch.</p>
          </div>
        </div>

        {/* Szenario-Auswahl Pillen */}
        <div className="flex gap-2 mb-4">
          {SCENARIOS.map(sc => (
            <button key={sc.key} onClick={() => setSelectedScenario(sc.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedScenario === sc.key
                  ? sc.headerBg + ' text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {sc.label}
            </button>
          ))}
        </div>

        {/* Tag-Auswahl */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {EVENT_DAYS.map(day => {
            const dayTotals = calcDayRevenue(day.key, selectedScenario)
            return (
              <button key={day.key} onClick={() => setSelectedDay(day.key)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedDay === day.key ? currentScenario.borderColor + ' ' + currentScenario.bg : 'border-gray-200 hover:bg-gray-50'
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

        {/* Besucher & Eintritt */}
        <div className={`rounded-xl border-2 p-5 mb-4 ${currentScenario.bg} ${currentScenario.borderColor}`}>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className={`text-sm font-bold ${currentScenario.textColor} uppercase tracking-wide`}>
              {currentScenario.label} · {currentDay.label}
            </span>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">Besucher:</label>
              <input type="number" value={getEntry(selectedDay, selectedScenario).visitors || ''}
                onChange={e => setEntry(selectedDay, selectedScenario, 'visitors', +e.target.value || 0)}
                className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">Eintritt (EUR):</label>
              <input type="number" step="0.50" value={getEntry(selectedDay, selectedScenario).entryFee || ''}
                onChange={e => setEntry(selectedDay, selectedScenario, 'entryFee', +e.target.value || 0)}
                className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white" />
            </div>
            <div className="text-sm text-gray-600 ml-auto">
              = <span className="font-bold text-gray-900">{fmtEur(getEntry(selectedDay, selectedScenario).visitors * getEntry(selectedDay, selectedScenario).entryFee)}</span> Einnahmen
            </div>
          </div>
        </div>

        {/* Produkt-Tabellen nach Kategorie */}
        {grouped.map(g => (
          <div key={g.category} className="bg-white rounded-xl shadow border overflow-hidden mb-4">
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
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 text-right" />
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">{fmtEur(revenue)}</td>
                        <td className="px-3 py-2 text-right font-medium text-green-600">{fmtEur(margin)}</td>
                      </tr>
                    )
                  })}
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

        {/* Tagessumme */}
        {(() => {
          const dayTotals = calcDayRevenue(selectedDay, selectedScenario)
          return (
            <div className={`rounded-xl border-2 p-5 ${currentScenario.bg} ${currentScenario.borderColor}`}>
              <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${currentScenario.textColor}`}>
                Tagessumme · {currentDay.label} · {currentScenario.label}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Getränke-Umsatz</div>
                  <div className="text-lg font-bold text-gray-900">{fmtEur(dayTotals.revenue)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Eintritt</div>
                  <div className="text-lg font-bold text-gray-900">{fmtEur(dayTotals.entryRevenue)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Wareneinsatz</div>
                  <div className="text-lg font-bold text-red-600">−{fmtEur(dayTotals.cost)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Getränke/Person</div>
                  <div className="text-lg font-bold text-gray-900">{fmtNum(dayTotals.drinksPerPerson)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Gewinn</div>
                  <div className={`text-xl font-bold ${currentScenario.textColor}`}>{fmtEur(dayTotals.total)}</div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
