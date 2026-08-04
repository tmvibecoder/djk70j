'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/schluessel'

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/schluessel/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'Login fehlgeschlagen')
      return
    }
    // Sicherheitsnetz: nie auf fremde Seiten oder aus dem Bereich hinaus leiten
    router.push(next.startsWith('/schluessel') ? next : '/schluessel')
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-5"
    >
      <div className="text-center">
        <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK SG Ottenhofen e.V.</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">🔑 Schlüsselverwaltung</h1>
        <p className="text-sm text-gray-500 mt-1">Bitte einloggen</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Passwort</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
        className="w-full px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Anmelden…' : 'Anmelden'}
      </button>
    </form>
  )
}

export default function SchluesselLoginPage() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-amber-950 to-gray-800 flex items-center justify-center p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
