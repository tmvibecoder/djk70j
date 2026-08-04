'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { BereichsRolle } from '@/lib/bereiche'

export function SchluesselShell({
  rolle,
  children,
}: {
  rolle: BereichsRolle
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const TABS = [
    { href: '/schluessel', label: 'Bestand', icon: '🔑' },
    { href: '/schluessel/inhaber', label: 'Inhaber', icon: '👤' },
    { href: '/schluessel/ausgabe', label: 'Ausgabe', icon: '✍️' },
    { href: '/schluessel/schliessplan', label: 'Schließplan', icon: '🗝️' },
    { href: '/schluessel/belege', label: 'Belege', icon: '🧾' },
    ...(rolle === 'verwalten' ? [{ href: '/schluessel/einstellungen', label: '', icon: '⚙️' }] : []),
  ]

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const tabAktiv = (href: string) =>
    href === '/schluessel' ? pathname === href : pathname.startsWith(href)

  return (
    <div className="max-w-4xl mx-auto">
      <header className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 sm:px-6 py-4 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-amber-600">
              DJK SG Ottenhofen e.V.
            </p>
            <h1 className="text-xl font-bold text-gray-900">🔑 Schlüsselverwaltung</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="hidden sm:inline px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200"
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
          {TABS.map(tab => (
            <Link
              key={tab.href}
              href={tab.href}
              title={tab.label || 'Einstellungen'}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tabAktiv(tab.href)
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span aria-hidden>{tab.icon}</span>
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>

      {children}
    </div>
  )
}
