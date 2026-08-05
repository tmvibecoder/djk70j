'use client'

import { useState } from 'react'

export function PasswortAendernForm() {
  const [aktuellesPasswort, setAktuellesPasswort] = useState('')
  const [neuesPasswort, setNeuesPasswort] = useState('')
  const [bestaetigung, setBestaetigung] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (neuesPasswort !== bestaetigung) {
      setError('Die Passwörter stimmen nicht überein')
      return
    }

    setLoading(true)
    const res = await fetch('/api/mein-konto/passwort', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktuellesPasswort, neuesPasswort }),
    })
    setLoading(false)

    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'Passwort konnte nicht geändert werden')
      return
    }
    setAktuellesPasswort('')
    setNeuesPasswort('')
    setBestaetigung('')
    setSuccess(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Aktuelles Passwort</label>
        <input
          type="password"
          value={aktuellesPasswort}
          onChange={e => setAktuellesPasswort(e.target.value)}
          autoComplete="current-password"
          required
          className="bg-gray-50 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Neues Passwort</label>
        <input
          type="password"
          value={neuesPasswort}
          onChange={e => setNeuesPasswort(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
          className="bg-gray-50 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Neues Passwort bestätigen</label>
        <input
          type="password"
          value={bestaetigung}
          onChange={e => setBestaetigung(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
          className="bg-gray-50 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg px-3 py-2">
          Passwort geändert.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Speichern…' : 'Passwort ändern'}
      </button>
    </form>
  )
}
