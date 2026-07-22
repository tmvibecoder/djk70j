'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface CostItem {
  id: string
  name: string
  projected: number   // Brutto-Betrag
  actual: number | null
  vatRate: number     // MwSt-Satz in %: 0, 7 oder 19
  amountEntry: string // "netto" | "brutto" – wie der Betrag zuletzt eingegeben wurde
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

interface SimpleForecast {
  eventDay: string
  scenario: string
  visitors: number
  revenuePerPerson: number
  entryFee: number
  costPercent: number
}

const TABS = [
  { id: 'ergebnis', label: 'Gewinn', icon: '📊', accent: 'emerald' },
  { id: 'prognose', label: 'Rohertrag', icon: '🔮', accent: 'violet' },
  { id: 'kosten', label: 'Kosten', icon: '📋', accent: 'blue' },
  { id: 'sponsoring', label: 'Spenden', icon: '🤝', accent: 'amber' },
]

// Farbige, helle Tab-Optik (statische Klassen, damit Tailwind sie generiert)
const TAB_STYLES: Record<string, { active: string; inactive: string }> = {
  emerald: { active: 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-200', inactive: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50' },
  violet:  { active: 'bg-violet-500 text-white border-violet-500 shadow-violet-200', inactive: 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50' },
  blue:    { active: 'bg-blue-500 text-white border-blue-500 shadow-blue-200', inactive: 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50' },
  amber:   { active: 'bg-amber-500 text-white border-amber-500 shadow-amber-200', inactive: 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50' },
}

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

const DUE_DATE_OPTIONS = [
  { value: 'before', label: 'Vor dem Fest', icon: '📅', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'during', label: 'Während dem Fest', icon: '🎪', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'after', label: 'Nach dem Fest', icon: '📬', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: 'paid', label: 'Bereits bezahlt', icon: '✅', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
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
  { key: 'saturday', label: 'Samstag', date: '11.07.', event: 'Festprogramm + Festzeltparty', icon: '🎉' },
  { key: 'sunday', label: 'Sonntag', date: '12.07.', event: 'Bayrischer Festsonntag', icon: '⛪' },
  { key: null, label: 'Allgemein', date: '', event: 'Tagesunabhängig', icon: '📦' },
]

const SCENARIOS = [
  { key: 'pessimistic', label: 'Pessimistisch', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', headerBg: 'bg-red-600' },
  { key: 'realistic', label: 'Realistisch', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300', headerBg: 'bg-blue-600' },
  { key: 'optimistic', label: 'Optimistisch', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', headerBg: 'bg-green-600' },
]

const EVENT_DAYS = [
  { key: 'thursday', label: 'Do 09.07.', short: 'Do', icon: '🃏' },
  { key: 'friday', label: 'Fr 10.07.', short: 'Fr', icon: '🎶' },
  { key: 'saturday_day', label: 'Sa Tag', short: 'Sa☀️', icon: '⚽' },
  { key: 'saturday_night', label: 'Sa Abend', short: 'Sa🌙', icon: '🎉' },
  { key: 'sunday', label: 'So 12.07.', short: 'So', icon: '⛪' },
]

const fmtEur = (v: number) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
const fmtEur0 = (v: number) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const fmtNum = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 0 })

const VAT_RATES = [
  { value: 0, label: '0 %' },
  { value: 7, label: '7 %' },
  { value: 19, label: '19 %' },
]
const round2 = (v: number) => Math.round(v * 100) / 100
// projected ist immer Brutto; vatRate kann bei Altdaten fehlen → wie 0 % behandeln
const netOf = (c: { projected: number; vatRate?: number }) => c.projected / (1 + (c.vatRate || 0) / 100)
const vatOf = (c: { projected: number; vatRate?: number }) => c.projected - netOf(c)

const EMPTY_COST_FORM = { name: '', amount: 0, vatRate: 0, amountEntry: 'brutto', actual: null as number | null, dueDate: 'before', costType: 'fix', status: 'offen', eventDay: '' as string, notes: '' }

function getStatusBadge(status: string) {
  const opt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[STATUS_OPTIONS.length - 1]
  return opt
}

export default function FinanzenPage() {
  const [tab, setTab] = useState('kosten')
  const [costs, setCosts] = useState<CostItem[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [simpleForecasts, setSimpleForecasts] = useState<SimpleForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedScenario, setSelectedScenario] = useState('realistic')
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({})
  // Ausgeblendete Status (leer = alle sichtbar)
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // Prognose edits
  const [forecastEdits, setForecastEdits] = useState<Record<string, SimpleForecast>>({})
  const [savingForecast, setSavingForecast] = useState(false)

  const FORECAST_DAYS = [
    { key: 'thursday', label: 'Donnerstag', event: 'Watt-Turnier', icon: '🃏' },
    { key: 'friday', label: 'Freitag', event: 'Disco-Party', icon: '🎶' },
    { key: 'saturday_day', label: 'Sa Festprogramm', event: 'Tagsüber', icon: '⚽' },
    { key: 'saturday_night', label: 'Sa Festzeltparty', event: 'Abends', icon: '🎉' },
    { key: 'sunday', label: 'Sonntag', event: 'Festsonntag', icon: '⛪' },
  ]

  const DEFAULTS: Record<string, Record<string, { visitors: number; revenuePerPerson: number; entryFee: number; costPercent: number }>> = {
    thursday:       { pessimistic: { visitors: 100, revenuePerPerson: 10, entryFee: 0, costPercent: 25 }, realistic: { visitors: 150, revenuePerPerson: 15, entryFee: 0, costPercent: 25 }, optimistic: { visitors: 200, revenuePerPerson: 20, entryFee: 0, costPercent: 25 } },
    friday:         { pessimistic: { visitors: 200, revenuePerPerson: 20, entryFee: 5, costPercent: 25 }, realistic: { visitors: 300, revenuePerPerson: 30, entryFee: 5, costPercent: 25 }, optimistic: { visitors: 400, revenuePerPerson: 40, entryFee: 5, costPercent: 25 } },
    saturday_day:   { pessimistic: { visitors: 150, revenuePerPerson: 10, entryFee: 0, costPercent: 25 }, realistic: { visitors: 300, revenuePerPerson: 15, entryFee: 0, costPercent: 25 }, optimistic: { visitors: 400, revenuePerPerson: 20, entryFee: 0, costPercent: 25 } },
    saturday_night: { pessimistic: { visitors: 300, revenuePerPerson: 20, entryFee: 10, costPercent: 25 }, realistic: { visitors: 400, revenuePerPerson: 30, entryFee: 10, costPercent: 25 }, optimistic: { visitors: 500, revenuePerPerson: 40, entryFee: 10, costPercent: 25 } },
    sunday:         { pessimistic: { visitors: 100, revenuePerPerson: 20, entryFee: 0, costPercent: 25 }, realistic: { visitors: 200, revenuePerPerson: 30, entryFee: 0, costPercent: 25 }, optimistic: { visitors: 300, revenuePerPerson: 40, entryFee: 0, costPercent: 25 } },
  }

  const getForecastEntry = (day: string, scenario: string): SimpleForecast => {
    const key = `${day}-${scenario}`
    if (forecastEdits[key]) return forecastEdits[key]
    const saved = simpleForecasts.find(f => f.eventDay === day && f.scenario === scenario)
    if (saved) return saved
    const def = DEFAULTS[day]?.[scenario]
    return { eventDay: day, scenario, visitors: def?.visitors || 0, revenuePerPerson: def?.revenuePerPerson || 0, entryFee: def?.entryFee || 0, costPercent: def?.costPercent || 25 }
  }

  const setForecastField = (day: string, scenario: string, field: keyof SimpleForecast, value: number) => {
    const key = `${day}-${scenario}`
    const current = getForecastEntry(day, scenario)
    setForecastEdits(prev => ({ ...prev, [key]: { ...current, [field]: value } }))
  }

  const hasForecastChanges = Object.keys(forecastEdits).length > 0

  const saveForecast = async () => {
    setSavingForecast(true)
    for (const entry of Object.values(forecastEdits)) {
      await fetch('/api/simple-forecast', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) })
    }
    setForecastEdits({})
    await loadAll()
    setSavingForecast(false)
  }

  // Cost form
  const [editCostId, setEditCostId] = useState<string | null>(null)
  const [costForm, setCostForm] = useState({ ...EMPTY_COST_FORM })
  const [showForm, setShowForm] = useState(false)

  // Sponsor form
  const [editSponsorId, setEditSponsorId] = useState<string | null>(null)
  const [sponsorForm, setSponsorForm] = useState({ name: '', amount: 0, received: false, notes: '' })

  const loadAll = useCallback(async () => {
    const [costsRes, sponsorsRes, forecastRes] = await Promise.all([
      fetch('/api/costs'),
      fetch('/api/sponsors'),
      fetch('/api/simple-forecast'),
    ])
    const [costsData, sponsorsData, forecastData] = await Promise.all([
      costsRes.json(),
      sponsorsRes.json(),
      forecastRes.json(),
    ])
    setCosts(costsData)
    setSponsors(sponsorsData)
    setSimpleForecasts(forecastData)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Cost CRUD
  const saveCost = async () => {
    if (!costForm.name.trim()) return
    const rate = costForm.vatRate || 0
    // Gespeichert wird immer Brutto; bei Netto-Eingabe wird hochgerechnet
    const gross = costForm.amountEntry === 'netto' ? round2(costForm.amount * (1 + rate / 100)) : costForm.amount
    const body = {
      name: costForm.name,
      projected: gross,
      vatRate: rate,
      amountEntry: costForm.amountEntry,
      actual: costForm.actual || null,
      dueDate: costForm.dueDate,
      costType: costForm.costType,
      status: costForm.status,
      eventDay: costForm.eventDay || null,
      notes: costForm.notes,
    }
    if (editCostId) {
      await fetch('/api/costs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editCostId, ...body }) })
    } else {
      await fetch('/api/costs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setCostForm({ ...EMPTY_COST_FORM })
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
    const entry = c.amountEntry === 'netto' ? 'netto' : 'brutto'
    setCostForm({
      name: c.name,
      amount: entry === 'netto' ? round2(netOf(c)) : c.projected,
      vatRate: c.vatRate || 0,
      amountEntry: entry,
      actual: c.actual,
      dueDate: c.dueDate,
      costType: c.costType,
      status: c.status,
      eventDay: c.eventDay || '',
      notes: c.notes || '',
    })
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
    if (!confirm('Spende wirklich löschen?')) return
    await fetch(`/api/sponsors?id=${id}`, { method: 'DELETE' })
    loadAll()
  }

  const startEditSponsor = (s: Sponsor) => {
    setEditSponsorId(s.id)
    setSponsorForm({ name: s.name, amount: s.amount, received: s.received, notes: s.notes || '' })
  }

  // Calculations
  const totalCosts = costs.reduce((s, c) => s + c.projected, 0) // Brutto
  const totalNetCosts = costs.reduce((s, c) => s + netOf(c), 0)
  const totalVatCosts = totalCosts - totalNetCosts
  const totalSponsoring = sponsors.reduce((s, sp) => s + sp.amount, 0)
  const totalSponsoringReceived = sponsors.filter(sp => sp.received).reduce((s, sp) => s + sp.amount, 0)

  const costsForDay = (dayKey: string | null) => costs.filter(c => c.eventDay === dayKey)

  // Revenue from SimpleForecast
  const calcForecastDay = (dayKey: string, scenario: string) => {
    const f = simpleForecasts.find(sf => sf.eventDay === dayKey && sf.scenario === scenario)
    if (!f) return { umsatz: 0, eintritt: 0, wareneinsatz: 0, rohertrag: 0 }
    const umsatz = f.visitors * f.revenuePerPerson
    const eintritt = f.visitors * f.entryFee
    const wareneinsatz = umsatz * (f.costPercent / 100)
    return { umsatz, eintritt, wareneinsatz, rohertrag: umsatz - wareneinsatz + eintritt }
  }

  const calcScenarioRevenue = (scenario: string) => {
    let umsatz = 0, eintritt = 0, wareneinsatz = 0, rohertrag = 0
    for (const day of EVENT_DAYS) {
      const c = calcForecastDay(day.key, scenario)
      umsatz += c.umsatz
      eintritt += c.eintritt
      wareneinsatz += c.wareneinsatz
      rohertrag += c.rohertrag
    }
    return { umsatz, eintritt, wareneinsatz, rohertrag }
  }

  // Status breakdown
  const statusGroups = {
    confirmed: costs.filter(c => ['fix', 'bezahlt', 'zugesagt'].includes(c.status)).reduce((s, c) => s + c.projected, 0),
    planned: costs.filter(c => ['geplant', 'geschaetzt'].includes(c.status)).reduce((s, c) => s + c.projected, 0),
    pending: costs.filter(c => ['bestellen', 'anfragen', 'klaeren'].includes(c.status)).reduce((s, c) => s + c.projected, 0),
    open: costs.filter(c => c.status === 'offen').reduce((s, c) => s + c.projected, 0),
  }

  const toggleDay = (key: string) => setOpenDays(prev => ({ ...prev, [key]: !prev[key] }))

  // Status-Filter (Dropdown mit Checkboxen, oberhalb der Tage)
  // Nur Status anzeigen, die tatsächlich in den Kosten vorkommen
  const usedStatuses = STATUS_OPTIONS.filter(s => costs.some(c => c.status === s.value))
  const filterActive = hiddenStatuses.length > 0
  const matchesFilter = (c: CostItem) => !hiddenStatuses.includes(c.status)
  const filteredCostsForDay = (dayKey: string | null) => costsForDay(dayKey).filter(matchesFilter)
  const toggleStatus = (value: string) =>
    setHiddenStatuses(prev => prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value])
  const allOn = usedStatuses.every(s => !hiddenStatuses.includes(s.value))
  const activeCount = usedStatuses.filter(s => !hiddenStatuses.includes(s.value)).length
  const toggleAll = () => setHiddenStatuses(allOn ? usedStatuses.map(s => s.value) : [])

  // Dropdown bei Klick außerhalb schließen
  useEffect(() => {
    if (!filterOpen) return
    const onClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [filterOpen])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Laden...</div></div>

  const currentScenario = SCENARIOS.find(s => s.key === selectedScenario)!

  return (
    <>
    <div className="space-y-6 print:hidden">
      {/* Header */}
      <div className="bg-white -mx-4 -mt-16 lg:-mt-6 px-4 pt-16 lg:pt-6 pb-4 mb-6 rounded-b-lg border-b border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Finanzplanung</h1>
          <button onClick={() => window.print()} title="Aktuellen Reiter als PDF (DIN A4) exportieren"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 shadow-sm whitespace-nowrap">
            <span>📄</span> PDF exportieren
          </button>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {TABS.map(t => {
            const style = TAB_STYLES[t.accent]
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 min-w-[88px] flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold border whitespace-nowrap transition-all active:scale-[0.98] ${
                  active ? `${style.active} shadow-md` : `${style.inactive} shadow-sm`
                }`}>
                <span className="text-base">{t.icon}</span> {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── KOSTEN TAB ── */}
      {tab === 'kosten' && (
        <div className="space-y-6">

          {/* Gesamtkosten – Headline-KPI ganz oben */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 flex items-center gap-4" style={{ borderTopWidth: 4, borderTopColor: '#4F46E5' }}>
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0" style={{ backgroundColor: '#4F46E51A' }}>💰</div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Gesamtkosten (brutto)</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none mt-1 whitespace-nowrap">{fmtEur0(totalCosts)}</div>
              <div className="text-[11px] text-gray-500 mt-1 whitespace-nowrap">Netto {fmtEur(totalNetCosts)} · MwSt {fmtEur(totalVatCosts)}</div>
            </div>
            <div className="ml-auto text-right shrink-0">
              <div className="text-xs sm:text-sm text-gray-400">{costs.length} {costs.length === 1 ? 'Position' : 'Positionen'}</div>
            </div>
          </div>

          {/* Kosten-Übersicht – die wichtigsten KPIs (Fälligkeit) */}
          {(() => {
            const ACCENTS: Record<string, string> = { before: '#7C3AED', during: '#EA580C', after: '#0891B2' }
            const mainKpis = DUE_DATE_OPTIONS.filter(dd => dd.value !== 'paid')
            const paid = DUE_DATE_OPTIONS.find(dd => dd.value === 'paid')!
            const paidSum = costs.filter(c => c.dueDate === paid.value).reduce((s, c) => s + c.projected, 0)
            const paidCount = costs.filter(c => c.dueDate === paid.value).length
            return (
              <div className="space-y-3">
                {/* Abschnitts-Label */}
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-indigo-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">Fälligkeit</h2>
                  <span className="ml-auto text-[11px] text-gray-400">wichtigste Kennzahlen</span>
                </div>
                {/* KPI-Kacheln – auf Mobil in einer Zeile */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {mainKpis.map(dd => {
                    const sum = costs.filter(c => c.dueDate === dd.value).reduce((s, c) => s + c.projected, 0)
                    const count = costs.filter(c => c.dueDate === dd.value).length
                    const accent = ACCENTS[dd.value]
                    return (
                      <div key={dd.value} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-5" style={{ borderTopWidth: 4, borderTopColor: accent }}>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-xl mb-2" style={{ backgroundColor: `${accent}1A` }}>{dd.icon}</div>
                        <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 leading-tight">{dd.label}</div>
                        <div className="text-base sm:text-3xl font-extrabold mt-1 leading-none whitespace-nowrap" style={{ color: accent }}>{fmtEur0(sum)}</div>
                        <div className="text-[10px] sm:text-xs text-gray-400 mt-1">{count} {count === 1 ? 'Position' : 'Pos.'}</div>
                      </div>
                    )
                  })}
                </div>
                {/* Bereits bezahlt – normale Darstellung */}
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-2.5">
                  <span className="text-sm text-gray-600">{paid.icon} {paid.label}</span>
                  <span className="text-sm text-gray-400">{paidCount} {paidCount === 1 ? 'Position' : 'Positionen'}</span>
                  <span className="text-base font-bold text-emerald-600">{fmtEur(paidSum)}</span>
                </div>
              </div>
            )
          })()}

          {/* Budget-Status */}
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-indigo-600" />
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">Budget-Status</h2>
            <span className="ml-auto text-[11px] text-gray-400">{totalCosts > 0 ? Math.round((statusGroups.confirmed / totalCosts) * 100) : 0}% bestätigt</span>
          </div>
          {/* Fortschrittsbalken */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex justify-end text-[10px] text-gray-500 mb-1">
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

          {/* Neue Position Button */}
          <button onClick={() => { setShowForm(!showForm); setEditCostId(null); setCostForm({ ...EMPTY_COST_FORM }) }}
            className={`group w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all active:scale-[0.99] ${
              showForm
                ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 shadow-gray-200'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200'
            }`}>
            <span className={`flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-base leading-none transition-transform ${showForm ? 'rotate-45' : 'group-hover:rotate-90'}`}>+</span>
            {showForm ? 'Formular schließen' : 'Neue Kostenposition'}
          </button>

          {/* Add/Edit form */}
          {showForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">{editCostId ? 'Position bearbeiten' : 'Neue Position'}</h3>
              <div className="space-y-3">
                <input value={costForm.name} onChange={e => setCostForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Position (z.B. Zeltmiete)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Eingabe als</label>
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden mt-1">
                      {(['netto', 'brutto'] as const).map(m => (
                        <button key={m} type="button" onClick={() => setCostForm(f => ({ ...f, amountEntry: m }))}
                          className={`flex-1 px-2 py-2 text-sm font-medium transition-colors ${costForm.amountEntry === m ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                          {m === 'netto' ? 'Netto' : 'Brutto'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">{costForm.amountEntry === 'netto' ? 'Netto-Betrag (€)' : 'Brutto-Betrag (€)'}</label>
                    <input type="number" step="0.01" value={costForm.amount || ''} onChange={e => setCostForm(f => ({ ...f, amount: +e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">MwSt-Satz</label>
                    <select value={costForm.vatRate} onChange={e => setCostForm(f => ({ ...f, vatRate: +e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mt-1">
                      {VAT_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>
                {costForm.amount > 0 && (() => {
                  const rate = costForm.vatRate || 0
                  const gross = costForm.amountEntry === 'netto' ? round2(costForm.amount * (1 + rate / 100)) : costForm.amount
                  const net = round2(gross / (1 + rate / 100))
                  return (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Netto: <b className="text-gray-900">{fmtEur(net)}</b></span>
                      <span>MwSt ({rate} %): <b className="text-gray-900">{fmtEur(round2(gross - net))}</b></span>
                      <span>Brutto: <b className="text-gray-900">{fmtEur(gross)}</b></span>
                    </div>
                  )
                })()}
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Status</label>
                    <select value={costForm.status} onChange={e => setCostForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mt-1">
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Zahlungszeitpunkt</label>
                    <select value={costForm.dueDate} onChange={e => setCostForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mt-1">
                      {DUE_DATE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.icon} {d.label}</option>)}
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
                    <label className="text-xs text-gray-500 font-medium">Kategorie</label>
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

          {/* Status-Filter oberhalb der Tage (Dropdown mit Checkboxen) */}
          {usedStatuses.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nach Status filtern</h2>
              <div className="relative" ref={filterRef}>
                <button onClick={() => setFilterOpen(o => !o)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border bg-white text-sm font-medium shadow-sm transition-colors ${
                    filterActive ? 'border-blue-300 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  Status
                  <span className={`text-xs font-bold ${filterActive ? 'text-blue-600' : 'text-gray-400'}`}>
                    {filterActive ? `${activeCount}/${usedStatuses.length}` : 'Alle'}
                  </span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${filterOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {filterOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl p-2">
                    <button onClick={toggleAll}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                      {allOn ? 'Alle ausschalten' : 'Alle einschalten'}
                    </button>
                    <div className="my-1.5 border-t border-gray-100" />
                    <div className="max-h-64 overflow-y-auto">
                      {usedStatuses.map(s => {
                        const checked = !hiddenStatuses.includes(s.value)
                        const count = costs.filter(c => c.status === s.value).length
                        return (
                          <label key={s.value} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" checked={checked} onChange={() => toggleStatus(s.value)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.color}`}>{s.label}</span>
                            <span className="ml-auto text-xs text-gray-400">{count}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Akkordeons pro Tag */}
          {filterActive && ACCORDION_DAYS.every(day => filteredCostsForDay(day.key).length === 0) && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
              Keine Kostenpositionen mit dem gewählten Status.
            </div>
          )}
          {ACCORDION_DAYS.map(day => {
            const dayKey = day.key === null ? 'allgemein' : day.key
            const dayCosts = filteredCostsForDay(day.key)
            const daySum = dayCosts.reduce((s, c) => s + c.projected, 0) // Brutto
            const dayNet = dayCosts.reduce((s, c) => s + netOf(c), 0)
            const dayVat = daySum - dayNet
            if (dayCosts.length === 0) return null
            // Bei aktivem Filter automatisch aufklappen, damit Treffer sichtbar sind
            const isOpen = filterActive || openDays[dayKey] || false

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
                    <span className="text-sm font-bold text-gray-900">{fmtEur(daySum)}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {isOpen && (
                  <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl px-1 pb-1">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                          <th className="px-4 py-2 text-left font-semibold">Position</th>
                          <th className="px-2 py-2 text-left font-semibold">Status</th>
                          <th className="px-2 py-2 text-left font-semibold hidden sm:table-cell">Fälligkeit</th>
                          <th className="px-2 py-2 text-right font-semibold hidden sm:table-cell">Netto</th>
                          <th className="px-2 py-2 text-right font-semibold hidden sm:table-cell">MwSt</th>
                          <th className="px-3 py-2 text-right font-semibold">Brutto</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayCosts.map(c => {
                          const badge = getStatusBadge(c.status)
                          const dueBadge = DUE_DATE_OPTIONS.find(d => d.value === c.dueDate)
                          return (
                            <tr key={c.id} className="border-b border-gray-100 group">
                              <td className="px-4 py-2.5">
                                <div className="font-medium text-gray-900">{c.name}</div>
                                {c.notes && <div className="text-xs text-gray-400">{c.notes}</div>}
                              </td>
                              <td className="px-2 py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="px-2 py-2.5 hidden sm:table-cell">
                                {dueBadge && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${dueBadge.color}`}>
                                    {dueBadge.icon} {dueBadge.label}
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-2.5 text-right text-gray-600 hidden sm:table-cell whitespace-nowrap">{fmtEur(netOf(c))}</td>
                              <td className="px-2 py-2.5 text-right text-gray-500 hidden sm:table-cell whitespace-nowrap">
                                {fmtEur(vatOf(c))}<span className="text-[10px] text-gray-400 ml-1">({c.vatRate || 0} %)</span>
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-gray-900 whitespace-nowrap">{fmtEur(c.projected)}</td>
                              <td className="px-2 py-2.5">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button onClick={() => startEditCost(c)} title="Bearbeiten"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span className="hidden sm:inline">Bearbeiten</span>
                                  </button>
                                  <button onClick={() => deleteCost(c.id)} title="Löschen"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span className="hidden sm:inline">Löschen</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td className="px-4 py-2 font-bold text-gray-700 text-xs" colSpan={2}>SUMME</td>
                          <td className="hidden sm:table-cell"></td>
                          <td className="px-2 py-2 text-right font-semibold text-gray-700 hidden sm:table-cell whitespace-nowrap">{fmtEur(dayNet)}</td>
                          <td className="px-2 py-2 text-right font-semibold text-gray-700 hidden sm:table-cell whitespace-nowrap">{fmtEur(dayVat)}</td>
                          <td className="px-3 py-2 text-right font-bold text-gray-900 whitespace-nowrap">{fmtEur(daySum)}</td>
                          <td></td>
                        </tr>
                        <tr className="bg-gray-50 sm:hidden">
                          <td colSpan={4} className="px-4 pb-2 text-right text-[11px] text-gray-500">Netto {fmtEur(dayNet)} · MwSt {fmtEur(dayVat)}</td>
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

      {/* ── ROHERTRAG / PROGNOSE TAB ── */}
      {tab === 'prognose' && (
        <div className="space-y-4">
          {/* Szenario-Auswahl */}
          <div className="flex gap-2">
            {SCENARIOS.map(sc => (
              <button key={sc.key} onClick={() => setSelectedScenario(sc.key)}
                className={`flex-1 py-2 rounded-full text-xs font-medium transition-all ${
                  selectedScenario === sc.key ? sc.headerBg + ' text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                {sc.label}
              </button>
            ))}
          </div>

          {/* Wareneinsatz global */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-700">Wareneinsatz-Anteil</div>
              <div className="text-[10px] text-amber-600">% des Umsatzes als Selbstkosten</div>
            </div>
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="100"
                value={getForecastEntry(FORECAST_DAYS[0].key, selectedScenario).costPercent || ''}
                onChange={e => { const v = +e.target.value || 0; FORECAST_DAYS.forEach(d => setForecastField(d.key, selectedScenario, 'costPercent', v)) }}
                className="w-14 border border-amber-300 rounded-lg px-2 py-1.5 text-sm text-center text-gray-900 font-bold bg-white" />
              <span className="text-sm font-bold text-amber-700">%</span>
            </div>
          </div>

          {/* Tages-Karten (Mobile First) */}
          {FORECAST_DAYS.map(day => {
            const e = getForecastEntry(day.key, selectedScenario)
            const umsatz = e.visitors * e.revenuePerPerson
            const eintritt = e.visitors * e.entryFee
            const wareneinsatz = umsatz * (e.costPercent / 100)
            const rohertrag = umsatz - wareneinsatz + eintritt
            const isSa = day.key.startsWith('saturday')
            return (
              <div key={day.key} className={`rounded-xl border p-3 ${isSa ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-gray-900">{day.icon} {day.label}</span>
                  <span className="text-sm font-bold text-emerald-600">{fmtEur(rohertrag)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 font-medium">Besucher</label>
                    <input type="number" min="0" value={e.visitors || ''}
                      onChange={ev => setForecastField(day.key, selectedScenario, 'visitors', +ev.target.value || 0)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center text-gray-900" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-medium">€/Person</label>
                    <input type="number" min="0" step="1" value={e.revenuePerPerson || ''}
                      onChange={ev => setForecastField(day.key, selectedScenario, 'revenuePerPerson', +ev.target.value || 0)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center text-gray-900" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-medium">Eintritt</label>
                    <input type="number" min="0" step="0.5" value={e.entryFee || ''}
                      onChange={ev => setForecastField(day.key, selectedScenario, 'entryFee', +ev.target.value || 0)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center text-gray-900" />
                  </div>
                </div>
              </div>
            )
          })}

          {/* Gesamt + Speichern */}
          {(() => {
            const t = calcScenarioRevenue(selectedScenario)
            const visitors = FORECAST_DAYS.reduce((s, d) => s + getForecastEntry(d.key, selectedScenario).visitors, 0)
            return (
              <div className={`rounded-xl p-3 flex items-center justify-between ${currentScenario.headerBg}`}>
                <div>
                  <div className="font-bold text-sm text-white">Gesamt Rohertrag</div>
                  <div className="text-[10px] text-white/70">{fmtNum(visitors)} Besucher</div>
                </div>
                <div className="text-xl font-bold text-white">{fmtEur(t.rohertrag)}</div>
              </div>
            )
          })()}

          {hasForecastChanges && (
            <button onClick={saveForecast} disabled={savingForecast}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700">
              {savingForecast ? 'Speichern...' : 'Änderungen speichern'}
            </button>
          )}
        </div>
      )}

      {/* ── SPENDEN TAB ── */}
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
            <h3 className="font-semibold text-gray-900 mb-3">{editSponsorId ? 'Spende bearbeiten' : 'Neue Spende'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input value={sponsorForm.name} onChange={e => setSponsorForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Spender-Name" className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 lg:col-span-2" />
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
              <h3 className="font-semibold text-gray-900">Spenden ({sponsors.length})</h3>
            </div>
            {sponsors.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">Noch keine Spenden eingetragen.</div>
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
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => startEditSponsor(s)} title="Bearbeiten"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="hidden sm:inline">Bearbeiten</span>
                      </button>
                      <button onClick={() => deleteSponsor(s.id)} title="Löschen"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline">Löschen</span>
                      </button>
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
              const totalRevenue = rev.rohertrag + totalSponsoring
              const profit = totalRevenue - totalCosts
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
                      <span className="text-gray-600">Rohertrag (Umsatz − Wareneinsatz)</span>
                      <span className="font-medium text-gray-900">{fmtEur(rev.rohertrag)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">davon Eintritt</span>
                      <span className="font-medium text-gray-500">{fmtEur(rev.eintritt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spenden</span>
                      <span className="font-medium text-gray-900">{fmtEur(totalSponsoring)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
                      <span>Gesamt Einnahmen</span>
                      <span>{fmtEur(totalRevenue)}</span>
                    </div>

                    <div className="font-semibold text-gray-700 text-xs uppercase tracking-wider pt-2">Ausgaben</div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kosten (alle Positionen)</span>
                      <span className="font-medium text-gray-900">{fmtEur(totalCosts)}</span>
                    </div>
                    <div className={`flex justify-between font-bold border-t pt-2 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <span>Ergebnis</span>
                      <span>{profit >= 0 ? '+' : ''}{fmtEur(profit)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {simpleForecasts.length > 0 && (
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              <div className="bg-gray-50 border-b px-4 py-3">
                <h3 className="font-semibold text-gray-900">Rohertrag pro Tag & Szenario</h3>
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
                        <td className="px-4 py-2">
                          <span className="mr-1">{day.icon}</span>
                          <span className="font-medium text-gray-900">{day.label}</span>
                        </td>
                        {SCENARIOS.map(sc => (
                          <td key={sc.key} className="px-4 py-2 text-right font-medium text-gray-900">
                            {fmtEur(calcForecastDay(day.key, sc.key).rohertrag)}
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
                            {fmtEur(rev.rohertrag)}
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

    {/* ═══════ DRUCK- / PDF-ANSICHT (nur beim Drucken sichtbar, DIN A4) ═══════ */}
    {(() => {
      const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
      const dueLabel = (v: string) => DUE_DATE_OPTIONS.find(d => d.value === v)?.label ?? v
      const realisticRev = calcScenarioRevenue('realistic')
      const realisticProfit = realisticRev.rohertrag + totalSponsoring - totalCosts
      const PDF_TITLES: Record<string, string> = { kosten: 'Kostenübersicht', ergebnis: 'Gewinn / Ergebnis', prognose: 'Rohertrag-Prognose', sponsoring: 'Spenden' }
      const pdfTitle = PDF_TITLES[tab] ?? 'Finanzplanung'

      // Gemeinsame Tabellen-Styles – hell, passend zur Web-Oberfläche
      const cTh = { border: '1px solid #E5E7EB', padding: '5px 8px', textAlign: 'left' as const, background: '#F3F4F6', color: '#374151', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 0.3 }
      const cThR = { ...cTh, textAlign: 'right' as const }
      const cTd = { border: '1px solid #E5E7EB', padding: '4px 8px' }
      const cTdR = { ...cTd, textAlign: 'right' as const }
      const zebra = (i: number) => (i % 2 === 1 ? { background: '#F9FAFB' } : undefined)

      const sectionTitle = (title: string, color: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 7px' }}>
          <span style={{ width: 4, height: 15, background: color, borderRadius: 2, display: 'inline-block' }} />
          <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#111827', margin: 0 }}>{title}</h2>
        </div>
      )

      const kpiCard = (label: string, value: string, accent: string, sub?: string) => (
        <div style={{ flex: 1, border: '1px solid #E5E7EB', borderTop: `3px solid ${accent}`, borderRadius: 8, padding: '8px 11px', background: '#fff' }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, color: '#6B7280', fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: accent, lineHeight: 1.2, marginTop: 2 }}>{value}</div>
          {sub && <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>{sub}</div>}
        </div>
      )

      // KPI-Kachel mit Icon-Chip (Fälligkeit) – wie im Web-Frontend
      const dueKpiCard = (icon: string, label: string, value: string, accent: string, count: number) => (
        <div style={{ flex: 1, border: '1px solid #E5E7EB', borderTop: `3px solid ${accent}`, borderRadius: 10, padding: '9px 11px', background: '#fff' }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: `${accent}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, marginBottom: 5 }}>{icon}</div>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6B7280', fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: accent, lineHeight: 1.2, marginTop: 2 }}>{value}</div>
          <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>{count} {count === 1 ? 'Position' : 'Pos.'}</div>
        </div>
      )

      return (
        <div className="hidden print:block" style={{ fontSize: '11px', color: '#1f2937' }}>
          {/* Kopfband – hell, passend zum neuen Web-Frontend */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 18px', marginBottom: 16 }}>
            <div style={{ borderLeft: '4px solid #4F46E5', paddingLeft: 14 }}>
              <p style={{ color: '#CA8A04', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>DJK Ottenhofen e.V. · 70-Jahre-Jubiläumsfest</p>
              <h1 style={{ color: '#111827', fontSize: 21, fontWeight: 800, margin: '3px 0 0' }}>{pdfTitle}</h1>
              <p style={{ color: '#9CA3AF', fontSize: 10, margin: '3px 0 0' }}>Stand: {today}</p>
            </div>
          </div>

          {/* ── KOSTEN ── */}
          {tab === 'kosten' && (() => {
            const ACCENTS: Record<string, string> = { before: '#7C3AED', during: '#EA580C', after: '#0891B2' }
            const mainKpis = DUE_DATE_OPTIONS.filter(dd => dd.value !== 'paid')
            const paidSum = costs.filter(c => c.dueDate === 'paid').reduce((s, c) => s + c.projected, 0)
            const paidCount = costs.filter(c => c.dueDate === 'paid').length
            const pct = (v: number) => (totalCosts > 0 ? (v / totalCosts) * 100 : 0)
            return (
            <>
              {/* Gesamtkosten – Headline-KPI (wie im Web ganz oben) */}
              <div className="print-avoid-break" style={{ border: '1px solid #E5E7EB', borderTop: '3px solid #4F46E5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#4F46E51A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💰</div>
                <div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, color: '#6B7280', fontWeight: 600 }}>Gesamtkosten</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1.1, marginTop: 2 }}>{fmtEur0(totalCosts)}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 9, color: '#9CA3AF' }}>{costs.length} {costs.length === 1 ? 'Position' : 'Positionen'}</div>
              </div>

              {/* Fälligkeit – KPI-Kacheln wie im Web */}
              <div className="print-avoid-break" style={{ marginBottom: 18 }}>
                {sectionTitle('Fälligkeit', '#4F46E5')}
                <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  {mainKpis.map(dd => {
                    const sum = costs.filter(c => c.dueDate === dd.value).reduce((s, c) => s + c.projected, 0)
                    const count = costs.filter(c => c.dueDate === dd.value).length
                    return <div key={dd.value} style={{ flex: 1 }}>{dueKpiCard(dd.icon, dd.label, fmtEur0(sum), ACCENTS[dd.value], count)}</div>
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 11px' }}>
                  <span style={{ color: '#4B5563' }}>✅ Bereits bezahlt</span>
                  <span style={{ color: '#9CA3AF', fontSize: 10 }}>{paidCount} {paidCount === 1 ? 'Position' : 'Positionen'}</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>{fmtEur(paidSum)}</span>
                </div>
              </div>

              {/* Budget-Status – Fortschrittsbalken wie im Web */}
              <div className="print-avoid-break" style={{ marginBottom: 22 }}>
                {sectionTitle('Budget-Status', '#4F46E5')}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 9, color: '#6B7280', marginBottom: 4 }}>
                    {fmtEur(statusGroups.confirmed)} von {fmtEur(totalCosts)} fix
                  </div>
                  <div style={{ height: 8, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ background: '#10B981', width: `${pct(statusGroups.confirmed)}%` }} />
                    <div style={{ background: '#60A5FA', width: `${pct(statusGroups.planned)}%` }} />
                    <div style={{ background: '#FBBF24', width: `${pct(statusGroups.pending)}%` }} />
                    <div style={{ background: '#F87171', width: `${pct(statusGroups.open)}%` }} />
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 9, color: '#6B7280', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: '#10B981' }} />Fix/Zugesagt</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: '#60A5FA' }} />Geplant</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: '#FBBF24' }} />Klären</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: '#F87171' }} />Offen</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 6 }}>{sectionTitle('Kostenpositionen im Detail', '#4F46E5')}</div>
              {ACCORDION_DAYS.map(day => {
                const dayCosts = costsForDay(day.key)
                if (dayCosts.length === 0) return null
                const daySum = dayCosts.reduce((s, c) => s + c.projected, 0) // Brutto
                const dayNet = dayCosts.reduce((s, c) => s + netOf(c), 0)
                const dayVat = daySum - dayNet
                return (
                  <div key={day.key === null ? 'allgemein' : day.key} className="print-avoid-break" style={{ marginBottom: 14 }}>
                    <div style={{ background: '#F3F4F6', borderLeft: '3px solid #6366F1', padding: '4px 9px', fontWeight: 700, fontSize: 11, borderRadius: 4, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{day.icon} {day.label}{day.date ? ` · ${day.date}` : ''}</span>
                      <span>{fmtEur(daySum)}</span>
                    </div>
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={cTh}>Position</th>
                          <th style={cTh}>Status</th>
                          <th style={cTh}>Zeitpunkt</th>
                          <th style={cThR}>Netto</th>
                          <th style={cThR}>MwSt</th>
                          <th style={cThR}>Brutto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayCosts.map((c, i) => (
                          <tr key={c.id} style={zebra(i)}>
                            <td style={cTd}>{c.name}{c.notes ? <span style={{ color: '#9CA3AF' }}> – {c.notes}</span> : ''}</td>
                            <td style={cTd}><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(c.status).color}`}>{getStatusBadge(c.status).label}</span></td>
                            <td style={cTd}>{dueLabel(c.dueDate)}</td>
                            <td style={cTdR}>{fmtEur(netOf(c))}</td>
                            <td style={cTdR}>{fmtEur(vatOf(c))} <span style={{ color: '#9CA3AF', fontSize: 9 }}>({c.vatRate || 0} %)</span></td>
                            <td style={{ ...cTdR, fontWeight: 600 }}>{fmtEur(c.projected)}</td>
                          </tr>
                        ))}
                        <tr style={{ background: '#F3F4F6', fontWeight: 700 }}>
                          <td style={cTd} colSpan={3}>Summe {day.label}</td>
                          <td style={cTdR}>{fmtEur(dayNet)}</td>
                          <td style={cTdR}>{fmtEur(dayVat)}</td>
                          <td style={cTdR}>{fmtEur(daySum)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )
              })}
              <div style={{ border: '1px solid #E5E7EB', borderTop: '3px solid #4F46E5', borderRadius: 8, padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }} className="print-avoid-break">
                <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#4F46E5', fontWeight: 700 }}>Gesamtkosten</span>
                <span style={{ fontSize: 10, color: '#6B7280' }}>Netto {fmtEur(totalNetCosts)} · MwSt {fmtEur(totalVatCosts)}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{fmtEur(totalCosts)} <span style={{ fontSize: 10, fontWeight: 600, color: '#6B7280' }}>brutto</span></span>
              </div>
            </>
            )
          })()}

          {/* ── GEWINN / ERGEBNIS ── */}
          {tab === 'ergebnis' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 18 }} className="print-avoid-break">
                {kpiCard('Einnahmen (realistisch)', fmtEur(realisticRev.rohertrag + totalSponsoring), '#2563EB', 'Rohertrag + Spenden')}
                {kpiCard('Ausgaben', fmtEur(totalCosts), '#DC2626', `${costs.length} Positionen`)}
                {kpiCard('Ergebnis (realistisch)', `${realisticProfit >= 0 ? '+' : ''}${fmtEur(realisticProfit)}`, realisticProfit >= 0 ? '#16A34A' : '#DC2626', 'Einnahmen − Ausgaben')}
              </div>

              <div className="print-avoid-break" style={{ marginBottom: 22 }}>
                {sectionTitle('Ergebnis je Szenario', '#16A34A')}
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={cTh}>Szenario</th>
                      <th style={cThR}>Rohertrag</th>
                      <th style={cThR}>Spenden</th>
                      <th style={cThR}>Einnahmen</th>
                      <th style={cThR}>Kosten</th>
                      <th style={cThR}>Ergebnis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCENARIOS.map(sc => {
                      const rev = calcScenarioRevenue(sc.key)
                      const einnahmen = rev.rohertrag + totalSponsoring
                      const profit = einnahmen - totalCosts
                      return (
                        <tr key={sc.key}>
                          <td style={cTd}><span className={`inline-block px-2 py-0.5 rounded font-bold ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                          <td style={cTdR}>{fmtEur(rev.rohertrag)}</td>
                          <td style={cTdR}>{fmtEur(totalSponsoring)}</td>
                          <td style={cTdR}>{fmtEur(einnahmen)}</td>
                          <td style={cTdR}>{fmtEur(totalCosts)}</td>
                          <td style={{ ...cTdR, fontWeight: 700, color: profit >= 0 ? '#15803D' : '#DC2626' }}>{profit >= 0 ? '+' : ''}{fmtEur(profit)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── ROHERTRAG-PROGNOSE ── */}
          {tab === 'prognose' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 18 }} className="print-avoid-break">
                {SCENARIOS.map(sc => {
                  const rev = calcScenarioRevenue(sc.key)
                  const accent = sc.key === 'pessimistic' ? '#DC2626' : sc.key === 'optimistic' ? '#16A34A' : '#2563EB'
                  return <div key={sc.key} style={{ flex: 1 }}>{kpiCard(`Rohertrag ${sc.label.toLowerCase()}`, fmtEur(rev.rohertrag), accent)}</div>
                })}
              </div>

              {simpleForecasts.length > 0 ? (
                <div className="print-avoid-break" style={{ marginBottom: 22 }}>
                  {sectionTitle('Rohertrag pro Tag & Szenario', '#2563EB')}
                  <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={cTh}>Tag</th>
                        {SCENARIOS.map(sc => <th key={sc.key} style={cThR}>{sc.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {EVENT_DAYS.map((day, i) => (
                        <tr key={day.key} style={zebra(i)}>
                          <td style={cTd}>{day.icon} {day.label}</td>
                          {SCENARIOS.map(sc => (
                            <td key={sc.key} style={cTdR}>{fmtEur(calcForecastDay(day.key, sc.key).rohertrag)}</td>
                          ))}
                        </tr>
                      ))}
                      <tr style={{ background: '#EFF6FF', fontWeight: 700 }}>
                        <td style={cTd}>Gesamt</td>
                        {SCENARIOS.map(sc => (
                          <td key={sc.key} style={{ ...cTdR, color: '#2563EB' }}>{fmtEur(calcScenarioRevenue(sc.key).rohertrag)}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#9CA3AF' }}>Noch keine Prognosedaten erfasst.</p>
              )}
            </>
          )}

          {/* ── SPENDEN ── */}
          {tab === 'sponsoring' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 18 }} className="print-avoid-break">
                {kpiCard('Zugesagt', fmtEur(totalSponsoring), '#D97706', `${sponsors.length} Spenden`)}
                {kpiCard('Erhalten', fmtEur(totalSponsoringReceived), '#16A34A')}
                {kpiCard('Ausstehend', fmtEur(totalSponsoring - totalSponsoringReceived), '#DC2626')}
              </div>

              <div className="print-avoid-break">
                {sectionTitle('Spenden', '#7C3AED')}
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={cTh}>Spender</th>
                      <th style={cTh}>Status</th>
                      <th style={cThR}>Betrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsors.length === 0 ? (
                      <tr><td style={{ ...cTd, color: '#9CA3AF' }} colSpan={3}>Noch keine Spenden eingetragen.</td></tr>
                    ) : sponsors.map((s, i) => (
                      <tr key={s.id} style={zebra(i)}>
                        <td style={cTd}>{s.name}{s.notes ? <span style={{ color: '#9CA3AF' }}> – {s.notes}</span> : ''}</td>
                        <td style={cTd}><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${s.received ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{s.received ? 'Erhalten' : 'Ausstehend'}</span></td>
                        <td style={cTdR}>{fmtEur(s.amount)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#F5F3FF', fontWeight: 700 }}>
                      <td style={cTd}>Gesamt (davon erhalten: {fmtEur(totalSponsoringReceived)})</td>
                      <td style={cTd}></td>
                      <td style={{ ...cTdR, color: '#7C3AED' }}>{fmtEur(totalSponsoring)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div style={{ marginTop: 18, paddingTop: 8, borderTop: '1px solid #E5E7EB', fontSize: 9, color: '#9CA3AF', textAlign: 'center' }}>
            DJK Ottenhofen e.V. · 70-Jahre-Jubiläumsfest · {pdfTitle} · erstellt am {today}
          </div>
        </div>
      )
    })()}
    </>
  )
}
