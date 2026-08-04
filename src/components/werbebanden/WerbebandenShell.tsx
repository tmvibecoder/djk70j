'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { BereichsRolle } from '@/lib/bereiche'

export function WerbebandenShell({
  rolle,
  children,
}: {
  rolle: BereichsRolle
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const TABS = [
    { href: '/werbebanden', label: 'Partner', icon: '📋' },
    { href: '/werbebanden/rechnungen', label: 'Rechnungen', icon: '🧾' },
    { href: '/werbebanden/platz', label: 'Platzübersicht', icon: '🏟️' },
    ...(rolle === 'verwalten' ? [{ href: '/werbebanden/einstellungen', label: 'Einstellungen', icon: '⚙️' }] : []),
  ]

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const tabAktiv = (href: string) =>
    href === '/werbebanden' ? pathname === href || pathname.startsWith('/werbebanden/partner') : pathname.startsWith(href)

  return (
    <div className="max-w-6xl mx-auto">
      <header className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 sm:px-6 py-4 mb-4">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-yellow-600">
              DJK SG Ottenhofen e.V.
            </p>
            <h1 className="text-xl font-bold text-gray-900">🏟️ Bandenwerbung</h1>
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
          {TABS.map(tab => (
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

      {children}
    </div>
  )
}
