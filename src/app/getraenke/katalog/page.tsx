'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, Button, Input, Select, Modal } from '@/components/ui'
import { PRODUCT_CATEGORIES } from '@/types'

interface Product {
  id: string
  name: string
  purchasePrice: number
  salePrice: number
  unit: string
  category: string
  isActive: boolean
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

export default function KatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({
    name: '',
    purchasePrice: '',
    salePrice: '',
    unit: 'Flasche',
    category: PRODUCT_CATEGORIES[0] as string,
    isActive: true,
  })

  const loadProducts = async () => {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const openModal = (product?: Product, category?: string) => {
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
        category: category || PRODUCT_CATEGORIES[0],
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
      body: JSON.stringify({
        ...form,
        purchasePrice: parseFloat(form.purchasePrice),
        salePrice: parseFloat(form.salePrice),
      }),
    })

    setIsModalOpen(false)
    loadProducts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Produkt wirklich löschen? Alle zugehörigen Verkaufs- und Bestandsdaten werden ebenfalls gelöscht.')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    loadProducts()
  }

  const toggleActive = async (product: Product) => {
    await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, isActive: !product.isActive }),
    })
    loadProducts()
  }

  const grouped = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {} as Record<string, Product[]>)

  // Sort categories by PRODUCT_CATEGORIES order
  const sortedCategories = [...PRODUCT_CATEGORIES].filter(cat => grouped[cat]?.length > 0)
  const extraCategories = Object.keys(grouped).filter(cat => !(PRODUCT_CATEGORIES as readonly string[]).includes(cat))

  const totalProducts = products.length
  const activeProducts = products.filter(p => p.isActive).length
  const avgMargin = products.length > 0
    ? products.reduce((sum, p) => sum + (p.salePrice - p.purchasePrice), 0) / products.length
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Laden...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div>
          <Link
            href="/getraenke"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-1 inline-flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Zurück zu Produkte & Preise
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Getränkeliste</h1>
          <p className="text-gray-600 text-sm">Verwalte alle Getränke und Speisen mit EK- und VK-Preisen</p>
        </div>
        <Button onClick={() => openModal()} className="shrink-0">+ Neues Produkt</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow border p-4 text-center">
          <p className="text-sm text-gray-600 font-medium">Produkte gesamt</p>
          <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4 text-center">
          <p className="text-sm text-gray-600 font-medium">Davon aktiv</p>
          <p className="text-2xl font-bold text-green-600">{activeProducts}</p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4 text-center">
          <p className="text-sm text-gray-600 font-medium">Durchschn. Marge</p>
          <p className="text-2xl font-bold text-indigo-600">{avgMargin.toFixed(2)} €</p>
        </div>
      </div>

      {/* Category groups */}
      {[...sortedCategories, ...extraCategories].map((category) => {
        const catProducts = grouped[category] || []
        if (catProducts.length === 0) return null
        const icon = CATEGORY_ICONS[category] || '📦'

        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
                  <span className="text-sm text-gray-500 font-normal">({catProducts.length} Produkte)</span>
                </div>
                <Button size="sm" variant="secondary" onClick={() => openModal(undefined, category)}>
                  + Hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Produkt</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">EK-Preis</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">VK-Preis</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Marge</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Einheit</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {catProducts.map((product) => {
                    const margin = product.salePrice - product.purchasePrice
                    const marginPct = product.purchasePrice > 0
                      ? ((margin / product.purchasePrice) * 100).toFixed(0)
                      : '–'

                    return (
                      <tr key={product.id} className={!product.isActive ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{product.name}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">{product.purchasePrice.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{product.salePrice.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-green-600 font-medium">+{margin.toFixed(2)} €</span>
                          <span className="text-gray-500 text-xs ml-1">({marginPct}%)</span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600 text-sm">{product.unit}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleActive(product)}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              product.isActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {product.isActive ? 'Aktiv' : 'Inaktiv'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openModal(product)}>
                              Bearbeiten
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">
                              Löschen
                            </Button>
                          </div>
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

      {/* Empty categories hint */}
      {totalProducts === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">Noch keine Produkte vorhanden.</p>
            <Button onClick={() => openModal()}>Erstes Produkt anlegen</Button>
          </CardContent>
        </Card>
      )}

      {/* Add product for empty categories */}
      {PRODUCT_CATEGORIES.filter(cat => !grouped[cat] || grouped[cat].length === 0).length > 0 && totalProducts > 0 && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-600 mb-3">Kategorien ohne Produkte:</p>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_CATEGORIES.filter(cat => !grouped[cat] || grouped[cat].length === 0).map(cat => (
                <button
                  key={cat}
                  onClick={() => openModal(undefined, cat)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <span>{CATEGORY_ICONS[cat] || '📦'}</span>
                  <span>+ {cat}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
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
            placeholder="z.B. Helles 0,5l"
            required
          />
          <Select
            label="Kategorie"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={PRODUCT_CATEGORIES.map((cat) => ({ value: cat, label: `${CATEGORY_ICONS[cat] || ''} ${cat}` }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="EK-Preis (€)"
              type="number"
              step="0.01"
              min="0"
              value={form.purchasePrice}
              onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
              placeholder="z.B. 0.80"
              required
            />
            <Input
              label="VK-Preis (€)"
              type="number"
              step="0.01"
              min="0"
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              placeholder="z.B. 3.50"
              required
            />
          </div>
          {form.purchasePrice && form.salePrice && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <span className="text-green-800 font-medium">
                Marge: +{(parseFloat(form.salePrice) - parseFloat(form.purchasePrice)).toFixed(2)} €
                {parseFloat(form.purchasePrice) > 0 && (
                  <span className="text-green-600 ml-1">
                    ({(((parseFloat(form.salePrice) - parseFloat(form.purchasePrice)) / parseFloat(form.purchasePrice)) * 100).toFixed(0)}%)
                  </span>
                )}
              </span>
            </div>
          )}
          <Input
            label="Einheit"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            placeholder="z.B. Flasche, Glas, Shot, Stück"
            required
          />
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
    </div>
  )
}
