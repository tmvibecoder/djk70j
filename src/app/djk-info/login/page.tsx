'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ROLLEN_INFO } from '@/data/djk-info'
import type { InfoRolle } from '@/lib/info-auth'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/djk-info'

  const [rolle, setRolle] = useState<InfoRolle>('kassier')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const rollenInfo = ROLLEN_INFO.find(r => r.rolle === rolle) ?? ROLLEN_INFO[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/djk-info/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rolle, password }),
    })
    setLoading(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'Login fehlgeschlagen')
      return
    }
    // Sicherheitsnetz: nie auf fremde Seiten oder aus dem Bereich hinaus leiten
    router.push(next.startsWith('/djk-info') ? next : '/djk-info')
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-5"
    >
      <div className="text-center">
        <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK SG Ottenhofen e.V.</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">📰 DJK Info</h1>
        <p className="text-sm text-gray-500 mt-1">Bitte einloggen</p>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="login-rolle" className="block text-xs font-semibold text-gray-700 uppercase mb-1">Anmelden als</label>
          <select
            id="login-rolle"
            value={rolle}
            onChange={e => setRolle(e.target.value as InfoRolle)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {ROLLEN_INFO.map(r => (
              <option key={r.rolle} value={r.rolle}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-[13px] text-gray-700">
          <span className="block font-semibold text-gray-900 mb-0.5">{rollenInfo.label}</span>
          {rollenInfo.beschreibung}
        </div>

        <div>
          <label htmlFor="login-passwort" className="block text-xs font-semibold text-gray-700 uppercase mb-1">Passwort</label>
          <input
            id="login-passwort"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="w-full px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Anmelden…' : 'Anmelden'}
      </button>
    </form>
  )
}

export default function InfoLoginPage() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-800 flex items-center justify-center p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
