'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, Button, Input, Select, Modal } from '@/components/ui'
import { PRODUCT_CATEGORIES, EVENT_DAYS, EVENT_DAY_LABELS } from '@/types'

interface Product {
  id: string
  name: string
  purchasePrice: number
  salePrice: number
  unit: string
  category: string
  isActive: boolean
}

interface SalesEstimate {
  productId: string
  eventDay: string
  estimatedQuantity: number
}

interface User {
  id: string
  name: string
}

interface SalesEntry {
  id: string
  productId: string
  quantity: number
  eventDay: string
  enteredBy: string | null
  user: User | null
  notes: string | null
  createdAt: string
  updatedAt: string
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

const DAY_SHORT: Record<string, string> = {
  thursday: 'Do',
  friday: 'Fr',
  saturday: 'Sa',
  sunday: 'So',
}

export default function VerkaufPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [estimates, setEstimates] = useState<Record<string, number>>({})
  const [salesTotals, setSalesTotals] = useState<Record<string, number>>({})
  const [salesEntries, setSalesEntries] = useState<SalesEntry[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [selectedDay, setSelectedDay] = useState<string>('thursday')
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  // Sales Entry Modal
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false)
  const [salesForm, setSalesForm] = useState({
    productId: '',
    quantity: '',
    enteredBy: '',
    notes: '',
  })
  const [editingSalesEntry, setEditingSalesEntry] = useState<SalesEntry | null>(null)

  const loadData = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterCategory) params.append('category', filterCategory)

    const [productsRes, estimatesRes, salesRes, usersRes] = await Promise.all([
      fetch(`/api/products?${params}`),
      fetch(`/api/products/estimates?eventDay=${selectedDay}`),
      fetch(`/api/products/sales?eventDay=${selectedDay}`),
      fetch('/api/users'),
    ])

    const productsData = await productsRes.json()
    const estimatesData: SalesEstimate[] = await estimatesRes.json()
    const salesData = await salesRes.json()
    const usersData = await usersRes.json()

    setProducts(productsData)
    setUsers(usersData)

    const estimatesMap: Record<string, number> = {}
    for (const est of estimatesData) {
      estimatesMap[est.productId] = est.estimatedQuantity
    }
    setEstimates(estimatesMap)

    setSalesEntries(salesData.entries)
    setSalesTotals(salesData.totals)

    setLoading(false)
  }, [filterCategory, selectedDay])

  useEffect(() => {
    loadData()
  }, [loadData])

  const updateEstimate = async (productId: string, quantity: number) => {
    setEstimates((prev) => ({ ...prev, [productId]: quantity }))

    await fetch('/api/products/estimates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        eventDay: selectedDay,
        estimatedQuantity: quantity,
      }),
    })
  }

  const openSalesModal = (productId: string, entry?: SalesEntry) => {
    if (entry) {
      setEditingSalesEntry(entry)
      setSalesForm({
        productId: entry.productId,
        quantity: entry.quantity.toString(),
        enteredBy: entry.enteredBy || '',
        notes: entry.notes || '',
      })
    } else {
      setEditingSalesEntry(null)
      setSalesForm({
        productId,
        quantity: '',
        enteredBy: '',
        notes: '',
      })
    }
    setIsSalesModalOpen(true)
  }

  const handleSalesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingSalesEntry) {
      await fetch(`/api/products/sales/${editingSalesEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: salesForm.quantity,
          notes: salesForm.notes,
        }),
      })
    } else {
      await fetch('/api/products/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: salesForm.productId,
          quantity: salesForm.quantity,
          eventDay: selectedDay,
          enteredBy: salesForm.enteredBy || null,
          notes: salesForm.notes,
        }),
      })
    }

    setIsSalesModalOpen(false)
    loadData()
  }

  const deleteSalesEntry = async (id: string) => {
    if (!confirm('Eintrag wirklich löschen?')) return
    await fetch(`/api/products/sales/${id}`, { method: 'DELETE' })
    loadData()
  }

  // Calculations
  const calculateForecast = () => {
    let totalRevenue = 0
    let totalCost = 0
    let actualRevenue = 0
    let actualCost = 0

    for (const product of products) {
      const estimatedQty = estimates[product.id] || 0
      const soldQty = salesTotals[product.id] || 0

      totalRevenue += estimatedQty * product.salePrice
      totalCost += estimatedQty * product.purchasePrice
      actualRevenue += soldQty * product.salePrice
      actualCost += soldQty * product.purchasePrice
    }

    return {
      estimated: { revenue: totalRevenue, cost: totalCost, profit: totalRevenue - totalCost },
      actual: { revenue: actualRevenue, cost: actualCost, profit: actualRevenue - actualCost },
    }
  }

  const forecast = calculateForecast()

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) acc[product.category] = []
    acc[product.category].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  const sortedCategories = [...PRODUCT_CATEGORIES].filter(cat => groupedProducts[cat]?.length > 0)
  const extraCategories = Object.keys(groupedProducts).filter(cat => !(PRODUCT_CATEGORIES as readonly string[]).includes(cat))

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Laden...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Day Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {EVENT_DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDay === day
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {DAY_SHORT[day]}
          </button>
        ))}
      </div>

      {/* Day KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
          <div className="text-[10px] text-gray-500 font-medium uppercase">Umsatz {DAY_SHORT[selectedDay]}</div>
          <div className="text-lg font-bold text-gray-900">{forecast.actual.revenue.toFixed(0)} €</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
          <div className="text-[10px] text-gray-500 font-medium uppercase">Kosten</div>
          <div className="text-lg font-bold text-red-600">{forecast.actual.cost.toFixed(0)} €</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
          <div className="text-[10px] text-gray-500 font-medium uppercase">Gewinn</div>
          <div className="text-lg font-bold text-green-600">{forecast.actual.profit.toFixed(0)} €</div>
        </div>
      </div>

      {/* Forecast vs Actual Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-blue-700 mb-1">Prognose</div>
          <div className="text-lg font-bold text-blue-800">{forecast.estimated.revenue.toFixed(0)} €</div>
          <div className="text-xs text-blue-600">Gewinn: {forecast.estimated.profit.toFixed(0)} €</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-green-700 mb-1">Tatsächlich</div>
          <div className="text-lg font-bold text-green-800">{forecast.actual.revenue.toFixed(0)} €</div>
          <div className="text-xs text-green-600">Gewinn: {forecast.actual.profit.toFixed(0)} €</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-600">Kategorie:</span>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5"
        >
          <option value="">Alle</option>
          {PRODUCT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Product Sales List */}
      {[...sortedCategories, ...extraCategories].map((category) => {
        const categoryProducts = groupedProducts[category] || []
        if (categoryProducts.length === 0) return null
        const icon = CATEGORY_ICONS[category] || '📦'

        return (
          <div key={category} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gray-50 border-b px-4 py-3 flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <h3 className="font-semibold text-gray-900 text-sm">{category}</h3>
            </div>
            <div className="divide-y">
              {categoryProducts.map((product) => {
                const estQty = estimates[product.id] || 0
                const soldQty = salesTotals[product.id] || 0
                const pct = estQty > 0 ? Math.round((soldQty / estQty) * 100) : 0
                const actualRevenue = soldQty * product.salePrice
                const isExpanded = expandedProduct === product.id
                const productEntries = salesEntries.filter((e) => e.productId === product.id)

                return (
                  <div key={product.id}>
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <button
                          onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                          className="font-medium text-gray-900 text-sm text-left flex items-center gap-1"
                        >
                          <span className="text-gray-400 text-xs">{isExpanded ? '▼' : '▶'}</span>
                          {product.name}
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {soldQty}
                            {estQty > 0 && <span className="text-gray-400 font-normal text-xs"> / {estQty}</span>}
                          </span>
                          <button
                            onClick={() => openSalesModal(product.id)}
                            className="bg-green-100 text-green-700 hover:bg-green-200 px-2 py-0.5 rounded text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {estQty > 0 && (
                        <>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className={`text-xs ${pct >= 100 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                              {pct}% {pct >= 100 ? '- über Schätzung!' : 'der Schätzung'}
                            </span>
                            <span className="text-xs text-green-600 font-semibold">
                              {actualRevenue > 0 ? `${actualRevenue.toFixed(2)} €` : '–'}
                            </span>
                          </div>
                        </>
                      )}
                      {estQty === 0 && soldQty > 0 && (
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-400">Keine Schätzung</span>
                          <span className="text-xs text-green-600 font-semibold">{actualRevenue.toFixed(2)} €</span>
                        </div>
                      )}
                      {estQty === 0 && soldQty === 0 && (
                        <div className="flex justify-between mt-1 items-center">
                          <span className="text-xs text-gray-400">Schätzung:</span>
                          <input
                            type="number"
                            min="0"
                            value={estQty || ''}
                            onChange={(e) => updateEstimate(product.id, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-xs"
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>

                    {/* Expanded Sales Log */}
                    {isExpanded && (
                      <div className="bg-gray-50 px-4 py-3 border-t">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-800 text-xs uppercase tracking-wider">Verkaufsprotokoll</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Schätzung:</span>
                            <input
                              type="number"
                              min="0"
                              value={estQty || ''}
                              onChange={(e) => updateEstimate(product.id, parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-xs"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {productEntries.length === 0 ? (
                          <p className="text-gray-500 text-xs italic">Noch keine Einträge</p>
                        ) : (
                          <div className="space-y-2">
                            {productEntries.map((entry) => (
                              <div key={entry.id} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border">
                                <div>
                                  <span className="font-bold text-gray-900">{entry.quantity} {product.unit}</span>
                                  <span className="text-gray-400 ml-2">{formatDateTime(entry.createdAt)}</span>
                                  {entry.user && <span className="text-gray-500 ml-2">von {entry.user.name}</span>}
                                  {entry.notes && <span className="text-gray-400 ml-2">· {entry.notes}</span>}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button onClick={() => openSalesModal(product.id, entry)} className="text-blue-600 hover:text-blue-800">
                                    Bearbeiten
                                  </button>
                                  <button onClick={() => deleteSalesEntry(entry.id)} className="text-red-600 hover:text-red-800">
                                    Löschen
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => openSalesModal(product.id)}
                          className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          + Eintrag hinzufügen
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {products.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-700 mb-2">Noch keine Produkte vorhanden.</p>
            <p className="text-gray-500 text-sm mb-4">Lege zuerst Produkte im Katalog an.</p>
          </CardContent>
        </Card>
      )}

      {/* Sales Entry Modal */}
      <Modal
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        title={editingSalesEntry ? 'Eintrag bearbeiten' : 'Verkauf eintragen'}
      >
        <form onSubmit={handleSalesSubmit} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700">
              Produkt: <span className="font-medium text-gray-900">
                {products.find((p) => p.id === salesForm.productId)?.name}
              </span>
            </p>
            <p className="text-sm text-gray-700">
              Tag: <span className="font-medium text-gray-900">{EVENT_DAY_LABELS[selectedDay as keyof typeof EVENT_DAY_LABELS]}</span>
            </p>
          </div>
          <Input
            label="Verkaufte Menge"
            type="number"
            min="1"
            value={salesForm.quantity}
            onChange={(e) => setSalesForm({ ...salesForm, quantity: e.target.value })}
            placeholder="z.B. 50"
            required
          />
          {!editingSalesEntry && (
            <Select
              label="Erfasst von"
              value={salesForm.enteredBy}
              onChange={(e) => setSalesForm({ ...salesForm, enteredBy: e.target.value })}
              options={[
                { value: '', label: 'Anonym' },
                ...users.map((u) => ({ value: u.id, label: u.name })),
              ]}
            />
          )}
          <Input
            label="Notiz (optional)"
            value={salesForm.notes}
            onChange={(e) => setSalesForm({ ...salesForm, notes: e.target.value })}
            placeholder="z.B. Nachmittags-Schicht"
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsSalesModalOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit">
              {editingSalesEntry ? 'Speichern' : 'Eintragen'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
