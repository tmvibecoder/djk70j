'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { COUNT_SESSIONS } from '@/types'

interface Product {
  id: string
  name: string
  purchasePrice: number
  unit: string
  category: string
  packSize: number
  packLabel: string | null
}

interface SummaryItem {
  product: Product
  currentStock: number
  baselineStock: number
  consumption: number
  countedSessions: number
  stockValue: number
  consumptionValue: number
  sessions: Record<string, { quantity: number; packs: number | null; loose: number | null }>
}

interface Summary {
  products: SummaryItem[]
  totals: { stockValue: number; consumptionValue: number; deliveredValue: number; consumption: number }
}

type Entry = { packs: string; loose: string; qty: string }

const CATEGORY_ICONS: Record<string, string> = {
  'Spirituosen & Aperitif': '🥃',
  'Alkoholfrei': '🥤',
}

function entryTotal(p: Product, e?: Entry): number {
  if (!e) return 0
  if (p.packSize > 0) {
    const packs = parseFloat(e.packs || '0') || 0
    const loose = parseFloat(e.loose || '0') || 0
    return packs * p.packSize + loose
  }
  return parseFloat(e.qty || '0') || 0
}

function hasValue(p: Product, e?: Entry): boolean {
  if (!e) return false
  if (p.packSize > 0) return (e.packs !== '' && e.packs != null) || (e.loose !== '' && e.loose != null)
  return e.qty !== '' && e.qty != null
}

export default function InventurPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<string>('freitag')
  const [entries, setEntries] = useState<Record<string, Entry>>({})
  const [viewMode, setViewMode] = useState<'entry' | 'summary'>('entry')
  const [mode, setMode] = useState<'list' | 'tour'>('list')
  const [blind, setBlind] = useState(true)
  const [tourIdx, setTourIdx] = useState(0)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const entriesRef = useRef(entries)
  entriesRef.current = entries
  const productsRef = useRef(products)
  productsRef.current = products
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadData = useCallback(async () => {
    const [productsRes, summaryRes, invRes] = await Promise.all([
      fetch('/api/products?inventory=true'),
      fetch('/api/inventory/summary'),
      fetch(`/api/inventory?session=${session}`),
    ])
    const productsData: Product[] = await productsRes.json()
    const summaryData: Summary = await summaryRes.json()
    const invData: Array<{ productId: string; quantity: number; packs: number | null; loose: number | null }> = await invRes.json()

    const newEntries: Record<string, Entry> = {}
    for (const inv of invData) {
      newEntries[inv.productId] = {
        packs: inv.packs != null ? String(inv.packs) : '',
        loose: inv.loose != null ? String(inv.loose) : '',
        qty: inv.quantity != null ? String(inv.quantity) : '',
      }
    }
    setProducts(productsData)
    setSummary(summaryData)
    setEntries(newEntries)
    setLoading(false)
  }, [session])

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [loadData])

  const doSave = useCallback(async () => {
    const ps = productsRef.current
    const es = entriesRef.current
    const toSave = ps
      .filter((p) => hasValue(p, es[p.id]))
      .map((p) => {
        const e = es[p.id]
        const total = entryTotal(p, e)
        return {
          productId: p.id,
          quantity: total,
          packs: p.packSize > 0 ? (parseFloat(e.packs || '0') || 0) : null,
          loose: p.packSize > 0 ? (parseFloat(e.loose || '0') || 0) : total,
        }
      })
    if (toSave.length === 0) {
      setSaveStatus('idle')
      return
    }
    setSaveStatus('saving')
    try {
      await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: toSave, session }),
      })
      setSaveStatus('saved')
      fetch('/api/inventory/summary').then((r) => r.json()).then(setSummary).catch(() => {})
      setTimeout(() => setSaveStatus('idle'), 1500)
    } catch {
      setSaveStatus('idle')
    }
  }, [session])

  const scheduleSave = useCallback(() => {
    setSaveStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(doSave, 700)
  }, [doSave])

  const setField = (productId: string, field: keyof Entry, value: string) => {
    setEntries((prev) => {
      const base: Entry = prev[productId] ?? { packs: '', loose: '', qty: '' }
      return { ...prev, [productId]: { ...base, [field]: value } }
    })
    scheduleSave()
  }

  const stepField = (p: Product, field: keyof Entry, delta: number) => {
    setEntries((prev) => {
      const cur = prev[p.id] || { packs: '', loose: '', qty: '' }
      const v = Math.max(0, (parseFloat(cur[field] || '0') || 0) + delta)
      return { ...prev, [p.id]: { ...cur, [field]: String(v) } }
    })
    scheduleSave()
  }

  const sessionLabel = COUNT_SESSIONS.find((s) => s.key === session)?.label ?? session
  const filledCount = products.filter((p) => hasValue(p, entries[p.id])).length
  const sumItem = (id: string) => summary?.products.find((s) => s.product.id === id)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Laden...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* View toggle: Erfassung / Übersicht */}
      <div className="bg-white rounded-lg shadow-sm border p-1 flex gap-1">
        <button onClick={() => setViewMode('entry')} className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${viewMode === 'entry' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Erfassung</button>
        <button onClick={() => setViewMode('summary')} className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${viewMode === 'summary' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Übersicht</button>
      </div>

      {viewMode === 'entry' ? (
        <>
          {/* Session chips */}
          <div>
            <div className="text-[11px] font-medium uppercase text-gray-400 mb-1.5 px-0.5">Zählzeitpunkt</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {COUNT_SESSIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => { setSession(s.key); setTourIdx(0) }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${session === s.key ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {s.short}
                </button>
              ))}
            </div>
          </div>

          {/* Controls: Liste/Tour + Blind + Save status */}
          <div className="flex items-center justify-between gap-2">
            <div className="bg-white rounded-lg shadow-sm border p-1 flex gap-1">
              <button onClick={() => setMode('list')} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${mode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}>Liste</button>
              <button onClick={() => setMode('tour')} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${mode === 'tour' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}>Helfer-Tour</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium" aria-live="polite">
                {saveStatus === 'saving' ? <span className="text-amber-500">Speichere…</span> : saveStatus === 'saved' ? <span className="text-green-600">✓ gespeichert</span> : <span className="text-gray-400">autom. gespeichert</span>}
              </span>
              <button
                onClick={() => setBlind((b) => !b)}
                className="flex items-center gap-1 text-[11px] font-medium border rounded-full px-2.5 py-1.5 text-gray-600 hover:bg-gray-50"
                aria-pressed={!blind}
              >
                {blind ? 'Soll: aus' : 'Soll: an'}
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
              <div className="text-[10px] text-gray-500 font-medium uppercase">Erfasst · {sessionLabel}</div>
              <div className="text-xl font-bold text-green-600">{filledCount}<span className="text-sm text-gray-400 font-normal"> / {products.length}</span></div>
            </div>
            <div className={`rounded-lg p-3 text-center ${products.length - filledCount > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
              <div className={`text-[10px] font-medium uppercase ${products.length - filledCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>{products.length - filledCount > 0 ? 'Offen' : 'Komplett'}</div>
              <div className={`text-xl font-bold ${products.length - filledCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>{products.length - filledCount > 0 ? products.length - filledCount : '✓'}</div>
            </div>
          </div>

          {mode === 'list' ? renderList() : renderTour()}
        </>
      ) : (
        renderSummary()
      )}
    </div>
  )

  // ─── Listen-Modus ──────────────────────────────────────────────
  function renderList() {
    const cats = Array.from(new Set(products.map((p) => p.category)))
    return (
      <>
        {cats.map((cat) => {
          const items = products.filter((p) => p.category === cat)
          return (
            <div key={cat} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 border-b px-4 py-3 flex items-center gap-2">
                <span className="text-lg">{CATEGORY_ICONS[cat] || '📦'}</span>
                <h3 className="font-semibold text-gray-900 text-sm">{cat}</h3>
              </div>
              <div className="divide-y">
                {items.map((p) => {
                  const e = entries[p.id]
                  const filled = hasValue(p, e)
                  const total = entryTotal(p, e)
                  const si = sumItem(p.id)
                  return (
                    <div key={p.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">{p.name}</div>
                          <div className="text-xs mt-0.5 text-gray-400">
                            {p.packSize > 0 ? `${p.packLabel || 'Träger'} à ${p.packSize}` : 'Einzelflaschen'}
                            {!blind && si ? <span className="text-gray-500"> · Anlieferung {si.baselineStock}</span> : null}
                          </div>
                        </div>
                        {p.packSize > 0 ? (
                          <div className="flex items-end gap-2">
                            <div className="text-center">
                              <div className="text-[10px] text-gray-400 mb-0.5">{p.packLabel || 'Träger'}</div>
                              <input inputMode="numeric" value={e?.packs || ''} onChange={(ev) => setField(p.id, 'packs', ev.target.value)} placeholder="0" aria-label={`Träger ${p.name}`} className="w-12 h-11 border rounded-lg text-center text-base font-bold border-gray-300" />
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] text-gray-400 mb-0.5">lose</div>
                              <input inputMode="numeric" value={e?.loose || ''} onChange={(ev) => setField(p.id, 'loose', ev.target.value)} placeholder="0" aria-label={`lose Flaschen ${p.name}`} className="w-12 h-11 border rounded-lg text-center text-base font-bold border-gray-300" />
                            </div>
                            <div className="text-center min-w-[44px]">
                              <div className="text-[10px] text-gray-400 mb-0.5">= Fl</div>
                              <div className={`h-11 flex items-center justify-center text-base font-bold ${filled ? 'text-gray-900' : 'text-gray-300'}`}>{filled ? total : '—'}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => stepField(p, 'qty', -1)} aria-label="weniger" className="w-9 h-11 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg">−</button>
                            <input inputMode="numeric" value={e?.qty || ''} onChange={(ev) => setField(p.id, 'qty', ev.target.value)} placeholder="—" aria-label={`Anzahl ${p.name}`} className={`w-16 h-11 border rounded-lg text-center text-base font-bold ${filled ? 'border-gray-300' : 'border-amber-300 bg-amber-50'}`} />
                            <button onClick={() => stepField(p, 'qty', 1)} aria-label="mehr" className="w-9 h-11 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg">+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        <p className="text-center text-xs text-gray-400">Eingaben werden automatisch gespeichert.</p>
      </>
    )
  }

  // ─── Helfer-Tour (ein Getränk pro Bildschirm) ──────────────────
  function renderTour() {
    const p = products[tourIdx]
    if (!p) return null
    const e = entries[p.id]
    const total = entryTotal(p, e)
    const next = () => { doSave(); setTourIdx((i) => Math.min(products.length - 1, i + 1)) }
    const prev = () => { doSave(); setTourIdx((i) => Math.max(0, i - 1)) }
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gray-900 px-4 py-3 text-white">
          <div className="flex items-center justify-between text-xs"><span>{p.category}</span><span className="text-gray-300">{tourIdx + 1} / {products.length}</span></div>
          <div className="h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${((tourIdx + 1) / products.length) * 100}%` }} /></div>
        </div>
        <div className="px-5 py-6 text-center">
          <div className="text-xl font-bold text-gray-900">{p.name}</div>
          <div className="text-xs text-gray-400 mt-1 mb-5">{p.packSize > 0 ? `Lieferung in ${p.packLabel || 'Träger'} à ${p.packSize} — volle ${p.packLabel || 'Träger'} + lose Flaschen zählen` : 'Einzelflaschen zählen'}</div>
          {p.packSize > 0 ? (
            <div>
              <div className="flex gap-3 justify-center">
                {(['packs', 'loose'] as const).map((f) => (
                  <div key={f} className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-2">{f === 'packs' ? `volle ${p.packLabel || 'Träger'}` : 'lose Flaschen'}</div>
                    <div className="flex items-center gap-2 justify-center">
                      <button onClick={() => stepField(p, f, -1)} aria-label="weniger" className="w-10 h-10 rounded-lg bg-white border text-gray-600 text-xl font-bold">−</button>
                      <input inputMode="numeric" value={e?.[f] || ''} onChange={(ev) => setField(p.id, f, ev.target.value)} placeholder="0" className="w-12 h-11 border rounded-lg text-center text-xl font-bold" />
                      <button onClick={() => stepField(p, f, 1)} aria-label="mehr" className="w-10 h-10 rounded-lg bg-white border text-gray-600 text-xl font-bold">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-sm font-semibold text-gray-900 mt-3">= {total} Flaschen gesamt</div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => stepField(p, 'qty', -1)} aria-label="weniger" className="w-14 h-14 rounded-xl bg-gray-100 text-gray-700 text-3xl font-bold">−</button>
              <input inputMode="numeric" value={e?.qty || ''} onChange={(ev) => setField(p.id, 'qty', ev.target.value)} placeholder="0" className="w-24 h-16 border rounded-lg text-center text-3xl font-bold" />
              <button onClick={() => stepField(p, 'qty', 1)} aria-label="mehr" className="w-14 h-14 rounded-xl bg-gray-100 text-gray-700 text-3xl font-bold">+</button>
            </div>
          )}
        </div>
        <div className="flex gap-2 px-4 pb-4">
          <button onClick={prev} disabled={tourIdx === 0} className="flex-1 h-12 rounded-lg border text-sm font-semibold text-gray-700 disabled:opacity-40">← Zurück</button>
          <button onClick={next} disabled={tourIdx === products.length - 1} className="flex-1 h-12 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-40">Weiter →</button>
        </div>
      </div>
    )
  }

  // ─── Übersicht ─────────────────────────────────────────────────
  function renderSummary() {
    if (!summary) return null
    return (
      <>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
            <div className="text-[10px] text-gray-500 uppercase">Warenwert (EK)</div>
            <div className="text-lg font-bold text-gray-900">{summary.totals.stockValue.toFixed(0)} €</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
            <div className="text-[10px] text-gray-500 uppercase">Verbrauch</div>
            <div className="text-lg font-bold text-gray-900">{summary.totals.consumption} Fl</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
            <div className="text-[10px] text-gray-500 uppercase">Wert Verbrauch</div>
            <div className="text-lg font-bold text-red-600">{summary.totals.consumptionValue.toFixed(0)} €</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-3"><h3 className="font-semibold text-gray-900 text-sm">Bestand & Verbrauch je Getränk</h3></div>
          <div className="divide-y">
            {summary.products.map((item) => {
              const low = item.countedSessions >= 1 && item.currentStock <= Math.max(6, item.baselineStock * 0.1)
              const pct = item.baselineStock > 0 ? Math.min(100, Math.round((item.currentStock / item.baselineStock) * 100)) : 0
              return (
                <div key={item.product.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">
                        {item.product.name}
                        {low && <span className="ml-2 text-[11px] font-medium text-red-600">⚠ niedrig</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Anlieferung {item.baselineStock} · Verbrauch {item.consumption} Fl
                        {item.countedSessions < 2 && <span className="text-gray-400"> · noch zu wenig gezählt</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${low ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.currentStock} {item.product.unit}</span>
                      <div className="text-[11px] text-gray-400 mt-0.5">Wert {item.stockValue.toFixed(0)} €</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: low ? '#dc2626' : '#4f46e5' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <p className="text-center text-xs text-gray-400">Verbrauch = Anlieferung − zuletzt gezählter Bestand. Werte auf EK-Basis.</p>
      </>
    )
  }
}
