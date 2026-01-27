'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, Button, Select, Input, Badge } from '@/components/ui'
import { EVENT_DAYS, EVENT_DAY_LABELS, INVENTORY_TYPES, INVENTORY_TYPE_LABELS, PRODUCT_CATEGORIES } from '@/types'

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

export default function InventurPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [summary, setSummary] = useState<{ products: InventorySummary[]; totals: { revenue: number; cost: number; profit: number } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>('thursday')
  const [selectedType, setSelectedType] = useState<string>('start')
  const [entries, setEntries] = useState<Record<string, { quantity: string; notes: string }>>({})
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'entry' | 'summary'>('entry')

  useEffect(() => {
    loadData()
  }, [selectedDay])

  const loadData = async () => {
    const [productsRes, summaryRes] = await Promise.all([
      fetch('/api/products?active=true'),
      fetch('/api/inventory/summary'),
    ])

    const productsData = await productsRes.json()
    const summaryData = await summaryRes.json()

    setProducts(productsData)
    setSummary(summaryData)

    // Vorhandene Inventurdaten laden
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
          <h1 className="text-2xl font-bold text-gray-900">Inventur</h1>
          <p className="text-gray-600">Bestandserfassung und Verbrauchsübersicht</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'entry' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('entry')}
          >
            Erfassung
          </Button>
          <Button
            variant={viewMode === 'summary' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('summary')}
          >
            Übersicht
          </Button>
        </div>
      </div>

      {viewMode === 'entry' ? (
        <>
          {/* Auswahl */}
          <Card>
            <CardContent className="py-4">
              <div className="flex gap-4 items-end">
                <Select
                  label="Tag"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  options={EVENT_DAYS.map((day) => ({ value: day, label: EVENT_DAY_LABELS[day] }))}
                  className="w-48"
                />
                <Select
                  label="Typ"
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value)
                    setEntries({})
                    loadData()
                  }}
                  options={INVENTORY_TYPES.map((type) => ({ value: type, label: INVENTORY_TYPE_LABELS[type] }))}
                  className="w-48"
                />
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Speichere...' : 'Speichern'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Erfassungsliste */}
          {PRODUCT_CATEGORIES.map((category) => {
            const categoryProducts = groupedProducts[category]
            if (!categoryProducts?.length) return null

            return (
              <Card key={category}>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkt</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Einheit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akt. Bestand</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">Menge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {categoryProducts.map((product) => {
                        const summaryItem = summary?.products.find((p) => p.product.id === product.id)
                        return (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{product.unit}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">
                              {summaryItem?.currentStock ?? '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={entries[product.id]?.quantity || ''}
                                onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                className="w-24 text-center"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )
          })}
        </>
      ) : (
        <>
          {/* Finanzübersicht */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Umsatz (gesamt)</p>
                    <p className="text-3xl font-bold text-gray-900">{summary.totals.revenue.toFixed(2)} €</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Kosten (EK)</p>
                    <p className="text-3xl font-bold text-red-600">{summary.totals.cost.toFixed(2)} €</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Gewinn</p>
                    <p className="text-3xl font-bold text-green-600">{summary.totals.profit.toFixed(2)} €</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Verbrauchsübersicht */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Verbrauch nach Produkt</h2>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkt</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akt. Bestand</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Verbrauch</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Umsatz</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gewinn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {summary?.products
                    .filter((item) => item.totalConsumption > 0 || item.currentStock > 0)
                    .map((item) => (
                      <tr key={item.product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-sm text-gray-500">{item.product.category}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Badge variant={item.currentStock <= 5 ? 'danger' : item.currentStock <= 10 ? 'warning' : 'success'}>
                            {item.currentStock} {item.product.unit}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                          {item.totalConsumption} {item.product.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                          {item.revenue.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-medium">
                          {item.profit.toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
