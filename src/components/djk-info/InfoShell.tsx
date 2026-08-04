'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext } from 'react'
import type { BereichsRolle } from '@/lib/bereiche'

// Rolle des eingeloggten Nutzers für die Client-Views (Bedienelemente
// ausblenden). Nur Anzeige-Logik — durchgesetzt werden die Rechte
// serverseitig in jeder Route (lib/session.ts, darf()).
const RolleContext = createContext<BereichsRolle | null>(null)

export function useInfoRolle(): BereichsRolle | null {
  return useContext(RolleContext)
}

export function useDarfVerwalten(): boolean {
  return useContext(RolleContext) === 'verwalten'
}

export function useDarfSchalten(): boolean {
  const rolle = useContext(RolleContext)
  return rolle === 'verwalten' || rolle === 'bearbeiten'
}

const TABS = [
  { href: '/djk-info', label: 'Kunden', icon: '📋', nurVerwalten: false },
  { href: '/djk-info/ausgaben', label: 'Ausgaben', icon: '📖', nurVerwalten: false },
  { href: '/djk-info/rechnungen', label: 'Rechnungen', icon: '🧾', nurVerwalten: false },
  { href: '/djk-info/verteilung', label: 'Verteilung', icon: '📦', nurVerwalten: false },
  { href: '/djk-info/einstellungen', label: 'Einstellungen', icon: '⚙️', nurVerwalten: true },
]

const ROLLEN_HINWEIS: Record<BereichsRolle, string | undefined> = {
  bearbeiten:
    'Rolle „Bearbeiten": Sie sehen alles und pflegen die Anzeigen-Schaltungen je Ausgabe. Kunden, Rechnungen und Verteilung sind schreibgeschützt.',
  lesen: 'Rolle „Lesen": Alle Inhalte sind sichtbar, Änderungen sind nicht möglich.',
  verwalten: undefined,
}

export function InfoShell({
  rolle,
  children,
}: {
  rolle: BereichsRolle
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const tabAktiv = (href: string) =>
    href === '/djk-info' ? pathname === href || pathname.startsWith('/djk-info/kunden') : pathname.startsWith(href)

  const hinweis = ROLLEN_HINWEIS[rolle]

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
              <Link
                href="/"
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200"
              >
                ← Übersicht
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200"
              >
                🚪 Abmelden
              </button>
            </div>
          </div>

          <nav className="flex gap-1 mt-4 -mb-4 overflow-x-auto border-t border-gray-100 pt-1" aria-label="Bereiche">
            {TABS.filter(tab => !tab.nurVerwalten || rolle === 'verwalten').map(tab => (
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
