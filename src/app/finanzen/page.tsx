'use client'

import { useState, useEffect, useCallback } from 'react'

interface CostItem {
  id: string
  name: string
  projected: number
  actual: number | null
  dueDate: string
  costType: string
  status: string
  eventDay: string | null
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
  { value: 'musik', label: 'Musik & Unterhaltung', icon: '🎵' },
  { value: 'infrastruktur', label: 'Infrastruktur & Miete', icon: '⛺' },
  { value: 'personal', label: 'Personal & Service', icon: '👥' },
  { value: 'material', label: 'Material & Ausstattung', icon: '📦' },
  { value: 'werbung', label: 'Werbung & Druck', icon: '📣' },
]

const STATUS_OPTIONS = [
  { value: 'fix', label: 'FIX', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'bezahlt', label: 'BEZAHLT', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'zugesagt', label: 'ZUGESAGT', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'geplant', label: 'GEPLANT', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'geschaetzt', label: 'GESCHÄTZT', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'bestellen', label: 'BESTELLEN', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'anfragen', label: 'ANFRAGEN', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'klaeren', label: 'KLÄREN', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'offen', label: 'OFFEN', color: 'bg-red-50 text-red-700 border-red-200' },
]

const EVENT_DAY_OPTIONS = [
  { value: '', label: 'Allgemein (kein Tag)' },
  { value: 'thursday', label: 'Donnerstag' },
  { value: 'friday', label: 'Freitag' },
  { value: 'saturday', label: 'Samstag' },
  { value: 'sunday', label: 'Sonntag' },
]

const ACCORDION_DAYS = [
  { key: 'friday', label: 'Freitag', date: '10.07.', event: 'Disco-Party mit DJ Josh', icon: '🎶' },
  { key: 'saturday', label: 'Samstag', date: '11.07.', event: 'Drunter & Drüber', icon: '🎉' },
  { key: 'sunday', label: 'Sonntag', date: '12.07.', event: 'Bayrischer Festsonntag', icon: '⛪' },
  { key: null, label: 'Allgemein', date: '', event: 'Tagesunabhängig', icon: '📦' },
]

const SCENARIOS = [
  { key: 'pessimistic', label: 'Pessimistisch', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', headerBg: 'bg-red-600' },
  { key: 'realistic', label: 'Realistisch', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300', headerBg: 'bg-blue-600' },
  { key: 'optimistic', label: 'Optimistisch', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', headerBg: 'bg-green-600' },
]

const EVENT_DAYS = [
  { key: 'thursday', label: 'Do 09.07.', short: 'Do' },
  { key: 'friday', label: 'Fr 10.07.', short: 'Fr' },
  { key: 'saturday', label: 'Sa 11.07.', short: 'Sa' },
  { key: 'sunday', label: 'So 12.07.', short: 'So' },
]

const fmtEur = (v: number) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
const fmtNum = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 0 })

function getStatusBadge(status: string) {
  const opt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[STATUS_OPTIONS.length - 1]
  return opt
}

export default function FinanzenPage() {
  const [tab, setTab] = useState('kosten')
  const [costs, setCosts] = useState<CostItem[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedScenario, setSelectedScenario] = useState('realistic')
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({})

  // Cost form
  const [editCostId, setEditCostId] = useState<string | null>(null)
  const [costForm, setCostForm] = useState({ name: '', projected: 0, actual: null as number | null, dueDate: 'before', costType: 'fix', status: 'offen', eventDay: '' as string, notes: '' })
  const [showForm, setShowForm] = useState(false)

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
    const body = { ...costForm, actual: costForm.actual || null, eventDay: costForm.eventDay || null }
    if (editCostId) {
      await fetch('/api/costs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editCostId, ...body }) })
    } else {
      await fetch('/api/costs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setCostForm({ name: '', projected: 0, actual: null, dueDate: 'before', costType: 'fix', status: 'offen', eventDay: '', notes: '' })
    setEditCostId(null)
    setShowForm(false)
    loadAll()
  }

  const deleteCost = async (id: string) => {
    if (!confirm('Kostenposition wirklich löschen?')) return
    await fetch(`/api/costs?id=${id}`, { method: 'DELETE' })
    loadAll()
  }

  const startEditCost = (c: CostItem) => {
    setEditCostId(c.id)
    setCostForm({ name: c.name, projected: c.projected, actual: c.actual, dueDate: c.dueDate, costType: c.costType, status: c.status, eventDay: c.eventDay || '', notes: c.notes || '' })
    setShowForm(true)
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
  const totalSponsoring = sponsors.reduce((s, sp) => s + sp.amount, 0)
  const totalSponsoringReceived = sponsors.filter(sp => sp.received).reduce((s, sp) => s + sp.amount, 0)

  const costsForDay = (dayKey: string | null) => costs.filter(c => c.eventDay === dayKey)
  const costSumForDay = (dayKey: string | null) => costsForDay(dayKey).reduce((s, c) => s + c.projected, 0)

  // Revenue per scenario per day
  const calcDayRevenue = (dayKey: string, scenario: string) => {
    if (!forecast) return 0
    const entries = forecast.forecasts.filter(f => f.eventDay === dayKey && f.scenario === scenario)
    const drinkRev = entries.reduce((s, e) => s + e.quantity * e.product.salePrice, 0)
    const entryData = forecast.entryForecasts.find(f => f.eventDay === dayKey && f.scenario === scenario)
    const entryRev = entryData ? entryData.visitors * entryData.entryFee : 0
    return drinkRev + entryRev
  }

  const calcScenarioRevenue = (scenario: string) => {
    if (!forecast) return { drinkRevenue: 0, drinkCost: 0, entryRevenue: 0 }
    const entries = forecast.forecasts.filter(f => f.scenario === scenario)
    let drinkRevenue = 0, drinkCost = 0
    for (const e of entries) {
      drinkRevenue += e.quantity * e.product.salePrice
      drinkCost += e.quantity * e.product.purchasePrice
    }
    const entryEntries = forecast.entryForecasts.filter(f => f.scenario === scenario)
    const entryRevenue = entryEntries.reduce((s, e) => s + e.visitors * e.entryFee, 0)
    return { drinkRevenue, drinkCost, entryRevenue }
  }

  const totalRevenueForScenario = (scenario: string) => {
    return EVENT_DAYS.reduce((s, d) => s + calcDayRevenue(d.key, scenario), 0)
  }

  // Status breakdown
  const statusGroups = {
    confirmed: costs.filter(c => ['fix', 'bezahlt', 'zugesagt'].includes(c.status)).reduce((s, c) => s + c.projected, 0),
    planned: costs.filter(c => ['geplant', 'geschaetzt'].includes(c.status)).reduce((s, c) => s + c.projected, 0),
    pending: costs.filter(c => ['bestellen', 'anfragen', 'klaeren'].includes(c.status)).reduce((s, c) => s + c.projected, 0),
    open: costs.filter(c => c.status === 'offen').reduce((s, c) => s + c.projected, 0),
  }

  const toggleDay = (key: string) => setOpenDays(prev => ({ ...prev, [key]: !prev[key] }))

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Laden...</div></div>

  const currentScenario = SCENARIOS.find(s => s.key === selectedScenario)!

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 -mx-4 -mt-16 lg:-mt-6 px-4 pt-16 lg:pt-6 pb-4 mb-6 rounded-b-lg">
        <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-bold text-white">Finanzen</h1>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{fmtEur(totalCosts)}</div>
            <div className="text-xs text-gray-400">{costs.length} Positionen</div>
          </div>
        </div>
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
          {/* Szenario-Auswahl */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Szenario:</span>
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

          {/* Matrix-Übersicht: Einnahmen vs Kosten */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Kosten vs. Einnahmen</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${currentScenario.bg} ${currentScenario.color} font-bold`}>{currentScenario.label}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500">
                    <th className="text-left font-medium pb-2"></th>
                    <th className="text-center font-medium pb-2 px-2">🃏 Do</th>
                    <th className="text-center font-medium pb-2 px-2">🎶 Fr</th>
                    <th className="text-center font-medium pb-2 px-2 bg-blue-50 rounded-t-lg">🎉 Sa</th>
                    <th className="text-center font-medium pb-2 px-2">⛪ So</th>
                    <th className="text-center font-medium pb-2 px-2">📦 Allg.</th>
                    <th className="text-center font-bold pb-2 px-2 text-gray-700">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-xs font-medium text-emerald-600 py-1.5">Einnahmen</td>
                    {EVENT_DAYS.map(d => (
                      <td key={d.key} className={`text-center text-emerald-600 font-medium py-1.5 px-2 ${d.key === 'saturday' ? 'bg-blue-50' : ''}`}>
                        {fmtNum(calcDayRevenue(d.key, selectedScenario))}
                      </td>
                    ))}
                    <td className="text-center text-gray-300 py-1.5 px-2">—</td>
                    <td className="text-center text-emerald-700 font-bold py-1.5 px-2">{fmtNum(totalRevenueForScenario(selectedScenario))}</td>
                  </tr>
                  <tr>
                    <td className="text-xs font-medium text-red-500 py-1.5">Kosten</td>
                    {EVENT_DAYS.map(d => {
                      const dayC = costSumForDay(d.key)
                      return (
                        <td key={d.key} className={`text-center py-1.5 px-2 ${d.key === 'saturday' ? 'bg-blue-50' : ''} ${dayC > 0 ? 'text-red-500 font-medium' : 'text-gray-300'}`}>
                          {dayC > 0 ? fmtNum(dayC) : '—'}
                        </td>
                      )
                    })}
                    <td className="text-center text-red-500 font-medium py-1.5 px-2">{fmtNum(costSumForDay(null))}</td>
                    <td className="text-center text-red-600 font-bold py-1.5 px-2">{fmtNum(totalCosts)}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="text-xs font-bold text-gray-700 py-1.5">Saldo</td>
                    {EVENT_DAYS.map(d => {
                      const saldo = calcDayRevenue(d.key, selectedScenario) - costSumForDay(d.key)
                      return (
                        <td key={d.key} className={`text-center font-bold py-1.5 px-2 ${d.key === 'saturday' ? 'bg-blue-50 rounded-b-lg' : ''} ${saldo >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                          {saldo >= 0 ? '+' : ''}{fmtNum(saldo)}
                        </td>
                      )
                    })}
                    <td className="text-center text-red-500 font-bold py-1.5 px-2">-{fmtNum(costSumForDay(null))}</td>
                    <td className="text-center font-bold py-1.5 px-2">
                      <span className="text-lg text-blue-700">+{fmtNum(totalRevenueForScenario(selectedScenario) - totalCosts)}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Fortschrittsbalken */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>Budget-Status: {totalCosts > 0 ? Math.round((statusGroups.confirmed / totalCosts) * 100) : 0}% bestätigt</span>
                <span>{fmtEur(statusGroups.confirmed)} von {fmtEur(totalCosts)} fix</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                {totalCosts > 0 && <>
                  <div className="h-full bg-emerald-500" style={{ width: `${(statusGroups.confirmed / totalCosts) * 100}%` }} title="Bezahlt/Zugesagt" />
                  <div className="h-full bg-blue-400" style={{ width: `${(statusGroups.planned / totalCosts) * 100}%` }} title="Geplant" />
                  <div className="h-full bg-amber-400" style={{ width: `${(statusGroups.pending / totalCosts) * 100}%` }} title="Klären" />
                  <div className="h-full bg-red-400" style={{ width: `${(statusGroups.open / totalCosts) * 100}%` }} title="Offen" />
                </>}
              </div>
              <div className="flex gap-3 mt-1.5 text-[10px] text-gray-400 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Fix/Zugesagt</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Geplant</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Klären</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />Offen</span>
              </div>
            </div>
          </div>

          {/* Neue Position Button */}
          <button onClick={() => { setShowForm(!showForm); setEditCostId(null); setCostForm({ name: '', projected: 0, actual: null, dueDate: 'before', costType: 'fix', status: 'offen', eventDay: '', notes: '' }) }}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 text-sm font-medium transition-colors">
            + Neue Kostenposition
          </button>

          {/* Add/Edit form */}
          {showForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">{editCostId ? 'Position bearbeiten' : 'Neue Position'}</h3>
              <div className="space-y-3">
                <input value={costForm.name} onChange={e => setCostForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Position (z.B. Zeltmiete)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Betrag (€)</label>
                    <input type="number" step="0.01" value={costForm.projected || ''} onChange={e => setCostForm(f => ({ ...f, projected: +e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Status</label>
                    <select value={costForm.status} onChange={e => setCostForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mt-1">
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Tag</label>
                    <select value={costForm.eventDay} onChange={e => setCostForm(f => ({ ...f, eventDay: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mt-1">
                      {EVENT_DAY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Typ</label>
                    <select value={costForm.costType} onChange={e => setCostForm(f => ({ ...f, costType: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mt-1">
                      {COST_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.icon} {ct.label}</option>)}
                    </select>
                  </div>
                </div>
                <input value={costForm.notes} onChange={e => setCostForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Notizen (optional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
                <div className="flex gap-2">
                  <button onClick={saveCost} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">
                    {editCostId ? 'Speichern' : '+ Hinzufügen'}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditCostId(null) }}
                    className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2">Abbrechen</button>
                </div>
              </div>
            </div>
          )}

          {/* Akkordeons pro Tag */}
          {ACCORDION_DAYS.map(day => {
            const dayKey = day.key === null ? 'allgemein' : day.key
            const dayCosts = costsForDay(day.key)
            const daySum = dayCosts.reduce((s, c) => s + c.projected, 0)
            if (dayCosts.length === 0) return null
            const isOpen = openDays[dayKey] || false
            const dayRevenue = day.key ? calcDayRevenue(day.key, selectedScenario) : 0
            const saldo = dayRevenue - daySum

            return (
              <div key={dayKey} className="mb-2">
                <button onClick={() => toggleDay(dayKey)}
                  className={`w-full bg-white ${isOpen ? 'rounded-t-xl' : 'rounded-xl'} border border-gray-200 px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{day.icon}</span>
                    <span className="font-bold text-sm text-gray-900">{day.label}</span>
                    <span className="text-xs text-gray-400">{dayCosts.length} {dayCosts.length === 1 ? 'Position' : 'Positionen'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {day.key && saldo !== 0 && (
                      <span className={`text-xs font-medium hidden sm:inline ${saldo >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {saldo >= 0 ? '+' : ''}{fmtNum(saldo)} € Saldo
                      </span>
                    )}
                    {!day.key && <span className="text-xs text-red-500 font-medium hidden sm:inline">Nur Kosten</span>}
                    <span className="text-sm font-bold text-gray-900">{fmtEur(daySum)}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {isOpen && (
                  <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl px-1 pb-1">
                    <table className="w-full text-sm">
                      <tbody>
                        {dayCosts.map(c => {
                          const badge = getStatusBadge(c.status)
                          return (
                            <tr key={c.id} className="border-b border-gray-100 group">
                              <td className="px-4 py-2.5">
                                <div className="font-medium text-gray-900">{c.name}</div>
                                {c.notes && <div className="text-xs text-gray-400">{c.notes}</div>}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-gray-900">{fmtEur(c.projected)}</td>
                              <td className="px-2 py-2.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEditCost(c)} className="text-blue-500 hover:text-blue-700 text-xs mr-1">Bearbeiten</button>
                                <button onClick={() => deleteCost(c.id)} className="text-red-400 hover:text-red-600 text-xs">Löschen</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td className="px-4 py-2 font-bold text-gray-700 text-xs" colSpan={2}>SUMME</td>
                          <td className="px-3 py-2 text-right font-bold text-gray-900">{fmtEur(daySum)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── SPONSORING TAB ── */}
      {tab === 'sponsoring' && (
        <div className="space-y-6">
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

          <div className="bg-white rounded-lg shadow border p-5">
            <h3 className="font-semibold text-gray-900 mb-3">{editSponsorId ? 'Sponsor bearbeiten' : 'Neuer Sponsor'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input value={sponsorForm.name} onChange={e => setSponsorForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Sponsor-Name" className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 lg:col-span-2" />
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
              placeholder="Notizen (optional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mt-3" />
            {editSponsorId && (
              <button onClick={() => { setEditSponsorId(null); setSponsorForm({ name: '', amount: 0, received: false, notes: '' }) }}
                className="text-sm text-gray-500 mt-2 hover:text-gray-700">Abbrechen</button>
            )}
          </div>

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
                        {SCENARIOS.map(sc => (
                          <td key={sc.key} className="px-4 py-2 text-right font-medium text-gray-900">
                            {fmtEur(calcDayRevenue(day.key, sc.key))}
                          </td>
                        ))}
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
