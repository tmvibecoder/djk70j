'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react"

const PAYMENT_STATUS = [
  { id: "before", label: "Vor dem Fest", color: "#F59E0B", icon: "⏳" },
  { id: "during", label: "Während des Fests", color: "#3B82F6", icon: "🎪" },
  { id: "after", label: "Nach dem Fest", color: "#8B5CF6", icon: "📋" },
  { id: "paid", label: "Bereits bezahlt", color: "#16A34A", icon: "✅" },
]

const COST_TYPES = [
  { id: "fix", label: "Fixkosten", color: "#DC2626", icon: "📌", description: "Bekannte, feste Beträge" },
  { id: "variabel_getraenke", label: "Variabel (Getränke)", color: "#D97706", icon: "🍺", description: "Abhängig vom Getränkeverbrauch" },
  { id: "variabel_sonstig", label: "Variabel (Sonstiges)", color: "#2563EB", icon: "📦", description: "Essen, Material, etc." },
  { id: "unklar", label: "Unklar / Geschätzt", color: "#7C3AED", icon: "❓", description: "Betrag noch nicht final" },
]

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

const DEFAULT_DAYS = [
  { id: "do", name: "Donnerstag", date: "09.07.2026", event: "Wattturnier im Festzelt", hasEntry: false, entryFee: 0 },
  { id: "fr", name: "Freitag", date: "10.07.2026", event: "Disco Party mit DJ Josch", hasEntry: true, entryFee: 5 },
  { id: "sa", name: "Samstag", date: "11.07.2026", event: "Festzeltparty mit Drunter & Drüber", hasEntry: true, entryFee: 10 },
  { id: "so", name: "Sonntag", date: "12.07.2026", event: "Bayrischer Festsonntag", hasEntry: false, entryFee: 0 },
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

const STORAGE_KEY = "djk-planer-state"

export default function KostenPage() {
  const [state, setState] = useState<AppState>(getInitialState)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setState(prev => ({ ...prev, ...JSON.parse(saved) }))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
    }, 2000)
    return () => clearTimeout(timer)
  }, [state])

  const saveState = useCallback(() => {
    setSaving(true)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
    setTimeout(() => setSaving(false), 800)
  }, [state])

  const resetAll = () => {
    if (confirm("Alle Kostendaten zurücksetzen?")) {
      const fresh = getInitialState()
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          parsed.costs = fresh.costs
          parsed.nextCostId = fresh.nextCostId
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
          setState(prev => ({ ...prev, costs: fresh.costs, nextCostId: fresh.nextCostId }))
        } else {
          setState(fresh)
        }
      } catch {
        setState(fresh)
      }
    }
  }

  const addCost = () => setState(s => ({ ...s, costs: [...s.costs, { id: s.nextCostId, name: "", projected: 0, actual: null, status: "before", costType: "fix" }], nextCostId: s.nextCostId + 1 }))
  const totalProjected = state.costs.reduce((s, c) => s + (c.projected || 0), 0)
  const totalActual = state.costs.reduce((s, c) => s + (c.actual || 0), 0)
  const hasActuals = state.costs.some(c => c.actual !== null)

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 -mx-4 -mt-6 px-4 pt-6 pb-4 mb-6 rounded-b-lg">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
            <h1 className="text-2xl font-bold text-white">💸 Kostenplanung</h1>
            <p className="text-gray-400 text-sm">Prognostizierte und tatsächliche Kosten</p>
          </div>
          <div className="flex gap-2">
            <button onClick={saveState} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${saving ? "bg-yellow-500 text-black border-yellow-500" : "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"}`}>
              {saving ? "✓ Gespeichert" : "💾 Speichern"}
            </button>
            <button onClick={resetAll} className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-400 text-sm hover:bg-gray-800">↺</button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">💸 Kostenplanung</h2>
          <p className="text-sm text-gray-600">Prognostizierte und tatsächliche Kosten</p>
        </div>
        <button onClick={addCost} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Position</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow border p-4 text-center"><div className="text-xs text-gray-700 font-medium">Prognostiziert</div><div className="text-2xl font-bold text-red-600">{fmtEur(totalProjected)}</div></div>
        <div className="bg-white rounded-lg shadow border p-4 text-center"><div className="text-xs text-gray-700 font-medium">Tatsächlich</div><div className="text-2xl font-bold text-gray-900">{hasActuals ? fmtEur(totalActual) : "–"}</div></div>
        {hasActuals && <div className={`rounded-lg shadow border p-4 text-center ${totalActual <= totalProjected ? "bg-green-50" : "bg-red-50"}`}><div className="text-xs text-gray-700 font-medium">Differenz</div><div className={`text-2xl font-bold ${totalActual <= totalProjected ? "text-green-600" : "text-red-600"}`}>{(totalProjected - totalActual >= 0 ? "+" : "")}{fmtEur(totalProjected - totalActual)}</div></div>}
      </div>

      <div className="bg-white rounded-lg shadow border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Position</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Kostenart</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Prognose (€)</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Tatsächlich (€)</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Zahlung</th>
            <th className="px-4 py-3 w-10"></th>
          </tr></thead>
          <tbody className="divide-y">
            {state.costs.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-2"><input value={c.name} onChange={e => setState(s => ({ ...s, costs: s.costs.map(cc => cc.id === c.id ? { ...cc, name: e.target.value } : cc) }))} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Kostenposition" /></td>
                <td className="px-4 py-2"><select value={(c as any).costType || "fix"} onChange={e => setState(s => ({ ...s, costs: s.costs.map(cc => cc.id === c.id ? { ...cc, costType: e.target.value } : cc) }))} className="border border-gray-300 rounded px-2 py-1 text-sm">{COST_TYPES.map(ct => <option key={ct.id} value={ct.id}>{ct.icon} {ct.label}</option>)}</select></td>
                <td className="px-4 py-2"><NumInput value={c.projected} onChange={v => setState(s => ({ ...s, costs: s.costs.map(cc => cc.id === c.id ? { ...cc, projected: v ?? 0 } : cc) }))} prefix="€" step={10} /></td>
                <td className="px-4 py-2"><NumInput value={c.actual} onChange={v => setState(s => ({ ...s, costs: s.costs.map(cc => cc.id === c.id ? { ...cc, actual: v } : cc) }))} prefix="€" step={10} placeholder="–" /></td>
                <td className="px-4 py-2"><select value={c.status} onChange={e => setState(s => ({ ...s, costs: s.costs.map(cc => cc.id === c.id ? { ...cc, status: e.target.value } : cc) }))} className="border border-gray-300 rounded px-2 py-1 text-sm">{PAYMENT_STATUS.map(ps => <option key={ps.id} value={ps.id}>{ps.icon} {ps.label}</option>)}</select></td>
                <td className="px-4 py-2"><button onClick={() => setState(s => ({ ...s, costs: s.costs.filter(cc => cc.id !== c.id) }))} className="text-red-500 hover:text-red-700">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kostenart-Übersicht */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Nach Kostenart</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {COST_TYPES.map(ct => {
            const items = state.costs.filter(c => (c as any).costType === ct.id || (!((c as any).costType) && ct.id === "fix"))
            const total = items.reduce((s, c) => s + (c.projected || 0), 0)
            return (
              <div key={ct.id} className="bg-white rounded-lg shadow border p-3" style={{ borderLeftWidth: 4, borderLeftColor: ct.color }}>
                <div className="text-xs font-semibold text-gray-800">{ct.icon} {ct.label}</div>
                <div className="text-lg font-bold" style={{ color: ct.color }}>{fmtEur(total)}</div>
                <div className="text-xs text-gray-500">{ct.description}</div>
                <div className="text-xs text-gray-600 mt-1">{items.length} Position{items.length !== 1 ? "en" : ""}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Zahlungsstatus-Übersicht */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Nach Zahlungsstatus</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PAYMENT_STATUS.map(ps => {
            const items = state.costs.filter(c => c.status === ps.id)
            const total = items.reduce((s, c) => s + (c.projected || 0), 0)
            return (
              <div key={ps.id} className="bg-white rounded-lg shadow border p-3" style={{ borderLeftWidth: 4, borderLeftColor: ps.color }}>
                <div className="text-xs font-semibold text-gray-800">{ps.icon} {ps.label}</div>
                <div className="text-lg font-bold" style={{ color: ps.color }}>{fmtEur(total)}</div>
                <div className="text-xs text-gray-600">{items.length} Position{items.length !== 1 ? "en" : ""}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
