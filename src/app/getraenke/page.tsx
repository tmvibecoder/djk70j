'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, Button, Input, Select, Modal } from '@/components/ui'
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

export default function GetraenkePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [estimates, setEstimates] = useState<Record<string, number>>({})
  const [salesTotals, setSalesTotals] = useState<Record<string, number>>({})
  const [salesEntries, setSalesEntries] = useState<SalesEntry[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
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

  const [form, setForm] = useState({
    name: '',
    purchasePrice: '',
    salePrice: '',
    unit: 'Flasche',
    category: PRODUCT_CATEGORIES[0] as string,
    isActive: true,
  })

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

    // Estimates Map
    const estimatesMap: Record<string, number> = {}
    for (const est of estimatesData) {
      estimatesMap[est.productId] = est.estimatedQuantity
    }
    setEstimates(estimatesMap)

    // Sales
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

  // Sales Entry Functions
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

  // Product Functions
  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setForm({
        name: product.name,
        purchasePrice: product.purchasePrice.toString(),
        salePrice: product.salePrice.toString(),
        unit: product.unit,
        category: product.category,
        isActive: product.isActive,
      })
    } else {
      setEditingProduct(null)
      setForm({
        name: '',
        purchasePrice: '',
        salePrice: '',
        unit: 'Flasche',
        category: PRODUCT_CATEGORIES[0],
        isActive: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
    const method = editingProduct ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setIsModalOpen(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Produkt wirklich löschen?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
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
      estimated: {
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalRevenue - totalCost,
      },
      actual: {
        revenue: actualRevenue,
        cost: actualCost,
        profit: actualRevenue - actualCost,
      },
    }
  }

  const forecast = calculateForecast()

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) acc[product.category] = []
    acc[product.category].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  const categoryTotals = Object.entries(groupedProducts).reduce((acc, [category, prods]) => {
    let estRevenue = 0
    let actRevenue = 0
    for (const product of prods) {
      const estQty = estimates[product.id] || 0
      const soldQty = salesTotals[product.id] || 0
      estRevenue += estQty * product.salePrice
      actRevenue += soldQty * product.salePrice
    }
    acc[category] = { estRevenue, actRevenue }
    return acc
  }, {} as Record<string, { estRevenue: number; actRevenue: number }>)

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Getränke & Speisen</h1>
          <p className="text-gray-600">Produktkatalog, Prognose und Verkaufsprotokoll</p>
        </div>
        <Button onClick={() => openModal()}>+ Neues Produkt</Button>
      </div>

      {/* Zusammenfassung */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prognose */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <h3 className="font-semibold text-blue-800">Prognose (geplant)</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-blue-600">Umsatz</p>
                <p className="text-xl font-bold text-blue-700">{forecast.estimated.revenue.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Kosten</p>
                <p className="text-xl font-bold text-blue-700">{forecast.estimated.cost.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Gewinn</p>
                <p className="text-xl font-bold text-blue-700">{forecast.estimated.profit.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tatsächlich verkauft */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <h3 className="font-semibold text-green-800">Tatsächlich verkauft</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-green-600">Umsatz</p>
                <p className="text-xl font-bold text-green-700">{forecast.actual.revenue.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-green-600">Kosten</p>
                <p className="text-xl font-bold text-green-700">{forecast.actual.cost.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-green-600">Gewinn</p>
                <p className="text-xl font-bold text-green-700">{forecast.actual.profit.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Tag-Auswahl */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4 items-center flex-wrap">
            <span className="text-sm font-medium text-gray-700">Tag:</span>
            <div className="flex gap-1">
              {EVENT_DAYS.map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedDay(day)}
                >
                  {EVENT_DAY_LABELS[day]}
                </Button>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700 ml-4">Kategorie:</span>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={[
                { value: '', label: 'Alle' },
                ...PRODUCT_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
              ]}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Produktliste */}
      {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
              {categoryTotals[category] && (
                <div className="text-sm">
                  <span className="text-blue-600">Prognose: {categoryTotals[category].estRevenue.toFixed(2)} €</span>
                  <span className="mx-2">|</span>
                  <span className="text-green-600">Verkauft: {categoryTotals[category].actRevenue.toFixed(2)} €</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">VK</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Marge</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Erw. Verkauf</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24 bg-green-50">Verkauft</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Erw. Umsatz</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-green-50">Ist-Umsatz</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categoryProducts.map((product) => {
                  const margin = product.salePrice - product.purchasePrice
                  const estQty = estimates[product.id] || 0
                  const soldQty = salesTotals[product.id] || 0
                  const expectedRevenue = estQty * product.salePrice
                  const actualRevenue = soldQty * product.salePrice
                  const isExpanded = expandedProduct === product.id
                  const productEntries = salesEntries.filter((e) => e.productId === product.id)

                  return (
                    <>
                      <tr key={product.id} className={!product.isActive ? 'bg-gray-50 opacity-60' : ''}>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? '▼' : '▶'}
                          </button>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="font-medium text-gray-900">{product.name}</span>
                          <span className="text-gray-400 text-sm ml-1">({product.unit})</span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right font-medium text-gray-900">
                          {product.salePrice.toFixed(2)} €
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-green-600 text-sm">
                          +{margin.toFixed(2)} €
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          <input
                            type="number"
                            min="0"
                            value={estQty || ''}
                            onChange={(e) => updateEstimate(product.id, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center bg-green-50">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-bold text-green-700">{soldQty}</span>
                            <button
                              onClick={() => openSalesModal(product.id)}
                              className="text-green-600 hover:text-green-800 text-lg font-bold"
                              title="Verkauf eintragen"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-blue-600">
                          {expectedRevenue > 0 ? `${expectedRevenue.toFixed(2)} €` : '-'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-green-600 font-medium bg-green-50">
                          {actualRevenue > 0 ? `${actualRevenue.toFixed(2)} €` : '-'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right">
                          <Button variant="ghost" size="sm" onClick={() => openModal(product)}>
                            Bearbeiten
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-red-600">
                            ×
                          </Button>
                        </td>
                      </tr>
                      {/* Expandierte Zeile mit Verkaufsprotokoll */}
                      {isExpanded && (
                        <tr key={`${product.id}-expanded`}>
                          <td colSpan={9} className="bg-gray-50 px-6 py-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium text-gray-700">Verkaufsprotokoll</h4>
                                <Button size="sm" onClick={() => openSalesModal(product.id)}>
                                  + Eintrag hinzufügen
                                </Button>
                              </div>
                              {productEntries.length === 0 ? (
                                <p className="text-gray-500 text-sm italic">Noch keine Einträge vorhanden</p>
                              ) : (
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-gray-500">
                                      <th className="pb-2">Zeitpunkt</th>
                                      <th className="pb-2">Menge</th>
                                      <th className="pb-2">Erfasst von</th>
                                      <th className="pb-2">Notiz</th>
                                      <th className="pb-2 text-right">Aktionen</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {productEntries.map((entry) => (
                                      <tr key={entry.id}>
                                        <td className="py-2 text-gray-600">{formatDateTime(entry.createdAt)}</td>
                                        <td className="py-2 font-medium">{entry.quantity} {product.unit}</td>
                                        <td className="py-2 text-gray-600">{entry.user?.name || '-'}</td>
                                        <td className="py-2 text-gray-500">{entry.notes || '-'}</td>
                                        <td className="py-2 text-right">
                                          <button
                                            onClick={() => openSalesModal(product.id, entry)}
                                            className="text-blue-600 hover:text-blue-800 mr-2"
                                          >
                                            Bearbeiten
                                          </button>
                                          <button
                                            onClick={() => deleteSalesEntry(entry.id)}
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            Löschen
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}

      {products.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Noch keine Produkte vorhanden. Füge das erste Produkt hinzu!
          </CardContent>
        </Card>
      )}

      {/* Produkt Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="EK-Preis (€)"
              type="number"
              step="0.01"
              min="0"
              value={form.purchasePrice}
              onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
              required
            />
            <Input
              label="VK-Preis (€)"
              type="number"
              step="0.01"
              min="0"
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Einheit"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="z.B. Flasche, Kiste, Stück"
              required
            />
            <Select
              label="Kategorie"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={PRODUCT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Produkt ist aktiv</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit">
              {editingProduct ? 'Speichern' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Verkaufs-Eintrag Modal */}
      <Modal
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        title={editingSalesEntry ? 'Eintrag bearbeiten' : 'Verkauf eintragen'}
      >
        <form onSubmit={handleSalesSubmit} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              Produkt: <span className="font-medium text-gray-900">
                {products.find((p) => p.id === salesForm.productId)?.name}
              </span>
            </p>
            <p className="text-sm text-gray-600">
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
