'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, Badge } from '@/components/ui'
import {
  PRODUCT_CATEGORIES,
  INVENTORY_DAYS,
  INVENTORY_DAY_SHORT,
  INVENTORY_DAY_LABELS,
  INVENTORY_START_DAY,
  STOCK_ENTRY_TYPES,
  STOCK_ENTRY_TYPE_LABELS,
  buildTimeSlots,
  type InventoryDay,
  type StockEntryType,
} from '@/types'

interface Product {
  id: string
  name: string
  purchasePrice: number
  salePrice: number
  unit: string
  category: string
  isCritical: boolean
}

interface InventoryEntry {
  productId: string
  quantity: number
  notes?: string
}

interface InventorySummary {
  product: Product
  currentStock: number
  dayData: Record<string, { start: number; end: number; delivery: number; consumption: number }>
  totalConsumption: number
  revenue: number
  cost: number
  profit: number
}

const CATEGORY_ICONS: Record<string, string> = {
  'Bier & Radler': '🍺',
  'Softdrinks': '🥤',
  'Schnaps & Shots': '🥃',
  'Longdrinks': '🍹',
  'Wein & Sekt': '🍷',
  'Warme Speisen': '🌭',
  'Snacks': '🥨',
}

export default function InventurPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [summary, setSummary] = useState<{ products: InventorySummary[]; totals: { revenue: number; cost: number; profit: number } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<InventoryDay>(INVENTORY_START_DAY)
  const [selectedType, setSelectedType] = useState<StockEntryType>('count')
  const [timeStep, setTimeStep] = useState<15 | 30>(15)
  const [selectedTime, setSelectedTime] = useState<string>('17:00')
  const [entries, setEntries] = useState<Record<string, { quantity: string; notes: string }>>({})
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'entry' | 'summary'>('entry')
  const [search, setSearch] = useState('')
  const [criticalOnly, setCriticalOnly] = useState(false)

  const timeSlots = useMemo(() => buildTimeSlots(timeStep), [timeStep])

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, selectedType, selectedTime])

  // Wenn der Takt wechselt, eine gültige Uhrzeit sicherstellen
  useEffect(() => {
    if (!timeSlots.includes(selectedTime)) {
      // auf nächstgelegenen Slot runden
      setSelectedTime(timeSlots[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeStep])

  const loadData = async () => {
    const [productsRes, summaryRes] = await Promise.all([
      fetch('/api/products?active=true'),
      fetch('/api/inventory/summary'),
    ])

    const productsData = await productsRes.json()
    const summaryData = await summaryRes.json()

    setProducts(productsData)
    setSummary(summaryData)

    const inventoryRes = await fetch(
      `/api/inventory?eventDay=${selectedDay}&type=${selectedType}&time=${encodeURIComponent(selectedTime)}`
    )
    const inventoryData = await inventoryRes.json()

    const newEntries: Record<string, { quantity: string; notes: string }> = {}
    for (const inv of inventoryData) {
      newEntries[inv.productId] = {
        quantity: inv.quantity.toString(),
        notes: inv.notes || '',
      }
    }
    setEntries(newEntries)
    setLoading(false)
  }

  const handleQuantityChange = (productId: string, value: string) => {
    setEntries((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], quantity: value, notes: prev[productId]?.notes || '' },
    }))
  }

  const handleIncrement = (productId: string, delta: number) => {
    setEntries((prev) => {
      const current = parseFloat(prev[productId]?.quantity || '0') || 0
      const newVal = Math.max(0, current + delta)
      return {
        ...prev,
        [productId]: { ...prev[productId], quantity: newVal.toString(), notes: prev[productId]?.notes || '' },
      }
    })
  }

  const toggleCritical = async (product: Product) => {
    // Optimistisch umschalten
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isCritical: !p.isCritical } : p)))
    await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, isCritical: !product.isCritical }),
    })
  }

  const handleSave = async () => {
    setSaving(true)

    const entriesToSave: InventoryEntry[] = Object.entries(entries)
      .filter(([, data]) => data.quantity !== '')
      .map(([productId, data]) => ({
        productId,
        quantity: parseFloat(data.quantity) || 0,
        notes: data.notes,
      }))

    await fetch('/api/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entries: entriesToSave,
        eventDay: selectedDay,
        type: selectedType,
        time: selectedTime,
      }),
    })

    await loadData()
    setSaving(false)
    setSavedAt(`${INVENTORY_DAY_SHORT[selectedDay]} · ${selectedTime}`)
    setTimeout(() => setSavedAt(null), 2500)
  }

  // Sichtbare Produkte nach Filter (Suche / nur kritische)
  const visibleProducts = useMemo(() => {
    return products.filter((p) => {
      if (criticalOnly && !p.isCritical) return false
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [products, criticalOnly, search])

  const criticalProducts = useMemo(() => visibleProducts.filter((p) => p.isCritical), [visibleProducts])

  // Gruppierung der nicht-kritischen (bzw. aller) Produkte nach Kategorie
  const groupedProducts = useMemo(() => {
    return visibleProducts.reduce((acc, product) => {
      if (!acc[product.category]) acc[product.category] = []
      acc[product.category].push(product)
      return acc
    }, {} as Record<string, Product[]>)
  }, [visibleProducts])

  const filledCount = visibleProducts.filter((p) => entries[p.id]?.quantity !== undefined && entries[p.id]?.quantity !== '').length
  const openCount = visibleProducts.length - filledCount

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Laden...</div>
      </div>
    )
  }

  // Eine Produkt-Zeile (wiederverwendet in kritischer Sektion + Kategorien)
  const renderProductRow = (product: Product) => {
    const summaryItem = summary?.products.find((p) => p.product.id === product.id)
    const hasValue = entries[product.id]?.quantity !== undefined && entries[product.id]?.quantity !== ''

    return (
      <div key={product.id} className={`px-4 py-3 ${product.isCritical ? 'bg-amber-50/60' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 text-sm flex items-center gap-1.5">
              <button
                onClick={() => toggleCritical(product)}
                className="shrink-0 text-base leading-none"
                title={product.isCritical ? 'Kritisch-Markierung entfernen' : 'Als kritisch markieren'}
              >
                <span className={product.isCritical ? '' : 'opacity-25 grayscale'}>⭐</span>
              </button>
              <span className="truncate">{product.name}</span>
            </div>
            <div className={`text-xs mt-0.5 ${hasValue ? 'text-gray-400' : 'text-amber-500 font-medium'}`}>
              {hasValue
                ? `Aktueller Bestand: ${summaryItem?.currentStock ?? '–'} ${product.unit}`
                : 'Noch nicht erfasst'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleIncrement(product.id, -1)}
              className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center hover:bg-gray-200 active:scale-95"
            >
              −
            </button>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={entries[product.id]?.quantity || ''}
              onChange={(e) => handleQuantityChange(product.id, e.target.value)}
              placeholder="—"
              className={`w-16 border rounded-lg px-2 py-2 text-sm text-center font-bold ${
                hasValue ? 'border-gray-300' : 'border-amber-300 bg-amber-50'
              }`}
            />
            <button
              onClick={() => handleIncrement(product.id, 1)}
              className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center hover:bg-gray-200 active:scale-95"
            >
              +
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow-sm border p-1 flex gap-1">
        <button
          onClick={() => setViewMode('entry')}
          className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
            viewMode === 'entry' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          Erfassung
        </button>
        <button
          onClick={() => setViewMode('summary')}
          className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
            viewMode === 'summary' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          Übersicht
        </button>
      </div>

      {viewMode === 'entry' ? (
        <>
          {/* Zeitpunkt: Tag-Buttons */}
          <div className="bg-white rounded-xl shadow-sm border p-3 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Zeitpunkt wählen</div>

            {/* Tage */}
            <div className="grid grid-cols-3 gap-2">
              {INVENTORY_DAYS.map((day) => {
                const isStart = day === INVENTORY_START_DAY
                const active = selectedDay === day
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`relative py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {INVENTORY_DAY_SHORT[day]}
                    {isStart && (
                      <span
                        className={`block text-[9px] font-medium leading-none mt-0.5 ${active ? 'text-indigo-100' : 'text-indigo-500'}`}
                      >
                        START
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Uhrzeit + Takt */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>
                      {t} Uhr
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-gray-100 rounded-lg p-0.5 flex shrink-0">
                {([15, 30] as const).map((step) => (
                  <button
                    key={step}
                    onClick={() => setTimeStep(step)}
                    className={`px-2.5 py-2 rounded-md text-xs font-semibold transition-all ${
                      timeStep === step ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    {step}′
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-500">
              {INVENTORY_DAY_LABELS[selectedDay]} · {selectedTime} Uhr
            </div>

            {/* Erfassungs-Art */}
            <div className="bg-gray-100 rounded-lg p-1 flex gap-1">
              {STOCK_ENTRY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                    selectedType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {STOCK_ENTRY_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Getränke-Auswahl: Suche + Filter */}
          <div className="bg-white rounded-xl shadow-sm border p-3 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Getränke zählen</div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Getränk suchen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={() => setCriticalOnly((v) => !v)}
                className={`shrink-0 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                  criticalOnly
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                ⭐ Nur kritische
              </button>
            </div>

            {/* Fortschritt */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-[10px] text-gray-500 font-medium uppercase">Erfasst</div>
                <div className="text-xl font-bold text-green-600">
                  {filledCount}<span className="text-sm text-gray-400 font-normal"> / {visibleProducts.length}</span>
                </div>
              </div>
              <div className={`rounded-lg p-3 text-center ${openCount > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                <div className={`text-[10px] font-medium uppercase ${openCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {openCount > 0 ? 'Offen' : 'Komplett'}
                </div>
                <div className={`text-xl font-bold ${openCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {openCount > 0 ? openCount : '✓'}
                </div>
              </div>
            </div>
          </div>

          {/* Kritische Getränke — oben angepinnt */}
          {!criticalOnly && criticalProducts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border-2 border-amber-300 overflow-hidden">
              <div className="bg-amber-100 border-b border-amber-200 px-4 py-3 flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <h3 className="font-semibold text-amber-900 text-sm">Kritische Getränke</h3>
                <span className="text-xs text-amber-700">({criticalProducts.length})</span>
              </div>
              <div className="divide-y divide-amber-100">
                {criticalProducts.map((product) => renderProductRow(product))}
              </div>
            </div>
          )}

          {/* Entry List nach Kategorie */}
          {PRODUCT_CATEGORIES.map((category) => {
            // kritische schon oben gezeigt (außer wenn "nur kritische" aktiv) → hier rausfiltern
            const categoryProducts = (groupedProducts[category] || []).filter((p) => criticalOnly || !p.isCritical)
            if (!categoryProducts.length) return null
            const icon = CATEGORY_ICONS[category] || '📦'

            return (
              <div key={category} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 border-b px-4 py-3 flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <h3 className="font-semibold text-gray-900 text-sm">{category}</h3>
                </div>
                <div className="divide-y">{categoryProducts.map((product) => renderProductRow(product))}</div>
              </div>
            )
          })}

          {visibleProducts.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-sm text-gray-500">
              Keine Getränke gefunden.
            </div>
          )}

          {/* Sticky Save */}
          <div className="sticky bottom-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-indigo-600 text-white rounded-xl px-4 py-3.5 text-sm font-bold shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                'Speichere...'
              ) : savedAt ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Gespeichert: {savedAt}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {INVENTORY_DAY_SHORT[selectedDay]} · {selectedTime} · {STOCK_ENTRY_TYPE_LABELS[selectedType]} speichern
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Financial Summary */}
          {summary && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
                <div className="text-xs text-gray-500">Umsatz</div>
                <div className="text-lg font-bold text-gray-900">{summary.totals.revenue.toFixed(2)} €</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
                <div className="text-xs text-gray-500">Kosten</div>
                <div className="text-lg font-bold text-red-600">{summary.totals.cost.toFixed(2)} €</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
                <div className="text-xs text-gray-500">Gewinn</div>
                <div className="text-lg font-bold text-green-600">{summary.totals.profit.toFixed(2)} €</div>
              </div>
            </div>
          )}

          {/* Consumption Table */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Verbrauch nach Produkt</h2>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {summary?.products
                  .filter((item) => item.totalConsumption > 0 || item.currentStock > 0)
                  .map((item) => (
                    <div key={item.product.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm flex items-center gap-1.5">
                            {item.product.isCritical && <span title="Kritisch">⭐</span>}
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-500">{item.product.category}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant={item.currentStock <= 5 ? 'danger' : item.currentStock <= 10 ? 'warning' : 'success'}>
                              {item.currentStock} {item.product.unit}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Verbrauch: {item.totalConsumption} · Gewinn: <span className="text-green-600 font-semibold">{item.profit.toFixed(2)} €</span>
                          </div>
                        </div>
                      </div>
                      {item.totalConsumption > 0 && (
                        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${Math.min(100, (item.totalConsumption / Math.max(...(summary?.products.map(p => p.totalConsumption) || [1]))) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
