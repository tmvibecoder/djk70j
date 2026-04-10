'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, Badge } from '@/components/ui'
import { ALL_DAYS, ALL_DAY_LABELS, INVENTORY_TYPES, INVENTORY_TYPE_LABELS, PRODUCT_CATEGORIES } from '@/types'

interface Product {
  id: string
  name: string
  purchasePrice: number
  salePrice: number
  unit: string
  category: string
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

const DAY_SHORT_LABELS: Record<string, string> = {
  monday: 'Mo',
  tuesday: 'Di',
  thursday: 'Do',
  friday: 'Fr',
  saturday: 'Sa',
  sunday: 'So',
}

export default function InventurPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [summary, setSummary] = useState<{ products: InventorySummary[]; totals: { revenue: number; cost: number; profit: number } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>('monday')
  const [selectedType, setSelectedType] = useState<string>('start')
  const [entries, setEntries] = useState<Record<string, { quantity: string; notes: string }>>({})
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'entry' | 'summary'>('entry')

  useEffect(() => {
    loadData()
  }, [selectedDay, selectedType])

  const loadData = async () => {
    const [productsRes, summaryRes] = await Promise.all([
      fetch('/api/products?active=true'),
      fetch('/api/inventory/summary'),
    ])

    const productsData = await productsRes.json()
    const summaryData = await summaryRes.json()

    setProducts(productsData)
    setSummary(summaryData)

    const inventoryRes = await fetch(`/api/inventory?eventDay=${selectedDay}&type=${selectedType}`)
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
      }),
    })

    await loadData()
    setSaving(false)
  }

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) acc[product.category] = []
    acc[product.category].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  const filledCount = Object.values(entries).filter(e => e.quantity !== '').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Laden...</div>
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
          {/* Day Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ALL_DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedDay === day
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {DAY_SHORT_LABELS[day]}
              </button>
            ))}
          </div>

          {/* Type Toggle */}
          <div className="bg-white rounded-lg shadow-sm border p-1 flex gap-1">
            {INVENTORY_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                  selectedType === type
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {INVENTORY_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          {/* Progress */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
              <div className="text-[10px] text-gray-500 font-medium uppercase">Erfasst</div>
              <div className="text-xl font-bold text-green-600">
                {filledCount}<span className="text-sm text-gray-400 font-normal"> / {products.length}</span>
              </div>
            </div>
            <div className={`rounded-lg p-3 text-center ${products.length - filledCount > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
              <div className={`text-[10px] font-medium uppercase ${products.length - filledCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {products.length - filledCount > 0 ? 'Offen' : 'Komplett'}
              </div>
              <div className={`text-xl font-bold ${products.length - filledCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {products.length - filledCount > 0 ? products.length - filledCount : '✓'}
              </div>
            </div>
          </div>

          {/* Entry List */}
          {PRODUCT_CATEGORIES.map((category) => {
            const categoryProducts = groupedProducts[category]
            if (!categoryProducts?.length) return null
            const icon = CATEGORY_ICONS[category] || '📦'

            return (
              <div key={category} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 border-b px-4 py-3 flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <h3 className="font-semibold text-gray-900 text-sm">{category}</h3>
                </div>
                <div className="divide-y">
                  {categoryProducts.map((product) => {
                    const summaryItem = summary?.products.find((p) => p.product.id === product.id)
                    const hasValue = entries[product.id]?.quantity !== undefined && entries[product.id]?.quantity !== ''

                    return (
                      <div key={product.id} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                            <div className={`text-xs mt-0.5 ${hasValue ? 'text-gray-400' : 'text-amber-500 font-medium'}`}>
                              {hasValue
                                ? `Bestand: ${summaryItem?.currentStock ?? '–'} ${product.unit}`
                                : 'Noch nicht erfasst'
                              }
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleIncrement(product.id, -1)}
                              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center hover:bg-gray-200"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={entries[product.id]?.quantity || ''}
                              onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                              placeholder="—"
                              className={`w-16 border rounded-lg px-2 py-1.5 text-sm text-center font-bold ${
                                hasValue ? 'border-gray-300' : 'border-amber-300 bg-amber-50'
                              }`}
                            />
                            <button
                              onClick={() => handleIncrement(product.id, 1)}
                              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center hover:bg-gray-200"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Sticky Save */}
          <div className="sticky bottom-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-indigo-600 text-white rounded-xl px-4 py-3.5 text-sm font-bold shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                'Speichere...'
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {ALL_DAY_LABELS[selectedDay as keyof typeof ALL_DAY_LABELS]} · {INVENTORY_TYPE_LABELS[selectedType as keyof typeof INVENTORY_TYPE_LABELS]} speichern
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
                          <p className="font-medium text-gray-900 text-sm">{item.product.name}</p>
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
