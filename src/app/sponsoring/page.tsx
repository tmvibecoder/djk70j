'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react"

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

export default function SponsoringPage() {
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
    if (confirm("Alle Sponsoring-Daten zurücksetzen?")) {
      const fresh = getInitialState()
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          parsed.sponsors = fresh.sponsors
          parsed.nextSponsorId = fresh.nextSponsorId
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
          setState(prev => ({ ...prev, sponsors: fresh.sponsors, nextSponsorId: fresh.nextSponsorId }))
        } else {
          setState(fresh)
        }
      } catch {
        setState(fresh)
      }
    }
  }

  const addSponsor = () => setState(s => ({ ...s, sponsors: [...s.sponsors, { id: s.nextSponsorId, name: "", amount: 0, received: false }], nextSponsorId: s.nextSponsorId + 1 }))
  const totalPledged = state.sponsors.reduce((s, sp) => s + (sp.amount || 0), 0)
  const totalReceived = state.sponsors.filter(sp => sp.received).reduce((s, sp) => s + (sp.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 -mx-4 -mt-6 px-4 pt-6 pb-4 mb-6 rounded-b-lg">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
            <h1 className="text-2xl font-bold text-white">🤝 Sponsoring & Zuschüsse</h1>
            <p className="text-gray-400 text-sm">Spenden und Sponsorengelder verwalten</p>
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
          <h2 className="text-xl font-bold text-gray-900">🤝 Sponsoring & Zuschüsse</h2>
          <p className="text-sm text-gray-500">Spenden und Sponsorengelder</p>
        </div>
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
