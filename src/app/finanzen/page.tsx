'use client'

import { useState, useEffect, useCallback } from 'react'

interface CostItem {
  id: string
  name: string
  projected: number
  actual: number | null
  dueDate: string
  costType: string
  notes: string | null
}

interface Sponsor {
  id: string
  name: string
  amount: number
  received: boolean
  notes: string | null
}

interface ForecastData {
  forecasts: { productId: string; eventDay: string; scenario: string; quantity: number; product: { name: string; salePrice: number; purchasePrice: number; category: string } }[]
  entryForecasts: { eventDay: string; scenario: string; visitors: number; entryFee: number }[]
}

const TABS = [
  { id: 'kosten', label: 'Kosten', icon: '📋' },
  { id: 'sponsoring', label: 'Sponsoring', icon: '🤝' },
  { id: 'ergebnis', label: 'Ergebnis', icon: '📊' },
]

const COST_TYPES = [
  { value: 'fix', label: 'Fixkosten', icon: '📌', color: 'text-red-600', bg: 'bg-red-50' },
  { value: 'variabel_getraenke', label: 'Variabel (Getränke)', icon: '🍺', color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'variabel_sonstig', label: 'Variabel (Sonstiges)', icon: '📦', color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'unklar', label: 'Unklar / Geschätzt', icon: '❓', color: 'text-purple-600', bg: 'bg-purple-50' },
]

const DUE_OPTIONS = [
  { value: 'before', label: 'Vor dem Fest', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { value: 'during', label: 'Während', color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'after', label: 'Danach', color: 'text-gray-600', bg: 'bg-gray-100' },
  { value: 'paid', label: 'Bezahlt', color: 'text-green-600', bg: 'bg-green-50' },
]

const SCENARIOS = [
  { key: 'pessimistic', label: 'Pessimistisch', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  { key: 'realistic', label: 'Realistisch', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' },
  { key: 'optimistic', label: 'Optimistisch', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
]

const EVENT_DAYS = [
  { key: 'thursday', label: 'Do 09.07.' },
  { key: 'friday', label: 'Fr 10.07.' },
  { key: 'saturday', label: 'Sa 11.07.' },
  { key: 'sunday', label: 'So 12.07.' },
]

const fmtEur = (v: number) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

export default function FinanzenPage() {
  const [tab, setTab] = useState('kosten')
  const [costs, setCosts] = useState<CostItem[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)

  // Cost form
  const [editCostId, setEditCostId] = useState<string | null>(null)
  const [costForm, setCostForm] = useState({ name: '', projected: 0, actual: null as number | null, dueDate: 'before', costType: 'fix', notes: '' })

  // Sponsor form
  const [editSponsorId, setEditSponsorId] = useState<string | null>(null)
  const [sponsorForm, setSponsorForm] = useState({ name: '', amount: 0, received: false, notes: '' })

  const loadAll = useCallback(async () => {
    const [costsRes, sponsorsRes, forecastRes] = await Promise.all([
      fetch('/api/costs'),
      fetch('/api/sponsors'),
      fetch('/api/forecast'),
    ])
    const [costsData, sponsorsData, forecastData] = await Promise.all([
      costsRes.json(),
      sponsorsRes.json(),
      forecastRes.json(),
    ])
    setCosts(costsData)
    setSponsors(sponsorsData)
    setForecast(forecastData)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Cost CRUD
  const saveCost = async () => {
    if (!costForm.name.trim()) return
    const body = { ...costForm, actual: costForm.actual || null }
    if (editCostId) {
      await fetch('/api/costs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editCostId, ...body }) })
    } else {
      await fetch('/api/costs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setCostForm({ name: '', projected: 0, actual: null, dueDate: 'before', costType: 'fix', notes: '' })
    setEditCostId(null)
    loadAll()
  }

  const deleteCost = async (id: string) => {
    if (!confirm('Kostenposition wirklich löschen?')) return
    await fetch(`/api/costs?id=${id}`, { method: 'DELETE' })
    loadAll()
  }

  const startEditCost = (c: CostItem) => {
    setEditCostId(c.id)
    setCostForm({ name: c.name, projected: c.projected, actual: c.actual, dueDate: c.dueDate, costType: c.costType, notes: c.notes || '' })
  }

  // Sponsor CRUD
  const saveSponsor = async () => {
    if (!sponsorForm.name.trim()) return
    if (editSponsorId) {
      await fetch('/api/sponsors', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editSponsorId, ...sponsorForm }) })
    } else {
      await fetch('/api/sponsors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sponsorForm) })
    }
    setSponsorForm({ name: '', amount: 0, received: false, notes: '' })
    setEditSponsorId(null)
    loadAll()
  }

  const deleteSponsor = async (id: string) => {
    if (!confirm('Sponsor wirklich löschen?')) return
    await fetch(`/api/sponsors?id=${id}`, { method: 'DELETE' })
    loadAll()
  }

  const startEditSponsor = (s: Sponsor) => {
    setEditSponsorId(s.id)
    setSponsorForm({ name: s.name, amount: s.amount, received: s.received, notes: s.notes || '' })
  }

  // Calculations
  const totalCosts = costs.reduce((s, c) => s + c.projected, 0)
  const totalCostsPaid = costs.filter(c => c.dueDate === 'paid').reduce((s, c) => s + c.projected, 0)
  const totalActual = costs.reduce((s, c) => s + (c.actual || 0), 0)
  const totalSponsoring = sponsors.reduce((s, sp) => s + sp.amount, 0)
  const totalSponsoringReceived = sponsors.filter(sp => sp.received).reduce((s, sp) => s + sp.amount, 0)

  // Revenue per scenario from forecast data
  const calcScenarioRevenue = (scenario: string) => {
    if (!forecast) return { drinkRevenue: 0, drinkCost: 0, entryRevenue: 0 }
    const entries = forecast.forecasts.filter(f => f.scenario === scenario)
    let drinkRevenue = 0
    let drinkCost = 0
    for (const e of entries) {
      drinkRevenue += e.quantity * e.product.salePrice
      drinkCost += e.quantity * e.product.purchasePrice
    }
    const entryEntries = forecast.entryForecasts.filter(f => f.scenario === scenario)
    const entryRevenue = entryEntries.reduce((s, e) => s + e.visitors * e.entryFee, 0)
    return { drinkRevenue, drinkCost, entryRevenue }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Laden...</div></div>

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 -mx-4 -mt-16 lg:-mt-6 px-4 pt-16 lg:pt-6 pb-4 mb-6 rounded-b-lg">
        <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
        <h1 className="text-2xl font-bold text-white">Finanzen</h1>
        <div className="flex gap-1 mt-3 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                tab === t.id ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KOSTEN TAB ── */}
      {tab === 'kosten' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg shadow border p-4 text-center">
              <div className="text-xs text-gray-500 font-medium">Geplant gesamt</div>
              <div className="text-xl font-bold text-gray-900">{fmtEur(totalCosts)}</div>
            </div>
            <div className="bg-white rounded-lg shadow border p-4 text-center">
              <div className="text-xs text-gray-500 font-medium">Bereits bezahlt</div>
              <div className="text-xl font-bold text-green-600">{fmtEur(totalCostsPaid)}</div>
            </div>
            <div className="bg-white rounded-lg shadow border p-4 text-center">
              <div className="text-xs text-gray-500 font-medium">Noch offen</div>
              <div className="text-xl font-bold text-red-600">{fmtEur(totalCosts - totalCostsPaid)}</div>
            </div>
            <div className="bg-white rounded-lg shadow border p-4 text-center">
              <div className="text-xs text-gray-500 font-medium">Ist-Kosten</div>
              <div className="text-xl font-bold text-gray-900">{fmtEur(totalActual)}</div>
            </div>
          </div>

          {/* Add/Edit form */}
          <div className="bg-white rounded-lg shadow border p-5">
            <h3 className="font-semibold text-gray-900 mb-3">{editCostId ? 'Kostenposition bearbeiten' : 'Neue Kostenposition'}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={costForm.name} onChange={e => setCostForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Position (z.B. Zeltmiete)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">Geplant</span>
                  <input type="number" step="0.01" value={costForm.projected || ''} onChange={e => setCostForm(f => ({ ...f, projected: +e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg pl-16 pr-3 py-2 text-sm" />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">Ist</span>
                  <input type="number" step="0.01" value={costForm.actual ?? ''} onChange={e => setCostForm(f => ({ ...f, actual: e.target.value === '' ? null : +e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select value={costForm.costType} onChange={e => setCostForm(f => ({ ...f, costType: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {COST_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.icon} {ct.label}</option>)}
                </select>
                <select value={costForm.dueDate} onChange={e => setCostForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {DUE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                <button onClick={saveCost} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">
                  {editCostId ? 'Speichern' : '+ Hinzufügen'}
                </button>
              </div>
              <input value={costForm.notes} onChange={e => setCostForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notizen (optional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            {editCostId && (
              <button onClick={() => { setEditCostId(null); setCostForm({ name: '', projected: 0, actual: null, dueDate: 'before', costType: 'fix', notes: '' }) }}
                className="text-sm text-gray-500 mt-2 hover:text-gray-700">Abbrechen</button>
            )}
          </div>

          {/* Cost list grouped by type */}
          {COST_TYPES.map(ct => {
            const items = costs.filter(c => c.costType === ct.value)
            if (items.length === 0) return null
            const groupTotal = items.reduce((s, c) => s + c.projected, 0)
            return (
              <div key={ct.value} className="bg-white rounded-lg shadow border overflow-hidden">
                <div className={`${ct.bg} border-b px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span>{ct.icon}</span>
                    <h3 className={`font-semibold ${ct.color}`}>{ct.label}</h3>
                    <span className="text-xs text-gray-500">{items.length} Positionen</span>
                  </div>
                  <span className={`font-bold text-sm ${ct.color}`}>{fmtEur(groupTotal)}</span>
                </div>
                <div className="divide-y">
                  {items.map(c => {
                    const due = DUE_OPTIONS.find(d => d.value === c.dueDate)
                    return (
                      <div key={c.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <div className="font-medium text-gray-900 flex-1 min-w-[200px]">
                            {c.name}
                            {c.notes && <span className="block text-xs text-gray-500 mt-0.5">{c.notes}</span>}
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Geplant</span>{' '}
                            <span className="font-medium text-gray-700">{fmtEur(c.projected)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Ist</span>{' '}
                            <span className="font-medium text-gray-700">{c.actual !== null ? fmtEur(c.actual) : '–'}</span>
                          </div>
                          {due && (
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${due.bg} ${due.color}`}>
                              {due.label}
                            </span>
                          )}
                          <div className="flex gap-1">
                            <button onClick={() => startEditCost(c)} className="text-blue-600 hover:text-blue-800 text-sm">Bearbeiten</button>
                            <button onClick={() => deleteCost(c.id)} className="text-red-500 hover:text-red-700 text-sm">Löschen</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── SPONSORING TAB ── */}
      {tab === 'sponsoring' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg shadow border p-4 text-center">
              <div className="text-xs text-gray-500 font-medium">Zugesagt</div>
              <div className="text-xl font-bold text-gray-900">{fmtEur(totalSponsoring)}</div>
            </div>
            <div className="bg-white rounded-lg shadow border p-4 text-center">
              <div className="text-xs text-gray-500 font-medium">Erhalten</div>
              <div className="text-xl font-bold text-green-600">{fmtEur(totalSponsoringReceived)}</div>
            </div>
            <div className="bg-white rounded-lg shadow border p-4 text-center">
              <div className="text-xs text-gray-500 font-medium">Ausstehend</div>
              <div className="text-xl font-bold text-amber-600">{fmtEur(totalSponsoring - totalSponsoringReceived)}</div>
            </div>
          </div>

          {/* Progress bar */}
          {totalSponsoring > 0 && (
            <div className="bg-white rounded-lg shadow border p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Fortschritt</span>
                <span className="font-medium text-gray-900">{Math.round((totalSponsoringReceived / totalSponsoring) * 100)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(totalSponsoringReceived / totalSponsoring) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Add/Edit form */}
          <div className="bg-white rounded-lg shadow border p-5">
            <h3 className="font-semibold text-gray-900 mb-3">{editSponsorId ? 'Sponsor bearbeiten' : 'Neuer Sponsor'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input value={sponsorForm.name} onChange={e => setSponsorForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Sponsor-Name" className="border border-gray-300 rounded-lg px-3 py-2 text-sm lg:col-span-2" />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">EUR</span>
                <input type="number" step="0.01" value={sponsorForm.amount || ''} onChange={e => setSponsorForm(f => ({ ...f, amount: +e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg pl-12 pr-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={sponsorForm.received} onChange={e => setSponsorForm(f => ({ ...f, received: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                Erhalten
              </label>
              <button onClick={saveSponsor} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">
                {editSponsorId ? 'Speichern' : '+ Hinzufügen'}
              </button>
            </div>
            <input value={sponsorForm.notes} onChange={e => setSponsorForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notizen (optional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-3" />
            {editSponsorId && (
              <button onClick={() => { setEditSponsorId(null); setSponsorForm({ name: '', amount: 0, received: false, notes: '' }) }}
                className="text-sm text-gray-500 mt-2 hover:text-gray-700">Abbrechen</button>
            )}
          </div>

          {/* Sponsor list */}
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="bg-gray-50 border-b px-4 py-3">
              <h3 className="font-semibold text-gray-900">Sponsoren ({sponsors.length})</h3>
            </div>
            {sponsors.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">Noch keine Sponsoren eingetragen.</div>
            ) : (
              <div className="divide-y">
                {sponsors.map(s => (
                  <div key={s.id} className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div className="font-medium text-gray-900 flex-1 min-w-[180px]">
                      {s.name}
                      {s.notes && <span className="block text-xs text-gray-500 mt-0.5">{s.notes}</span>}
                    </div>
                    <div className="text-sm font-bold text-gray-900">{fmtEur(s.amount)}</div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.received ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                      {s.received ? 'Erhalten' : 'Ausstehend'}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => startEditSponsor(s)} className="text-blue-600 hover:text-blue-800 text-sm">Bearbeiten</button>
                      <button onClick={() => deleteSponsor(s.id)} className="text-red-500 hover:text-red-700 text-sm">Löschen</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ERGEBNIS TAB ── */}
      {tab === 'ergebnis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SCENARIOS.map(sc => {
              const rev = calcScenarioRevenue(sc.key)
              const totalRevenue = rev.drinkRevenue + rev.entryRevenue + totalSponsoring
              const totalExpenses = totalCosts + rev.drinkCost
              const profit = totalRevenue - totalExpenses
              const isRealistic = sc.key === 'realistic'

              return (
                <div key={sc.key} className={`bg-white rounded-xl border-2 p-5 ${isRealistic ? 'border-blue-300 shadow-lg shadow-blue-100' : sc.border}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-sm font-semibold ${sc.color}`}>{sc.label}</span>
                    {isRealistic && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Empfohlen</span>}
                  </div>

                  <div className={`text-3xl font-bold mb-4 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profit >= 0 ? '+' : ''}{fmtEur(profit)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="font-semibold text-gray-700 text-xs uppercase tracking-wider">Einnahmen</div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Getränke-Umsatz</span>
                      <span className="font-medium text-gray-900">{fmtEur(rev.drinkRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Eintrittsgelder</span>
                      <span className="font-medium text-gray-900">{fmtEur(rev.entryRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sponsoring</span>
                      <span className="font-medium text-gray-900">{fmtEur(totalSponsoring)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
                      <span>Gesamt Einnahmen</span>
                      <span>{fmtEur(totalRevenue)}</span>
                    </div>

                    <div className="font-semibold text-gray-700 text-xs uppercase tracking-wider pt-2">Ausgaben</div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fixkosten & Sonstige</span>
                      <span className="font-medium text-gray-900">{fmtEur(totalCosts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wareneinsatz</span>
                      <span className="font-medium text-gray-900">{fmtEur(rev.drinkCost)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
                      <span>Gesamt Ausgaben</span>
                      <span>{fmtEur(totalExpenses)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Day breakdown per scenario */}
          {forecast && forecast.forecasts.length > 0 && (
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              <div className="bg-gray-50 border-b px-4 py-3">
                <h3 className="font-semibold text-gray-900">Umsatz pro Tag & Szenario</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Tag</th>
                      {SCENARIOS.map(sc => (
                        <th key={sc.key} className={`px-4 py-2 text-right font-medium ${sc.color}`}>{sc.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {EVENT_DAYS.map(day => (
                      <tr key={day.key} className="border-b">
                        <td className="px-4 py-2 font-medium text-gray-900">{day.label}</td>
                        {SCENARIOS.map(sc => {
                          const dayEntries = forecast.forecasts.filter(f => f.eventDay === day.key && f.scenario === sc.key)
                          const dayRevenue = dayEntries.reduce((s, e) => s + e.quantity * e.product.salePrice, 0)
                          const dayEntry = forecast.entryForecasts.find(f => f.eventDay === day.key && f.scenario === sc.key)
                          const entryRev = dayEntry ? dayEntry.visitors * dayEntry.entryFee : 0
                          return (
                            <td key={sc.key} className="px-4 py-2 text-right font-medium text-gray-900">
                              {fmtEur(dayRevenue + entryRev)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-4 py-2 text-gray-900">Gesamt</td>
                      {SCENARIOS.map(sc => {
                        const rev = calcScenarioRevenue(sc.key)
                        return (
                          <td key={sc.key} className={`px-4 py-2 text-right ${sc.color}`}>
                            {fmtEur(rev.drinkRevenue + rev.entryRevenue)}
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
