'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts"

const DEFAULT_DAYS = [
  { id: "do", name: "Donnerstag", date: "09.07.2026", event: "Wattturnier im Festzelt", hasEntry: false, entryFee: 0 },
  { id: "fr", name: "Freitag", date: "10.07.2026", event: "Disco Party mit DJ Josch", hasEntry: true, entryFee: 5 },
  { id: "sa", name: "Samstag", date: "11.07.2026", event: "Festzeltparty mit Drunter & Drüber", hasEntry: true, entryFee: 10 },
  { id: "so", name: "Sonntag", date: "12.07.2026", event: "Bayrischer Festsonntag", hasEntry: false, entryFee: 0 },
]

const DRINK_CATS = [
  { id: "bier", label: "Bier", icon: "🍺", color: "#D4A017" },
  { id: "softdrinks", label: "Softdrinks", icon: "🥤", color: "#3B82F6" },
  { id: "schnaps", label: "Schnaps", icon: "🥃", color: "#A855F7" },
]

const SCENARIO_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  conservative: { label: "Konservativ", color: "#6B7280", bg: "#F3F4F6" },
  realistic: { label: "Realistisch", color: "#2563EB", bg: "#EFF6FF" },
  optimistic: { label: "Optimistisch", color: "#16A34A", bg: "#F0FDF4" },
}

const DEFAULT_COSTS = [
  { id: 1, name: "Zeltmiete", projected: 4500, actual: null as number|null, status: "before", costType: "fix" },
  { id: 2, name: "DJ Josch (Freitag)", projected: 800, actual: null as number|null, status: "after", costType: "fix" },
  { id: 3, name: "Band Drunter & Drüber (Samstag)", projected: 2500, actual: null as number|null, status: "after", costType: "fix" },
  { id: 4, name: "Strom", projected: 600, actual: null as number|null, status: "after", costType: "unklar" },
  { id: 5, name: "Sanitäranlagen", projected: 1200, actual: null as number|null, status: "before", costType: "fix" },
  { id: 6, name: "Werbung & Flyer", projected: 400, actual: null as number|null, status: "paid", costType: "fix" },
  { id: 7, name: "GEMA-Gebühren", projected: 350, actual: null as number|null, status: "before", costType: "fix" },
  { id: 8, name: "Security", projected: 1800, actual: null as number|null, status: "after", costType: "unklar" },
]

const DEFAULT_SCENARIOS: Record<string, Record<string, {visitors:number;drinksPerPerson:number;drinkSplit:Record<string,number>}>> = {
  do: {
    conservative: { visitors: 100, drinksPerPerson: 3, drinkSplit: { bier: 50, softdrinks: 35, schnaps: 15 } },
    realistic: { visitors: 150, drinksPerPerson: 4, drinkSplit: { bier: 55, softdrinks: 30, schnaps: 15 } },
    optimistic: { visitors: 200, drinksPerPerson: 5, drinkSplit: { bier: 55, softdrinks: 25, schnaps: 20 } },
  },
  fr: {
    conservative: { visitors: 150, drinksPerPerson: 4, drinkSplit: { bier: 40, softdrinks: 25, schnaps: 35 } },
    realistic: { visitors: 250, drinksPerPerson: 5, drinkSplit: { bier: 40, softdrinks: 25, schnaps: 35 } },
    optimistic: { visitors: 350, drinksPerPerson: 6, drinkSplit: { bier: 40, softdrinks: 20, schnaps: 40 } },
  },
  sa: {
    conservative: { visitors: 200, drinksPerPerson: 3, drinkSplit: { bier: 50, softdrinks: 35, schnaps: 15 } },
    realistic: { visitors: 300, drinksPerPerson: 4, drinkSplit: { bier: 50, softdrinks: 30, schnaps: 20 } },
    optimistic: { visitors: 400, drinksPerPerson: 5, drinkSplit: { bier: 50, softdrinks: 25, schnaps: 25 } },
  },
  so: {
    conservative: { visitors: 200, drinksPerPerson: 2, drinkSplit: { bier: 55, softdrinks: 40, schnaps: 5 } },
    realistic: { visitors: 300, drinksPerPerson: 3, drinkSplit: { bier: 55, softdrinks: 35, schnaps: 10 } },
    optimistic: { visitors: 400, drinksPerPerson: 3, drinkSplit: { bier: 55, softdrinks: 30, schnaps: 15 } },
  },
}

const DEFAULT_ACTUALS: Record<string, Record<string, number|null>> = {
  do: { visitors: null, bier: null, softdrinks: null, schnaps: null, entryRevenue: null },
  fr: { visitors: null, bier: null, softdrinks: null, schnaps: null, entryRevenue: null },
  sa: { visitors: null, bier: null, softdrinks: null, schnaps: null, entryRevenue: null },
  so: { visitors: null, bier: null, softdrinks: null, schnaps: null, entryRevenue: null },
}

const DEFAULT_PRICES = [
  { id: 1, name: "Maß Bier", category: "bier", sellPrice: 8.5, costPrice: 4.5 },
  { id: 2, name: "Halbe Bier", category: "bier", sellPrice: 5.0, costPrice: 2.5 },
  { id: 3, name: "Radler Maß", category: "bier", sellPrice: 8.0, costPrice: 4.0 },
  { id: 4, name: "Spezi / Cola 0,5l", category: "softdrinks", sellPrice: 4.0, costPrice: 1.5 },
  { id: 5, name: "Wasser 0,5l", category: "softdrinks", sellPrice: 3.5, costPrice: 0.8 },
  { id: 6, name: "Schnaps 2cl", category: "schnaps", sellPrice: 3.0, costPrice: 1.0 },
  { id: 7, name: "Jägermeister 2cl", category: "schnaps", sellPrice: 3.5, costPrice: 1.2 },
]

const DEFAULT_SPONSORS = [{ id: 1, name: "", amount: 0, received: false }]

function getInitialState() {
  return {
    days: DEFAULT_DAYS,
    scenarios: DEFAULT_SCENARIOS,
    actuals: DEFAULT_ACTUALS,
    profitPerDrink: 3,
    prices: DEFAULT_PRICES,
    costs: DEFAULT_COSTS,
    sponsors: DEFAULT_SPONSORS,
    nextCostId: 9,
    nextPriceId: 8,
    nextSponsorId: 2,
  }
}

type AppState = ReturnType<typeof getInitialState>

function NumInput({ value, onChange, placeholder, min = 0, step = 1, prefix, suffix }: { value: number|null|undefined; onChange: (v: number|null) => void; placeholder?: string; min?: number; step?: number; prefix?: string; suffix?: string }) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none">{prefix}</span>}
      <input type="number" value={value === null || value === undefined ? "" : value}
        onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
        placeholder={placeholder} min={min} step={step}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${prefix ? "pl-7" : ""} ${suffix ? "pr-7" : ""}`} />
      {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none">{suffix}</span>}
    </div>
  )
}

const fmtEur = (v: number) => v.toLocaleString("de-DE", { style: "currency", currency: "EUR" })
const fmtNum = (v: number) => v.toLocaleString("de-DE")

function DayPlanning({ state, setState }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>> }) {
  const [selectedDay, setSelectedDay] = useState("do")
  const day = state.days.find(d => d.id === selectedDay)!
  const scenarios = state.scenarios[selectedDay]

  const updateScenario = (scenario: string, field: string, value: number) => {
    setState(s => ({ ...s, scenarios: { ...s.scenarios, [selectedDay]: { ...s.scenarios[selectedDay], [scenario]: { ...s.scenarios[selectedDay][scenario], [field]: value } } } }))
  }
  const updateDrinkSplit = (scenario: string, drink: string, value: number) => {
    setState(s => ({ ...s, scenarios: { ...s.scenarios, [selectedDay]: { ...s.scenarios[selectedDay], [scenario]: { ...s.scenarios[selectedDay][scenario], drinkSplit: { ...s.scenarios[selectedDay][scenario].drinkSplit, [drink]: value } } } } }))
  }

  const calcRevenue = (sc: typeof scenarios.conservative) => {
    const totalDrinks = sc.visitors * sc.drinksPerPerson
    const drinkRevenue = totalDrinks * state.profitPerDrink
    const entryRevenue = day.hasEntry ? sc.visitors * day.entryFee : 0
    return { totalDrinks, drinkRevenue, entryRevenue, total: drinkRevenue + entryRevenue }
  }

  const chartData = Object.entries(SCENARIO_LABELS).map(([key, meta]) => {
    const rev = calcRevenue(scenarios[key])
    return { name: meta.label, "Getränke": rev.drinkRevenue, "Eintritt": rev.entryRevenue }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tagesplanung & Prognose</h2>
          <p className="text-sm text-gray-600">Szenarien für jeden Festtag planen</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Durchschn. Gewinn/Getränk:</span>
          <div className="w-24"><NumInput value={state.profitPerDrink} onChange={v => setState(s => ({ ...s, profitPerDrink: v ?? 0 }))} prefix="€" step={0.5} /></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {state.days.map(d => (
          <button key={d.id} onClick={() => setSelectedDay(d.id)}
            className={`p-3 rounded-lg border-2 text-left transition-colors ${selectedDay === d.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
            <div className="text-xs text-gray-600">{d.date}</div>
            <div className="font-semibold text-sm text-gray-900">{d.name}</div>
            <div className="text-xs text-gray-600 truncate">{d.event}</div>
          </button>
        ))}
      </div>

      {day.hasEntry && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-4">
          <span className="font-medium text-yellow-800">Eintrittspreis:</span>
          <div className="w-24"><NumInput value={day.entryFee} onChange={v => setState(s => ({ ...s, days: s.days.map(dd => dd.id === selectedDay ? { ...dd, entryFee: v ?? 0 } : dd) }))} prefix="€" step={0.5} /></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Object.entries(SCENARIO_LABELS).map(([key, meta]) => {
          const sc = scenarios[key]
          const rev = calcRevenue(sc)
          const splitTotal = Object.values(sc.drinkSplit).reduce((a: number, b: number) => a + b, 0)
          return (
            <div key={key} className="bg-white rounded-lg shadow border p-5" style={{ borderTopWidth: 4, borderTopColor: meta.color }}>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ color: meta.color, backgroundColor: meta.bg }}>{meta.label}</span>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Besucher</label><NumInput value={sc.visitors} onChange={v => updateScenario(key, "visitors", v ?? 0)} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Getränke/Pers.</label><NumInput value={sc.drinksPerPerson} onChange={v => updateScenario(key, "drinksPerPerson", v ?? 0)} step={0.5} /></div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Verteilung (%) {splitTotal !== 100 && <span className="text-red-500">Summe: {splitTotal}%</span>}</label>
                <div className="grid grid-cols-3 gap-2">
                  {DRINK_CATS.map(cat => (
                    <div key={cat.id} className="text-center">
                      <div className="text-xs text-gray-700 mb-1">{cat.icon}</div>
                      <NumInput value={sc.drinkSplit[cat.id]} onChange={v => updateDrinkSplit(key, cat.id, v ?? 0)} suffix="%" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg p-3 text-sm space-y-1" style={{ backgroundColor: meta.bg }}>
                <div className="font-semibold text-xs mb-2" style={{ color: meta.color }}>Prognostizierter Umsatz</div>
                <div className="flex justify-between"><span className="text-gray-700">Getränke:</span><span className="font-semibold text-gray-900">{fmtNum(rev.totalDrinks)} Stk. &rarr; {fmtEur(rev.drinkRevenue)}</span></div>
                {day.hasEntry && <div className="flex justify-between"><span className="text-gray-700">Eintritt:</span><span className="font-semibold text-gray-900">{fmtEur(rev.entryRevenue)}</span></div>}
                <div className="border-t pt-1 mt-1 flex justify-between font-bold" style={{ borderColor: meta.color + "40", color: meta.color }}>
                  <span>Gesamt:</span><span className="text-lg">{fmtEur(rev.total)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-lg shadow border p-5">
        <h3 className="font-bold text-gray-900 mb-4">Szenario-Vergleich – {day.name}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
            <YAxis tickFormatter={(v: any) => `${v.toLocaleString("de-DE")}€`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: any) => fmtEur(Number(v))} />
            <Legend />
            <Bar dataKey="Getränke" fill="#D4A017" radius={[4, 4, 0, 0]} />
            {day.hasEntry && <Bar dataKey="Eintritt" fill="#1A1A1A" radius={[4, 4, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ActualNumbers({ state, setState }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>> }) {
  const [selectedDay, setSelectedDay] = useState("do")
  const day = state.days.find(d => d.id === selectedDay)!
  const actuals = state.actuals[selectedDay]
  const scenarios = state.scenarios[selectedDay]

  const updateActual = (field: string, value: number | null) => {
    setState(s => ({ ...s, actuals: { ...s.actuals, [selectedDay]: { ...s.actuals[selectedDay], [field]: value } } }))
  }

  const actualDrinkTotal = (actuals.bier || 0) + (actuals.softdrinks || 0) + (actuals.schnaps || 0)
  const actualDrinkRevenue = actualDrinkTotal * state.profitPerDrink
  const actualEntryRevenue = actuals.entryRevenue || 0
  const actualTotal = actualDrinkRevenue + actualEntryRevenue

  const realisticSc = scenarios.realistic
  const realisticTotal = realisticSc.visitors * realisticSc.drinksPerPerson * state.profitPerDrink + (day.hasEntry ? realisticSc.visitors * day.entryFee : 0)
  const hasData = actuals.visitors !== null

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-900">Tatsächliche Zahlen</h2><p className="text-sm text-gray-600">Echte Absatz- und Umsatzzahlen eintragen</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {state.days.map(d => {
          const has = state.actuals[d.id].visitors !== null
          return (
            <button key={d.id} onClick={() => setSelectedDay(d.id)}
              className={`p-3 rounded-lg border-2 text-left transition-colors relative ${selectedDay === d.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
              {has && <span className="absolute top-1 right-2 text-xs text-green-600 font-bold">Erfasst</span>}
              <div className="text-xs text-gray-600">{d.date}</div>
              <div className="font-semibold text-sm text-gray-900">{d.name}</div>
            </button>
          )
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border p-5 space-y-4">
          <h3 className="font-bold text-gray-900">Eingabe – {day.name}</h3>
          <div><label className="block text-sm font-medium text-gray-800 mb-1">Tatsächliche Besucher</label><NumInput value={actuals.visitors} onChange={v => updateActual("visitors", v)} placeholder="z.B. 150" /></div>
          <p className="font-semibold text-gray-900 text-sm">Verkaufte Getränke</p>
          {DRINK_CATS.map(cat => (
            <div key={cat.id}><label className="block text-sm text-gray-800 mb-1">{cat.icon} {cat.label} (Stück)</label><NumInput value={actuals[cat.id]} onChange={v => updateActual(cat.id, v)} placeholder="Anzahl" /></div>
          ))}
          {day.hasEntry && (
            <div className="pt-3 border-t"><label className="block text-sm text-gray-800 mb-1">Eintrittseinnahmen (EUR)</label><NumInput value={actuals.entryRevenue} onChange={v => updateActual("entryRevenue", v)} prefix="€" /></div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow border p-5">
          <h3 className="font-bold text-gray-900 mb-4">{hasData ? "Auswertung" : "Noch keine Daten"}</h3>
          {hasData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-700">Besucher:</span><span className="font-bold text-right text-gray-900">{fmtNum(actuals.visitors || 0)}</span>
                <span className="text-gray-700">Getränke gesamt:</span><span className="font-bold text-right text-gray-900">{fmtNum(actualDrinkTotal)}</span>
                <span className="text-gray-700">Durchschn. Getränke/Person:</span><span className="font-bold text-right text-gray-900">{actuals.visitors ? (actualDrinkTotal / actuals.visitors).toFixed(1) : "–"}</span>
              </div>
              {DRINK_CATS.map(cat => (
                <div key={cat.id} className="flex justify-between text-sm text-gray-800">
                  <span>{cat.icon} {cat.label}:</span>
                  <span className="font-semibold text-gray-900">{fmtNum(actuals[cat.id] || 0)} ({actualDrinkTotal > 0 ? Math.round((actuals[cat.id] || 0) / actualDrinkTotal * 100) : 0}%)</span>
                </div>
              ))}
              <div className="bg-gray-50 rounded-lg p-3 mt-4 space-y-1 text-sm">
                <div className="font-semibold text-blue-700 text-xs mb-2">Tatsächlicher Umsatz</div>
                <div className="flex justify-between"><span className="text-gray-700">Getränkeumsatz:</span><span className="font-bold text-gray-900">{fmtEur(actualDrinkRevenue)}</span></div>
                {day.hasEntry && <div className="flex justify-between"><span className="text-gray-700">Eintritt:</span><span className="font-bold text-gray-900">{fmtEur(actualEntryRevenue)}</span></div>}
                <div className="border-t pt-1 flex justify-between font-bold text-blue-700"><span>Gesamt:</span><span className="text-lg">{fmtEur(actualTotal)}</span></div>
              </div>
              <div className={`rounded-lg p-3 text-sm font-semibold ${actualTotal >= realisticTotal ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                vs. Prognose (realistisch): {actualTotal >= realisticTotal ? "+" : ""}{fmtEur(actualTotal - realisticTotal)} ({realisticTotal > 0 ? (actualTotal >= realisticTotal ? "+" : "") + Math.round((actualTotal / realisticTotal - 1) * 100) + "%" : "0%"})
              </div>
            </div>
          ) : <p className="text-gray-400 text-center py-12">Trage links die Zahlen ein.</p>}
        </div>
      </div>
    </div>
  )
}

const TABS = [
  { id: "planung", label: "Tagesplanung & Szenarien" },
  { id: "ist", label: "Ist-Zahlen" },
]

export default function PrognosePage() {
  const [state, setState] = useState(getInitialState)
  const [activeTab, setActiveTab] = useState("planung")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("djk-planer-state")
      if (saved) setState(prev => ({ ...prev, ...JSON.parse(saved) }))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem("djk-planer-state", JSON.stringify(state)) } catch { /* ignore */ }
    }, 2000)
    return () => clearTimeout(timer)
  }, [state])

  const saveState = useCallback(() => {
    setSaving(true)
    try { localStorage.setItem("djk-planer-state", JSON.stringify(state)) } catch { /* ignore */ }
    setTimeout(() => setSaving(false), 800)
  }, [state])

  const resetAll = () => {
    if (confirm("Alle Planer-Daten zurücksetzen?")) {
      setState(getInitialState())
      try { localStorage.removeItem("djk-planer-state") } catch { /* ignore */ }
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 -mx-4 -mt-16 lg:-mt-6 px-4 pt-16 lg:pt-6 pb-4 mb-6 rounded-b-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
            <h1 className="text-2xl font-bold text-white">Prognose & Ist-Zahlen</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={saveState} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${saving ? "bg-green-500 text-white border-green-500" : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"}`}>
              {saving ? "✓ Gespeichert" : "Speichern"}
            </button>
            <button onClick={resetAll} className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-400 text-sm hover:bg-gray-800">Zurücksetzen</button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === t.id ? "bg-white text-gray-900" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "planung" && <DayPlanning state={state} setState={setState} />}
      {activeTab === "ist" && <ActualNumbers state={state} setState={setState} />}
    </div>
  )
}
