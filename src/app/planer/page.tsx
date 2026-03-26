'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
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

const PAYMENT_STATUS = [
  { id: "before", label: "Vor dem Fest", color: "#F59E0B", icon: "⏳" },
  { id: "during", label: "Während des Fests", color: "#3B82F6", icon: "🎪" },
  { id: "after", label: "Nach dem Fest", color: "#8B5CF6", icon: "📋" },
  { id: "paid", label: "Bereits bezahlt", color: "#16A34A", icon: "✅" },
]

const DEFAULT_COSTS = [
  { id: 1, name: "Zeltmiete", projected: 4500, actual: null as number|null, status: "before" },
  { id: 2, name: "DJ Josch (Freitag)", projected: 800, actual: null as number|null, status: "after" },
  { id: 3, name: "Band Drunter & Drüber (Samstag)", projected: 2500, actual: null as number|null, status: "after" },
  { id: 4, name: "Strom", projected: 600, actual: null as number|null, status: "after" },
  { id: 5, name: "Sanitäranlagen", projected: 1200, actual: null as number|null, status: "before" },
  { id: 6, name: "Werbung & Flyer", projected: 400, actual: null as number|null, status: "paid" },
  { id: 7, name: "GEMA-Gebühren", projected: 350, actual: null as number|null, status: "before" },
  { id: 8, name: "Security", projected: 1800, actual: null as number|null, status: "after" },
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
      {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">{prefix}</span>}
      <input type="number" value={value === null || value === undefined ? "" : value}
        onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
        placeholder={placeholder} min={min} step={step}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${prefix ? "pl-7" : ""} ${suffix ? "pr-7" : ""}`} />
      {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">{suffix}</span>}
    </div>
  )
}

const fmtEur = (v: number) => v.toLocaleString("de-DE", { style: "currency", currency: "EUR" })
const fmtNum = (v: number) => v.toLocaleString("de-DE")

// ── TAB 1: TAGESPLANUNG ──
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
          <h2 className="text-xl font-bold text-gray-900">📋 Tagesplanung & Prognose</h2>
          <p className="text-sm text-gray-500">Szenarien für jeden Festtag planen</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">⌀ Gewinn/Getränk:</span>
          <div className="w-24"><NumInput value={state.profitPerDrink} onChange={v => setState(s => ({ ...s, profitPerDrink: v ?? 0 }))} prefix="€" step={0.5} /></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {state.days.map(d => (
          <button key={d.id} onClick={() => setSelectedDay(d.id)}
            className={`p-3 rounded-lg border-2 text-left transition-colors ${selectedDay === d.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
            <div className="text-xs text-gray-500">{d.date}</div>
            <div className="font-semibold text-sm">{d.name}</div>
            <div className="text-xs text-gray-500 truncate">{d.event}</div>
          </button>
        ))}
      </div>

      {day.hasEntry && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-4">
          <span className="font-medium text-yellow-800">🎟️ Eintrittspreis:</span>
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
                <div><label className="block text-xs font-medium text-gray-500 mb-1">👥 Besucher</label><NumInput value={sc.visitors} onChange={v => updateScenario(key, "visitors", v ?? 0)} /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">🍻 Getränke/Pers.</label><NumInput value={sc.drinksPerPerson} onChange={v => updateScenario(key, "drinksPerPerson", v ?? 0)} step={0.5} /></div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">Verteilung (%) {splitTotal !== 100 && <span className="text-red-500">⚠ {splitTotal}%</span>}</label>
                <div className="grid grid-cols-3 gap-2">
                  {DRINK_CATS.map(cat => (
                    <div key={cat.id} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">{cat.icon}</div>
                      <NumInput value={sc.drinkSplit[cat.id]} onChange={v => updateDrinkSplit(key, cat.id, v ?? 0)} suffix="%" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg p-3 text-sm space-y-1" style={{ backgroundColor: meta.bg }}>
                <div className="font-semibold text-xs mb-2" style={{ color: meta.color }}>Prognostizierter Umsatz</div>
                <div className="flex justify-between"><span className="text-gray-500">Getränke:</span><span className="font-semibold">{fmtNum(rev.totalDrinks)} Stk. → {fmtEur(rev.drinkRevenue)}</span></div>
                {day.hasEntry && <div className="flex justify-between"><span className="text-gray-500">Eintritt:</span><span className="font-semibold">{fmtEur(rev.entryRevenue)}</span></div>}
                <div className="border-t pt-1 mt-1 flex justify-between font-bold" style={{ borderColor: meta.color + "40", color: meta.color }}>
                  <span>Gesamt:</span><span className="text-lg">{fmtEur(rev.total)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-lg shadow border p-5">
        <h3 className="font-bold text-gray-900 mb-4">📊 Szenario-Vergleich – {day.name}</h3>
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

// ── TAB 2: IST-ZAHLEN ──
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
      <div><h2 className="text-xl font-bold text-gray-900">📝 Tatsächliche Zahlen</h2><p className="text-sm text-gray-500">Echte Absatz- und Umsatzzahlen eintragen</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {state.days.map(d => {
          const has = state.actuals[d.id].visitors !== null
          return (
            <button key={d.id} onClick={() => setSelectedDay(d.id)}
              className={`p-3 rounded-lg border-2 text-left transition-colors relative ${selectedDay === d.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
              {has && <span className="absolute top-1 right-2 text-xs">✅</span>}
              <div className="text-xs text-gray-500">{d.date}</div>
              <div className="font-semibold text-sm">{d.name}</div>
            </button>
          )
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border p-5 space-y-4">
          <h3 className="font-bold text-gray-900">Eingabe – {day.name}</h3>
          <div><label className="block text-sm font-medium text-gray-600 mb-1">👥 Tatsächliche Besucher</label><NumInput value={actuals.visitors} onChange={v => updateActual("visitors", v)} placeholder="z.B. 150" /></div>
          <p className="font-semibold text-gray-900 text-sm">Verkaufte Getränke</p>
          {DRINK_CATS.map(cat => (
            <div key={cat.id}><label className="block text-sm text-gray-600 mb-1">{cat.icon} {cat.label} (Stück)</label><NumInput value={actuals[cat.id]} onChange={v => updateActual(cat.id, v)} placeholder="Anzahl" /></div>
          ))}
          {day.hasEntry && (
            <div className="pt-3 border-t"><label className="block text-sm text-gray-600 mb-1">🎟️ Eintrittseinnahmen (€)</label><NumInput value={actuals.entryRevenue} onChange={v => updateActual("entryRevenue", v)} prefix="€" /></div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow border p-5">
          <h3 className="font-bold text-gray-900 mb-4">{hasData ? "📊 Auswertung" : "⏳ Noch keine Daten"}</h3>
          {hasData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Besucher:</span><span className="font-bold text-right">{fmtNum(actuals.visitors || 0)}</span>
                <span className="text-gray-500">Getränke gesamt:</span><span className="font-bold text-right">{fmtNum(actualDrinkTotal)}</span>
                <span className="text-gray-500">Ø Getränke/Person:</span><span className="font-bold text-right">{actuals.visitors ? (actualDrinkTotal / actuals.visitors).toFixed(1) : "–"}</span>
              </div>
              {DRINK_CATS.map(cat => (
                <div key={cat.id} className="flex justify-between text-sm text-gray-600">
                  <span>{cat.icon} {cat.label}:</span>
                  <span className="font-semibold">{fmtNum(actuals[cat.id] || 0)} ({actualDrinkTotal > 0 ? Math.round((actuals[cat.id] || 0) / actualDrinkTotal * 100) : 0}%)</span>
                </div>
              ))}
              <div className="bg-gray-50 rounded-lg p-3 mt-4 space-y-1 text-sm">
                <div className="font-semibold text-blue-700 text-xs mb-2">Tatsächlicher Umsatz</div>
                <div className="flex justify-between"><span className="text-gray-500">Getränkeumsatz:</span><span className="font-bold">{fmtEur(actualDrinkRevenue)}</span></div>
                {day.hasEntry && <div className="flex justify-between"><span className="text-gray-500">Eintritt:</span><span className="font-bold">{fmtEur(actualEntryRevenue)}</span></div>}
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

// ── TAB 3: PREISLISTE ──
function PriceList({ state, setState }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>> }) {
  const addItem = () => setState(s => ({ ...s, prices: [...s.prices, { id: s.nextPriceId, name: "", category: "bier", sellPrice: 0, costPrice: 0 }], nextPriceId: s.nextPriceId + 1 }))
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-xl font-bold text-gray-900">💰 Preisliste</h2><p className="text-sm text-gray-500">Verkaufs- und Einkaufspreise</p></div>
        <button onClick={addItem} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Position</button>
      </div>
      <div className="bg-white rounded-lg shadow border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkt</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">VK (€)</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">EK (€)</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gewinn</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Marge</th>
            <th className="px-4 py-3 w-10"></th>
          </tr></thead>
          <tbody className="divide-y">
            {state.prices.map(p => {
              const profit = (p.sellPrice || 0) - (p.costPrice || 0)
              const margin = p.sellPrice > 0 ? Math.round(profit / p.sellPrice * 100) : 0
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2"><input value={p.name} onChange={e => setState(s => ({ ...s, prices: s.prices.map(pp => pp.id === p.id ? { ...pp, name: e.target.value } : pp) }))} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Produktname" /></td>
                  <td className="px-4 py-2"><select value={p.category} onChange={e => setState(s => ({ ...s, prices: s.prices.map(pp => pp.id === p.id ? { ...pp, category: e.target.value } : pp) }))} className="border border-gray-300 rounded px-2 py-1 text-sm">{DRINK_CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></td>
                  <td className="px-4 py-2"><NumInput value={p.sellPrice} onChange={v => setState(s => ({ ...s, prices: s.prices.map(pp => pp.id === p.id ? { ...pp, sellPrice: v ?? 0 } : pp) }))} step={0.1} prefix="€" /></td>
                  <td className="px-4 py-2"><NumInput value={p.costPrice} onChange={v => setState(s => ({ ...s, prices: s.prices.map(pp => pp.id === p.id ? { ...pp, costPrice: v ?? 0 } : pp) }))} step={0.1} prefix="€" /></td>
                  <td className={`px-4 py-2 text-right font-bold ${profit > 0 ? "text-green-600" : "text-red-600"}`}>{profit.toFixed(2)} €</td>
                  <td className="px-4 py-2 text-right text-gray-600">{margin}%</td>
                  <td className="px-4 py-2"><button onClick={() => setState(s => ({ ...s, prices: s.prices.filter(pp => pp.id !== p.id) }))} className="text-red-500 hover:text-red-700">✕</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── TAB 4: KOSTEN ──
function CostsTab({ state, setState }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>> }) {
  const addCost = () => setState(s => ({ ...s, costs: [...s.costs, { id: s.nextCostId, name: "", projected: 0, actual: null, status: "before" }], nextCostId: s.nextCostId + 1 }))
  const totalProjected = state.costs.reduce((s, c) => s + (c.projected || 0), 0)
  const totalActual = state.costs.reduce((s, c) => s + (c.actual || 0), 0)
  const hasActuals = state.costs.some(c => c.actual !== null)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-xl font-bold text-gray-900">💸 Kostenplanung</h2><p className="text-sm text-gray-500">Prognostizierte und tatsächliche Kosten</p></div>
        <button onClick={addCost} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Position</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow border p-4 text-center"><div className="text-xs text-gray-500 font-medium">Prognostiziert</div><div className="text-2xl font-bold text-red-600">{fmtEur(totalProjected)}</div></div>
        <div className="bg-white rounded-lg shadow border p-4 text-center"><div className="text-xs text-gray-500 font-medium">Tatsächlich</div><div className="text-2xl font-bold">{hasActuals ? fmtEur(totalActual) : "–"}</div></div>
        {hasActuals && <div className={`rounded-lg shadow border p-4 text-center ${totalActual <= totalProjected ? "bg-green-50" : "bg-red-50"}`}><div className="text-xs text-gray-500 font-medium">Differenz</div><div className={`text-2xl font-bold ${totalActual <= totalProjected ? "text-green-600" : "text-red-600"}`}>{(totalProjected - totalActual >= 0 ? "+" : "")}{fmtEur(totalProjected - totalActual)}</div></div>}
      </div>
      <div className="bg-white rounded-lg shadow border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prognose (€)</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tatsächlich (€)</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 w-10"></th>
          </tr></thead>
          <tbody className="divide-y">
            {state.costs.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-2"><input value={c.name} onChange={e => setState(s => ({ ...s, costs: s.costs.map(cc => cc.id === c.id ? { ...cc, name: e.target.value } : cc) }))} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Kostenposition" /></td>
                <td className="px-4 py-2"><NumInput value={c.projected} onChange={v => setState(s => ({ ...s, costs: s.costs.map(cc => cc.id === c.id ? { ...cc, projected: v ?? 0 } : cc) }))} prefix="€" step={10} /></td>
                <td className="px-4 py-2"><NumInput value={c.actual} onChange={v => setState(s => ({ ...s, costs: s.costs.map(cc => cc.id === c.id ? { ...cc, actual: v } : cc) }))} prefix="€" step={10} placeholder="–" /></td>
                <td className="px-4 py-2"><select value={c.status} onChange={e => setState(s => ({ ...s, costs: s.costs.map(cc => cc.id === c.id ? { ...cc, status: e.target.value } : cc) }))} className="border border-gray-300 rounded px-2 py-1 text-sm">{PAYMENT_STATUS.map(ps => <option key={ps.id} value={ps.id}>{ps.icon} {ps.label}</option>)}</select></td>
                <td className="px-4 py-2"><button onClick={() => setState(s => ({ ...s, costs: s.costs.filter(cc => cc.id !== c.id) }))} className="text-red-500 hover:text-red-700">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PAYMENT_STATUS.map(ps => {
          const items = state.costs.filter(c => c.status === ps.id)
          const total = items.reduce((s, c) => s + (c.projected || 0), 0)
          return (
            <div key={ps.id} className="bg-white rounded-lg shadow border p-3" style={{ borderLeftWidth: 4, borderLeftColor: ps.color }}>
              <div className="text-xs font-semibold text-gray-600">{ps.icon} {ps.label}</div>
              <div className="text-lg font-bold" style={{ color: ps.color }}>{fmtEur(total)}</div>
              <div className="text-xs text-gray-400">{items.length} Position{items.length !== 1 ? "en" : ""}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── TAB 5: SPONSORING ──
function SponsoringTab({ state, setState }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>> }) {
  const addSponsor = () => setState(s => ({ ...s, sponsors: [...s.sponsors, { id: s.nextSponsorId, name: "", amount: 0, received: false }], nextSponsorId: s.nextSponsorId + 1 }))
  const totalPledged = state.sponsors.reduce((s, sp) => s + (sp.amount || 0), 0)
  const totalReceived = state.sponsors.filter(sp => sp.received).reduce((s, sp) => s + (sp.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-xl font-bold text-gray-900">🤝 Sponsoring & Zuschüsse</h2><p className="text-sm text-gray-500">Spenden und Sponsorengelder</p></div>
        <button onClick={addSponsor} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Sponsor</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow border p-4 text-center"><div className="text-xs text-gray-500">Zugesagt</div><div className="text-2xl font-bold text-blue-600">{fmtEur(totalPledged)}</div></div>
        <div className="bg-white rounded-lg shadow border p-4 text-center"><div className="text-xs text-gray-500">Erhalten</div><div className="text-2xl font-bold text-green-600">{fmtEur(totalReceived)}</div></div>
        <div className="bg-white rounded-lg shadow border p-4 text-center"><div className="text-xs text-gray-500">Ausstehend</div><div className="text-2xl font-bold text-yellow-600">{fmtEur(totalPledged - totalReceived)}</div></div>
      </div>
      <div className="bg-white rounded-lg shadow border p-5 space-y-3">
        {state.sponsors.map(sp => (
          <div key={sp.id} className="flex flex-wrap gap-3 items-center py-3 border-b last:border-0">
            <input value={sp.name} onChange={e => setState(s => ({ ...s, sponsors: s.sponsors.map(ss => ss.id === sp.id ? { ...ss, name: e.target.value } : ss) }))} placeholder="Name des Sponsors" className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <div className="w-32"><NumInput value={sp.amount} onChange={v => setState(s => ({ ...s, sponsors: s.sponsors.map(ss => ss.id === sp.id ? { ...ss, amount: v ?? 0 } : ss) }))} prefix="€" /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={sp.received} onChange={e => setState(s => ({ ...s, sponsors: s.sponsors.map(ss => ss.id === sp.id ? { ...ss, received: e.target.checked } : ss) }))} className="w-4 h-4 accent-green-600" /> Erhalten
            </label>
            <button onClick={() => setState(s => ({ ...s, sponsors: s.sponsors.filter(ss => ss.id !== sp.id) }))} className="text-red-500 hover:text-red-700">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TAB 6: ÜBERSICHT ──
function OverviewTab({ state }: { state: AppState }) {
  const calcDayRevenue = (dayId: string, scenario: string) => {
    const sc = state.scenarios[dayId][scenario]
    const day = state.days.find(d => d.id === dayId)!
    const totalDrinks = sc.visitors * sc.drinksPerPerson
    const drinkRev = totalDrinks * state.profitPerDrink
    const entryRev = day.hasEntry ? sc.visitors * day.entryFee : 0
    return { drinkRev, entryRev, total: drinkRev + entryRev, visitors: sc.visitors, drinks: totalDrinks }
  }
  const totalCosts = state.costs.reduce((s, c) => s + (c.projected || 0), 0)
  const totalSponsoring = state.sponsors.reduce((s, sp) => s + (sp.amount || 0), 0)

  const scenarios = ["conservative", "realistic", "optimistic"] as const
  const scenarioTotals = scenarios.map(sc => {
    const revenue = state.days.reduce((sum, d) => sum + calcDayRevenue(d.id, sc).total, 0)
    return { scenario: sc, revenue, profit: revenue + totalSponsoring - totalCosts }
  })

  const revenueByDay = state.days.map(d => {
    const row: Record<string, string | number> = { name: d.name.substring(0, 2) + "." }
    scenarios.forEach(sc => { row[SCENARIO_LABELS[sc].label] = calcDayRevenue(d.id, sc).total })
    return row
  })

  const costPieData = state.costs.filter(c => c.projected > 0).map(c => ({ name: c.name, value: c.projected }))
  const PIE_COLORS = ["#1A1A1A", "#D4A017", "#3B82F6", "#16A34A", "#A855F7", "#F59E0B", "#EC4899", "#6366F1"]

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-900">📊 Gesamtübersicht</h2><p className="text-sm text-gray-500">DJK Ottenhofen – 70-Jahr-Jubiläumsfest · 09.–12. Juli 2026</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarioTotals.map(st => {
          const meta = SCENARIO_LABELS[st.scenario]
          return (
            <div key={st.scenario} className="bg-white rounded-lg shadow border p-4" style={{ borderTopWidth: 4, borderTopColor: meta.color }}>
              <div className="text-xs font-semibold mb-3" style={{ color: meta.color }}>{meta.label}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Einnahmen:</span><span className="font-bold">{fmtEur(st.revenue)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">+ Sponsoring:</span><span className="font-bold">{fmtEur(totalSponsoring)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">− Kosten:</span><span className="font-bold text-red-600">−{fmtEur(totalCosts)}</span></div>
                <div className="border-t pt-1 flex justify-between font-bold" style={{ borderColor: meta.color + "30" }}>
                  <span style={{ color: meta.color }}>Gewinn/Verlust:</span>
                  <span className={`text-lg ${st.profit >= 0 ? "text-green-600" : "text-red-600"}`}>{st.profit >= 0 ? "+" : ""}{fmtEur(st.profit)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border p-5">
          <h3 className="font-bold text-gray-900 mb-4">Umsatz nach Tag</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueByDay} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: any) => `${v.toLocaleString("de-DE")}€`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => fmtEur(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {scenarios.map(sc => <Bar key={sc} dataKey={SCENARIO_LABELS[sc].label} fill={SCENARIO_LABELS[sc].color} radius={[3, 3, 0, 0]} opacity={0.8} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg shadow border p-5">
          <h3 className="font-bold text-gray-900 mb-4">Kostenverteilung</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={costPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} style={{ fontSize: 11 }}>
                {costPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => fmtEur(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow border p-5">
        <h3 className="font-bold text-gray-900 mb-4">Detail nach Tag (Realistisch)</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b-2 border-gray-200 text-xs text-gray-500"><th className="text-left py-2 px-2">Tag</th><th className="text-right py-2 px-2">Besucher</th><th className="text-right py-2 px-2">Getränke</th><th className="text-right py-2 px-2">Umsatz</th></tr></thead>
          <tbody>
            {state.days.map(d => { const rev = calcDayRevenue(d.id, "realistic"); return (
              <tr key={d.id} className="border-b"><td className="py-2 px-2 font-semibold">{d.name.substring(0, 2)}. {d.date.substring(0, 5)}</td><td className="py-2 px-2 text-right">{fmtNum(rev.visitors)}</td><td className="py-2 px-2 text-right">{fmtNum(rev.drinks)}</td><td className="py-2 px-2 text-right font-bold">{fmtEur(rev.total)}</td></tr>
            )})}
            <tr className="border-t-2 border-blue-500 font-bold">
              <td className="py-2 px-2 text-blue-700">Gesamt</td>
              <td className="py-2 px-2 text-right">{fmtNum(state.days.reduce((s, d) => s + calcDayRevenue(d.id, "realistic").visitors, 0))}</td>
              <td className="py-2 px-2 text-right">{fmtNum(state.days.reduce((s, d) => s + calcDayRevenue(d.id, "realistic").drinks, 0))}</td>
              <td className="py-2 px-2 text-right text-blue-700">{fmtEur(state.days.reduce((s, d) => s + calcDayRevenue(d.id, "realistic").total, 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── MAIN PAGE ──
const TABS = [
  { id: "planung", label: "Tagesplanung", icon: "📋" },
  { id: "ist", label: "Ist-Zahlen", icon: "📝" },
  { id: "preisliste", label: "Preisliste", icon: "💰" },
  { id: "kosten", label: "Kosten", icon: "💸" },
  { id: "sponsoring", label: "Sponsoring", icon: "🤝" },
  { id: "uebersicht", label: "Übersicht", icon: "📊" },
]

export default function PlanerPage() {
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
      <div className="bg-gray-900 -mx-4 -mt-6 px-4 pt-6 pb-4 mb-6 rounded-b-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
            <h1 className="text-2xl font-bold text-white">🎪 70-Jahr-Jubiläumsfest – Planer</h1>
            <p className="text-gray-400 text-sm">09. – 12. Juli 2026 · Umsatz- & Kostenplanung</p>
          </div>
          <div className="flex gap-2">
            <button onClick={saveState} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${saving ? "bg-yellow-500 text-black border-yellow-500" : "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"}`}>
              {saving ? "✓ Gespeichert" : "💾 Speichern"}
            </button>
            <button onClick={resetAll} className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-400 text-sm hover:bg-gray-800">↺</button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === t.id ? "bg-white text-gray-900" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "planung" && <DayPlanning state={state} setState={setState} />}
      {activeTab === "ist" && <ActualNumbers state={state} setState={setState} />}
      {activeTab === "preisliste" && <PriceList state={state} setState={setState} />}
      {activeTab === "kosten" && <CostsTab state={state} setState={setState} />}
      {activeTab === "sponsoring" && <SponsoringTab state={state} setState={setState} />}
      {activeTab === "uebersicht" && <OverviewTab state={state} />}
    </div>
  )
}
