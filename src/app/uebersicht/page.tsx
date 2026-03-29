'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react"
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


const SCENARIO_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  conservative: { label: "Konservativ", color: "#6B7280", bg: "#F3F4F6" },
  realistic: { label: "Realistisch", color: "#2563EB", bg: "#EFF6FF" },
  optimistic: { label: "Optimistisch", color: "#16A34A", bg: "#F0FDF4" },
}

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

const fmtEur = (v: number) => v.toLocaleString("de-DE", { style: "currency", currency: "EUR" })
const fmtNum = (v: number) => v.toLocaleString("de-DE")

const STORAGE_KEY = "djk-planer-state"

const PIE_COLORS = ["#1A1A1A", "#D4A017", "#3B82F6", "#16A34A", "#A855F7", "#F59E0B", "#EC4899", "#6366F1"]

export default function UebersichtPage() {
  const [state, setState] = useState<AppState>(getInitialState)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setState(prev => ({ ...prev, ...JSON.parse(saved) }))
    } catch { /* ignore */ }
  }, [])

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

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 -mx-4 -mt-16 lg:-mt-6 px-4 pt-16 lg:pt-6 pb-4 mb-6 rounded-b-lg">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
            <h1 className="text-2xl font-bold text-white">📊 Gesamtübersicht</h1>
          </div>
        </div>
      </div>

      <div><h2 className="text-xl font-bold text-gray-900">📊 Gesamtübersicht</h2></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarioTotals.map(st => {
          const meta = SCENARIO_LABELS[st.scenario]
          return (
            <div key={st.scenario} className="bg-white rounded-lg shadow border p-4" style={{ borderTopWidth: 4, borderTopColor: meta.color }}>
              <div className="text-xs font-semibold mb-3" style={{ color: meta.color }}>{meta.label}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-700">Einnahmen:</span><span className="font-bold">{fmtEur(st.revenue)}</span></div>
                <div className="flex justify-between"><span className="text-gray-700">+ Sponsoring:</span><span className="font-bold">{fmtEur(totalSponsoring)}</span></div>
                <div className="flex justify-between"><span className="text-gray-700">− Kosten:</span><span className="font-bold text-red-600">−{fmtEur(totalCosts)}</span></div>
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

      <div className="bg-white rounded-lg shadow border p-5 overflow-x-auto">
        <h3 className="font-bold text-gray-900 mb-4">Detail nach Tag (Realistisch)</h3>
        <table className="w-full text-sm min-w-[400px]">
          <thead><tr className="border-b-2 border-gray-200 text-xs text-gray-700 font-medium"><th className="text-left py-2 px-2">Tag</th><th className="text-right py-2 px-2">Besucher</th><th className="text-right py-2 px-2">Getränke</th><th className="text-right py-2 px-2">Umsatz</th></tr></thead>
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
