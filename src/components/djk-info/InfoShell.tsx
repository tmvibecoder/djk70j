'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import type { InfoRolle } from '@/lib/info-auth'

// Rolle des eingeloggten Nutzers für die Client-Views (Bedienelemente
// ausblenden). Nur Anzeige-Logik — durchgesetzt werden die Rechte
// serverseitig in jeder Route (lib/info-auth.ts, darf()).
const RolleContext = createContext<InfoRolle | null>(null)

export function useInfoRolle(): InfoRolle | null {
  return useContext(RolleContext)
}

export function useDarfVerwalten(): boolean {
  return useContext(RolleContext) === 'kassier'
}

export function useDarfSchalten(): boolean {
  const rolle = useContext(RolleContext)
  return rolle === 'kassier' || rolle === 'redakteur'
}

const TABS = [
  { href: '/djk-info', label: 'Kunden', icon: '📋', nurKassier: false },
  { href: '/djk-info/ausgaben', label: 'Ausgaben', icon: '📖', nurKassier: false },
  { href: '/djk-info/rechnungen', label: 'Rechnungen', icon: '🧾', nurKassier: false },
  { href: '/djk-info/verteilung', label: 'Verteilung', icon: '📦', nurKassier: false },
  { href: '/djk-info/einstellungen', label: 'Einstellungen', icon: '⚙️', nurKassier: true },
]

const ROLLEN_HINWEIS: Record<string, string> = {
  redakteur:
    'Rolle „Redakteur": Sie sehen alles und pflegen die Anzeigen-Schaltungen je Ausgabe. Kunden, Rechnungen und Verteilung sind schreibgeschützt.',
  leser: 'Rolle „Lesen & Betrachten": Alle Inhalte sind sichtbar, Änderungen sind nicht möglich.',
}

export function InfoShell({
  hatAppSession,
  children,
}: {
  hatAppSession: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [rolle, setRolle] = useState<InfoRolle | null>(null)

  const istLogin = pathname === '/djk-info/login'
  useEffect(() => {
    if (istLogin) return
    fetch('/api/djk-info/auth/rolle')
      .then(r => (r.ok ? r.json() : null))
      .then(j => setRolle(j?.rolle ?? null))
      .catch(() => {})
  }, [istLogin])

  // Login-Seite rendert sich als Vollbild-Overlay selbst
  if (istLogin) return <>{children}</>

  const handleLogout = async () => {
    await fetch('/api/djk-info/auth/logout', { method: 'POST' })
    window.location.href = '/djk-info/login'
  }

  const tabAktiv = (href: string) =>
    href === '/djk-info' ? pathname === href || pathname.startsWith('/djk-info/kunden') : pathname.startsWith(href)

  const hinweis = rolle ? ROLLEN_HINWEIS[rolle] : undefined

  return (
    <RolleContext.Provider value={rolle}>
      <div className="max-w-6xl mx-auto">
        <header className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 sm:px-6 py-4 mb-4">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-yellow-600">
                DJK SG Ottenhofen e.V.
              </p>
              <h1 className="text-xl font-bold text-gray-900">📰 DJK Info</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hatAppSession && (
                <Link
                  href="/"
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200"
                >
                  ← Zur Event-App
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200"
              >
                🚪 Abmelden
              </button>
            </div>
          </div>

          <nav className="flex gap-1 mt-4 -mb-4 overflow-x-auto border-t border-gray-100 pt-1" aria-label="Bereiche">
            {TABS.filter(tab => !tab.nurKassier || rolle === 'kassier').map(tab => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tabAktiv(tab.href)
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <span aria-hidden>{tab.icon}</span>
                {tab.label}
              </Link>
            ))}
          </nav>
        </header>

        {hinweis && (
          <p className="text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-1.5 mb-3">{hinweis}</p>
        )}

        {children}
      </div>
    </RolleContext.Provider>
  )
}
