'use client'

import { useState, useEffect, useCallback } from 'react'

interface SimpleForecast {
  id?: string
  eventDay: string
  scenario: string
  visitors: number
  revenuePerPerson: number
  entryFee: number
  costPercent: number
}

const EVENT_DAYS = [
  { key: 'thursday', label: 'Donnerstag', short: 'Do', date: '09.07.', event: 'Watt-Turnier', icon: '🃏' },
  { key: 'friday', label: 'Freitag', short: 'Fr', date: '10.07.', event: 'Disco-Party mit DJ Josh', icon: '🎶' },
  { key: 'saturday_day', label: 'Samstag Festprogramm', short: 'Sa☀️', date: '11.07.', event: 'Jugendturnier & Kindernachmittag', icon: '⚽' },
  { key: 'saturday_night', label: 'Samstag Festzeltparty', short: 'Sa🌙', date: '11.07.', event: 'Drunter & Drüber + DJ', icon: '🎉' },
  { key: 'sunday', label: 'Sonntag', short: 'So', date: '12.07.', event: 'Bayrischer Festsonntag', icon: '⛪' },
]

const SCENARIOS = [
  { key: 'pessimistic', label: 'Pessimistisch', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', headerBg: 'bg-red-600' },
  { key: 'realistic', label: 'Realistisch', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300', headerBg: 'bg-blue-600' },
  { key: 'optimistic', label: 'Optimistisch', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', headerBg: 'bg-green-600' },
]

const fmtEur = (v: number) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
const fmtNum = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 0 })

// Defaults
const DEFAULTS: Record<string, Record<string, { visitors: number; revenuePerPerson: number; entryFee: number; costPercent: number }>> = {
  thursday:       { pessimistic: { visitors: 100, revenuePerPerson: 10, entryFee: 0, costPercent: 25 }, realistic: { visitors: 150, revenuePerPerson: 15, entryFee: 0, costPercent: 25 }, optimistic: { visitors: 200, revenuePerPerson: 20, entryFee: 0, costPercent: 25 } },
  friday:         { pessimistic: { visitors: 200, revenuePerPerson: 20, entryFee: 5, costPercent: 25 }, realistic: { visitors: 300, revenuePerPerson: 30, entryFee: 5, costPercent: 25 }, optimistic: { visitors: 400, revenuePerPerson: 40, entryFee: 5, costPercent: 25 } },
  saturday_day:   { pessimistic: { visitors: 150, revenuePerPerson: 10, entryFee: 0, costPercent: 25 }, realistic: { visitors: 300, revenuePerPerson: 15, entryFee: 0, costPercent: 25 }, optimistic: { visitors: 400, revenuePerPerson: 20, entryFee: 0, costPercent: 25 } },
  saturday_night: { pessimistic: { visitors: 300, revenuePerPerson: 20, entryFee: 10, costPercent: 25 }, realistic: { visitors: 400, revenuePerPerson: 30, entryFee: 10, costPercent: 25 }, optimistic: { visitors: 500, revenuePerPerson: 40, entryFee: 10, costPercent: 25 } },
  sunday:         { pessimistic: { visitors: 100, revenuePerPerson: 20, entryFee: 0, costPercent: 25 }, realistic: { visitors: 200, revenuePerPerson: 30, entryFee: 0, costPercent: 25 }, optimistic: { visitors: 300, revenuePerPerson: 40, entryFee: 0, costPercent: 25 } },
}

export default function PrognosePage() {
  const [forecasts, setForecasts] = useState<SimpleForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState('realistic')
  const [localEdits, setLocalEdits] = useState<Record<string, SimpleForecast>>({})

  const load = useCallback(async () => {
    const res = await fetch('/api/simple-forecast')
    const data: SimpleForecast[] = await res.json()
    setForecasts(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const getEntry = (day: string, scenario: string): SimpleForecast => {
    const key = `${day}-${scenario}`
    if (localEdits[key]) return localEdits[key]
    const saved = forecasts.find(f => f.eventDay === day && f.scenario === scenario)
    if (saved) return saved
    const def = DEFAULTS[day]?.[scenario]
    return { eventDay: day, scenario, visitors: def?.visitors || 0, revenuePerPerson: def?.revenuePerPerson || 0, entryFee: def?.entryFee || 0, costPercent: def?.costPercent || 25 }
  }

  const setField = (day: string, scenario: string, field: keyof SimpleForecast, value: number) => {
    const key = `${day}-${scenario}`
    const current = getEntry(day, scenario)
    setLocalEdits(prev => ({ ...prev, [key]: { ...current, [field]: value } }))
  }

  const hasChanges = Object.keys(localEdits).length > 0

  const saveAll = async () => {
    setSaving(true)
    for (const entry of Object.values(localEdits)) {
      await fetch('/api/simple-forecast', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
    }
    setLocalEdits({})
    await load()
    setSaving(false)
  }

  // Seed defaults if DB is empty
  const seedDefaults = async () => {
    setSaving(true)
    for (const day of EVENT_DAYS) {
      for (const sc of SCENARIOS) {
        const def = DEFAULTS[day.key]?.[sc.key]
        if (def) {
          await fetch('/api/simple-forecast', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventDay: day.key, scenario: sc.key, ...def }),
          })
        }
      }
    }
    setLocalEdits({})
    await load()
    setSaving(false)
  }

  // Calculations
  const calc = (day: string, scenario: string) => {
    const e = getEntry(day, scenario)
    const umsatz = e.visitors * e.revenuePerPerson
    const eintritt = e.visitors * e.entryFee
    const wareneinsatz = umsatz * (e.costPercent / 100)
    const rohertrag = umsatz - wareneinsatz + eintritt
    return { ...e, umsatz, eintritt, wareneinsatz, rohertrag }
  }

  const calcScenarioTotal = (scenario: string) => {
    let visitors = 0, umsatz = 0, eintritt = 0, wareneinsatz = 0, rohertrag = 0
    for (const day of EVENT_DAYS) {
      const c = calc(day.key, scenario)
      visitors += c.visitors
      umsatz += c.umsatz
      eintritt += c.eintritt
      wareneinsatz += c.wareneinsatz
      rohertrag += c.rohertrag
    }
    return { visitors, umsatz, eintritt, wareneinsatz, rohertrag, avgRevenuePerPerson: visitors > 0 ? umsatz / visitors : 0 }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Laden...</div></div>

  const currentScenario = SCENARIOS.find(s => s.key === selectedScenario)!
  const isEmpty = forecasts.length === 0 && Object.keys(localEdits).length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 -mx-4 -mt-16 lg:-mt-6 px-4 pt-16 lg:pt-6 pb-4 mb-6 rounded-b-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
            <h1 className="text-2xl font-bold text-white">Prognose</h1>
            <p className="text-sm text-gray-400 mt-1">Besucher × Umsatz/Person × Marge</p>
          </div>
          <div className="flex gap-2">
            {isEmpty && (
              <button onClick={seedDefaults} disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700">
                Standardwerte laden
              </button>
            )}
            <button onClick={saveAll} disabled={!hasChanges || saving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}>
              {saving ? 'Speichern...' : hasChanges ? 'Speichern' : 'Gespeichert'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ ERGEBNISSE ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Ergebnisse — Szenario-Vergleich</h2>
        </div>

        {/* 3 Szenario-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCENARIOS.map(sc => {
            const t = calcScenarioTotal(sc.key)
            return (
              <div key={sc.key} className={`bg-white rounded-xl border-2 overflow-hidden ${
                selectedScenario === sc.key ? sc.border + ' shadow-lg' : 'border-gray-200'
              }`}>
                <div className={`${sc.headerBg} px-5 py-3`}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/80">{sc.label}</div>
                  <div className="text-2xl font-bold text-white mt-0.5">{fmtEur(t.rohertrag)}</div>
                  <div className="text-xs text-white/70">Rohertrag (Umsatz − Wareneinsatz + Eintritt)</div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-[10px] font-semibold text-gray-500 uppercase">Besucher gesamt</div>
                      <div className="text-lg font-bold text-gray-900">{fmtNum(t.visitors)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-[10px] font-semibold text-gray-500 uppercase">Ø Umsatz/Person</div>
                      <div className="text-lg font-bold text-gray-900">{fmtEur(t.avgRevenuePerPerson)}</div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Getränke/Essen</span><span className="font-medium">{fmtEur(t.umsatz)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Eintritt</span><span className="font-medium">{fmtEur(t.eintritt)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Wareneinsatz (25%)</span><span className="font-medium text-red-600">−{fmtEur(t.wareneinsatz)}</span></div>
                    <div className="flex justify-between font-bold border-t pt-1.5"><span className={sc.color}>Rohertrag</span><span className={sc.color}>{fmtEur(t.rohertrag)}</span></div>
                  </div>
                </div>
                <div className="px-5 pb-4">
                  <button onClick={() => setSelectedScenario(sc.key)}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedScenario === sc.key ? sc.headerBg + ' text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {selectedScenario === sc.key ? '✓ Ausgewählt' : 'Auswählen'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tagesvergleich Matrix */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="bg-gray-50 border-b px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Tagesvergleich</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${currentScenario.bg} ${currentScenario.color} font-bold`}>{currentScenario.label}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Tag</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Besucher</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Umsatz</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Eintritt</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Kosten</th>
                <th className="px-3 py-2.5 text-right font-medium text-emerald-600">Rohertrag</th>
              </tr>
            </thead>
            <tbody>
              {EVENT_DAYS.map(day => {
                const c = calc(day.key, selectedScenario)
                return (
                  <tr key={day.key} className="border-b">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span>{day.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">{day.label}</div>
                          <div className="text-xs text-gray-400">{day.date}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-900">{fmtNum(c.visitors)}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-900">{fmtEur(c.umsatz)}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-900">{fmtEur(c.eintritt)}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-red-600">−{fmtEur(c.wareneinsatz)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-600">{fmtEur(c.rohertrag)}</td>
                  </tr>
                )
              })}
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <td className="px-4 py-3 text-gray-900">Gesamt</td>
                {(() => { const t = calcScenarioTotal(selectedScenario); return (<>
                  <td className="px-3 py-3 text-right text-gray-900">{fmtNum(t.visitors)}</td>
                  <td className="px-3 py-3 text-right text-gray-900">{fmtEur(t.umsatz)}</td>
                  <td className="px-3 py-3 text-right text-gray-900">{fmtEur(t.eintritt)}</td>
                  <td className="px-3 py-3 text-right text-red-600">−{fmtEur(t.wareneinsatz)}</td>
                  <td className={`px-3 py-3 text-right text-lg ${currentScenario.color}`}>{fmtEur(t.rohertrag)}</td>
                </>)})()}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ EINGABE ═══ */}
      <div>
        <div className="border-t-2 border-dashed border-gray-300 my-2" />
        <div className="flex items-center gap-2 mt-4 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Eingabe — Werte pro Tag</h2>
            <p className="text-xs text-gray-500">Ergebnisse oben aktualisieren sich automatisch.</p>
          </div>
        </div>

        {/* Szenario-Auswahl */}
        <div className="flex gap-2 mb-6">
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

        {/* Eingabe-Tabelle */}
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tag</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">Besucher</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">Umsatz/Person (€)</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">Eintritt (€)</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">Kostenanteil (%)</th>
                  <th className="px-3 py-3 text-right font-medium text-emerald-600">= Rohertrag</th>
                </tr>
              </thead>
              <tbody>
                {EVENT_DAYS.map(day => {
                  const e = getEntry(day.key, selectedScenario)
                  const c = calc(day.key, selectedScenario)
                  return (
                    <tr key={day.key} className="border-b">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{day.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900 text-xs">{day.label}</div>
                            <div className="text-[10px] text-gray-400">{day.event}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input type="number" min="0" value={e.visitors || ''}
                          onChange={ev => setField(day.key, selectedScenario, 'visitors', +ev.target.value || 0)}
                          className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 text-center" />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input type="number" min="0" step="1" value={e.revenuePerPerson || ''}
                          onChange={ev => setField(day.key, selectedScenario, 'revenuePerPerson', +ev.target.value || 0)}
                          className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 text-center" />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input type="number" min="0" step="0.5" value={e.entryFee || ''}
                          onChange={ev => setField(day.key, selectedScenario, 'entryFee', +ev.target.value || 0)}
                          className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 text-center" />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input type="number" min="0" max="100" step="1" value={e.costPercent || ''}
                          onChange={ev => setField(day.key, selectedScenario, 'costPercent', +ev.target.value || 0)}
                          className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 text-center" />
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-emerald-600">{fmtEur(c.rohertrag)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                  <td className="px-4 py-3 text-gray-900">Gesamt</td>
                  <td className="px-3 py-3 text-center text-gray-900">{fmtNum(calcScenarioTotal(selectedScenario).visitors)}</td>
                  <td className="px-3 py-3 text-center text-gray-700 text-xs">Ø {fmtEur(calcScenarioTotal(selectedScenario).avgRevenuePerPerson)}</td>
                  <td className="px-3 py-3 text-center text-gray-900">{fmtEur(calcScenarioTotal(selectedScenario).eintritt)}</td>
                  <td className="px-3 py-3 text-center text-gray-500 text-xs">25%</td>
                  <td className={`px-3 py-3 text-right text-lg ${currentScenario.color}`}>{fmtEur(calcScenarioTotal(selectedScenario).rohertrag)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
