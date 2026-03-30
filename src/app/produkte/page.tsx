'use client'

import { useState, useEffect, useCallback } from 'react'

interface Product {
  id: string
  name: string
  purchasePrice: number
  salePrice: number
  unit: string
  category: string
  isActive: boolean
}

const CATEGORIES = ['Bier & Radler', 'Softdrinks', 'Schnaps & Shots', 'Longdrinks', 'Wein & Sekt', 'Warme Speisen', 'Snacks']
const CAT_ICONS: Record<string, string> = {
  'Bier & Radler': '🍺', 'Softdrinks': '🥤', 'Schnaps & Shots': '🥃',
  'Longdrinks': '🍹', 'Wein & Sekt': '🍷', 'Warme Speisen': '🍖', 'Snacks': '🥨',
}

const fmtEur = (v: number) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

export default function ProduktePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', purchasePrice: 0, salePrice: 0, unit: 'Glas', category: 'Bier & Radler' })

  const load = useCallback(async () => {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.name.trim()) return
    if (editId) {
      await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...form }) })
    } else {
      await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setForm({ name: '', purchasePrice: 0, salePrice: 0, unit: 'Glas', category: 'Bier & Radler' })
    setEditId(null)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Produkt wirklich löschen?')) return
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
    load()
  }

  const startEdit = (p: Product) => {
    setEditId(p.id)
    setForm({ name: p.name, purchasePrice: p.purchasePrice, salePrice: p.salePrice, unit: p.unit, category: p.category })
  }

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    icon: CAT_ICONS[cat] || '📦',
    items: products.filter(p => p.category === cat && p.isActive),
  })).filter(g => g.items.length > 0)

  const totalMargin = products.filter(p => p.isActive).reduce((s, p) => s + (p.salePrice - p.purchasePrice), 0)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Laden...</div></div>

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 -mx-4 -mt-16 lg:-mt-6 px-4 pt-16 lg:pt-6 pb-4 mb-6 rounded-b-lg">
        <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
        <h1 className="text-2xl font-bold text-white">Produkte & Preise</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow border p-4 text-center">
          <div className="text-xs text-gray-500 font-medium">Produkte</div>
          <div className="text-2xl font-bold text-gray-900">{products.filter(p => p.isActive).length}</div>
        </div>
        <div className="bg-white rounded-lg shadow border p-4 text-center">
          <div className="text-xs text-gray-500 font-medium">Kategorien</div>
          <div className="text-2xl font-bold text-gray-900">{grouped.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow border p-4 text-center">
          <div className="text-xs text-gray-500 font-medium">Ø Marge</div>
          <div className="text-2xl font-bold text-green-600">{products.filter(p => p.isActive).length > 0 ? fmtEur(totalMargin / products.filter(p => p.isActive).length) : '–'}</div>
        </div>
        <div className="bg-white rounded-lg shadow border p-4 text-center">
          <div className="text-xs text-gray-500 font-medium">Ø VK-Preis</div>
          <div className="text-2xl font-bold text-blue-600">{products.filter(p => p.isActive).length > 0 ? fmtEur(products.filter(p => p.isActive).reduce((s, p) => s + p.salePrice, 0) / products.filter(p => p.isActive).length) : '–'}</div>
        </div>
      </div>

      {/* Neues Produkt / Bearbeiten */}
      <div className="bg-white rounded-lg shadow border p-5">
        <h3 className="font-semibold text-gray-900 mb-3">{editId ? 'Produkt bearbeiten' : 'Neues Produkt'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className="border border-gray-300 rounded-lg px-3 py-2 text-sm lg:col-span-2" />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">EK</span>
            <input type="number" step="0.01" value={form.purchasePrice || ''} onChange={e => setForm(f => ({ ...f, purchasePrice: +e.target.value }))} className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm" />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">VK</span>
            <input type="number" step="0.01" value={form.salePrice || ''} onChange={e => setForm(f => ({ ...f, salePrice: +e.target.value }))} className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm" />
          </div>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={save} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">
            {editId ? 'Speichern' : '+ Hinzufügen'}
          </button>
        </div>
        {editId && <button onClick={() => { setEditId(null); setForm({ name: '', purchasePrice: 0, salePrice: 0, unit: 'Glas', category: 'Bier & Radler' }) }} className="text-sm text-gray-500 mt-2 hover:text-gray-700">Abbrechen</button>}
      </div>

      {/* Produktliste nach Kategorie */}
      {grouped.map(g => (
        <div key={g.category} className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-3 flex items-center gap-2">
            <span className="text-lg">{g.icon}</span>
            <h3 className="font-semibold text-gray-900">{g.category}</h3>
            <span className="text-xs text-gray-500 ml-auto">{g.items.length} Produkte</span>
          </div>
          <div className="divide-y">
            {g.items.map(p => (
              <div key={p.id} className="px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1">
                <div className="font-medium text-gray-900 min-w-[180px] flex-1">{p.name}</div>
                <div className="text-sm text-gray-500">{p.unit}</div>
                <div className="text-sm">
                  <span className="text-gray-500">EK</span> <span className="font-medium text-gray-700">{fmtEur(p.purchasePrice)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">VK</span> <span className="font-bold text-gray-900">{fmtEur(p.salePrice)}</span>
                </div>
                <div className={`text-sm font-semibold ${p.salePrice - p.purchasePrice > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  +{fmtEur(p.salePrice - p.purchasePrice)}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(p)} className="text-blue-600 hover:text-blue-800 text-sm">Bearbeiten</button>
                  <button onClick={() => remove(p.id)} className="text-red-500 hover:text-red-700 text-sm">Löschen</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
