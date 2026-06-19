'use client'

import { useEffect, useState } from 'react'
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
  const [search, setSearch] = useState('')
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

  const filteredProducts = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products

  const grouped = filteredProducts.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {} as Record<string, Product[]>)

  const sortedCategories = [...PRODUCT_CATEGORIES].filter(cat => grouped[cat]?.length > 0)
  const extraCategories = Object.keys(grouped).filter(cat => !(PRODUCT_CATEGORIES as readonly string[]).includes(cat))

  const activeProducts = products.filter(p => p.isActive)
  const avgMargin = activeProducts.length > 0
    ? activeProducts.reduce((sum, p) => sum + (p.salePrice - p.purchasePrice), 0) / activeProducts.length
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Laden...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
          <div className="text-[10px] text-gray-500 font-medium uppercase">Produkte</div>
          <div className="text-xl font-bold text-gray-900">{activeProducts.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
          <div className="text-[10px] text-gray-500 font-medium uppercase">Kategorien</div>
          <div className="text-xl font-bold text-gray-900">{sortedCategories.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
          <div className="text-[10px] text-gray-500 font-medium uppercase">Ø Marge</div>
          <div className="text-xl font-bold text-green-600">{avgMargin.toFixed(2)} €</div>
        </div>
      </div>

      {/* Search + New */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Produkt suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <Button onClick={() => openModal()} className="shrink-0">+ Neu</Button>
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
                  <span className="text-sm text-gray-500 font-normal">({catProducts.length})</span>
                </div>
                <Button size="sm" variant="secondary" onClick={() => openModal(undefined, category)}>
                  +
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {catProducts.map((product) => {
                  const margin = product.salePrice - product.purchasePrice
                  const marginPct = product.purchasePrice > 0
                    ? ((margin / product.purchasePrice) * 100).toFixed(0)
                    : '–'

                  return (
                    <div key={product.id} className={`px-4 py-3 flex items-center gap-3 ${!product.isActive ? 'opacity-50' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">{product.unit}</span>
                          <span className="text-xs text-gray-500">EK {product.purchasePrice.toFixed(2)} €</span>
                          <span className="text-xs font-semibold text-gray-700">VK {product.salePrice.toFixed(2)} €</span>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-green-600 whitespace-nowrap">
                        +{margin.toFixed(2)} €
                        <span className="text-xs text-gray-400 font-normal ml-1">({marginPct}%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleActive(product)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            product.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {product.isActive ? 'Aktiv' : 'Aus'}
                        </button>
                        <button
                          onClick={() => openModal(product)}
                          className="text-gray-400 hover:text-indigo-600 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Empty state */}
      {products.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">Noch keine Produkte vorhanden.</p>
            <Button onClick={() => openModal()}>Erstes Produkt anlegen</Button>
          </CardContent>
        </Card>
      )}

      {/* Empty categories hint */}
      {PRODUCT_CATEGORIES.filter(cat => !grouped[cat] || grouped[cat].length === 0).length > 0 && products.length > 0 && !search && (
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
