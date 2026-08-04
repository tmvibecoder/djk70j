'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  BEREICH_ICONS,
  BEREICH_LABELS,
  VERANSTALTUNGEN_SORTIERT,
  sichtbareBereiche,
} from '@/data/veranstaltungen'

// Das Menü entsteht aus dem Veranstaltungs-Register (neueste zuerst).
// Hinweis: Ab ca. 4 Veranstaltungen sollte die Liste zu einem
// „Veranstaltung wechseln"-Auswahlmenü zusammengeklappt werden, statt die
// Sidebar immer länger zu machen — bei aktuell 2 Einträgen noch unnötig.

export function Navigation() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored !== null) {
      setCollapsed(stored === 'true')
    }
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  // Aktive Veranstaltung = erstes Pfad-Segment (nicht startsWith, um
  // Fehlmatches bei ähnlichen IDs zu vermeiden)
  const activeEventId = pathname.split('/')[1] || null

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Title */}
      <div className="flex items-center h-16 px-4 border-b border-gray-800 shrink-0">
        <Link href="/" className="flex items-center gap-3 min-w-0" onClick={() => setMobileOpen(false)}>
          <span className="text-2xl shrink-0">🎉</span>
          {!collapsed && (
            <span className="font-bold text-lg text-white truncate">
              DJK Events
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {/* Übersicht */}
          <li>
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              title={collapsed ? 'Übersicht' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                pathname === '/'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <span className="text-lg shrink-0">🏠</span>
              {!collapsed && <span className="truncate">Übersicht</span>}
            </Link>
          </li>

          {/* Veranstaltungen (neueste zuerst), Bereiche der aktiven aufgeklappt */}
          {VERANSTALTUNGEN_SORTIERT.map((event) => {
            const eventActive = activeEventId === event.id
            return (
              <li key={event.id} className="pt-2">
                <Link
                  href={`/${event.id}`}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? event.titel : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    eventActive && pathname === `/${event.id}`
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : eventActive
                        ? 'text-white bg-gray-800'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <span className="text-lg shrink-0">{event.icon}</span>
                  {!collapsed && <span className="truncate">{event.titel}</span>}
                </Link>
                {eventActive && !collapsed && (
                  <ul className="mt-1 space-y-0.5">
                    {sichtbareBereiche(event).map((bereich) => {
                      const href = `/${event.id}/${bereich}`
                      const active = pathname === href
                      return (
                        <li key={bereich}>
                          <Link
                            href={href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-2.5 rounded-lg pl-10 pr-3 py-2 text-sm transition-all duration-150 ${
                              active
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-medium'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                          >
                            <span className="text-base shrink-0">{BEREICH_ICONS[bereich]}</span>
                            <span className="truncate">{BEREICH_LABELS[bereich]}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}

          {/* Dauerhafte Bereiche (unabhängig von Veranstaltungen) */}
          <li className="pt-4 mt-2 border-t border-gray-800">
            <Link
              href="/werbebanden"
              onClick={() => setMobileOpen(false)}
              title={collapsed ? 'Werbebanden' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 text-gray-400 hover:bg-gray-800 hover:text-white ${collapsed ? 'justify-center' : ''}`}
            >
              <span className="text-lg shrink-0">🏟️</span>
              {!collapsed && <span className="truncate">Werbebanden</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/schluessel"
              onClick={() => setMobileOpen(false)}
              title={collapsed ? 'Schlüssel' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 text-gray-400 hover:bg-gray-800 hover:text-white ${collapsed ? 'justify-center' : ''}`}
            >
              <span className="text-lg shrink-0">🔑</span>
              {!collapsed && <span className="truncate">Schlüssel</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/djk-info"
              onClick={() => setMobileOpen(false)}
              title={collapsed ? 'DJK Info' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 text-gray-400 hover:bg-gray-800 hover:text-white ${collapsed ? 'justify-center' : ''}`}
            >
              <span className="text-lg shrink-0">📰</span>
              {!collapsed && <span className="truncate">DJK Info</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-800 p-3 shrink-0">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Abmelden' : undefined}
          className={`flex items-center w-full gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors duration-150 ${collapsed ? 'justify-center' : ''}`}
        >
          <span className="text-lg shrink-0">🚪</span>
          {!collapsed && <span>Abmelden</span>}
        </button>
      </div>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block border-t border-gray-800 p-3 shrink-0">
        <button
          onClick={toggleCollapsed}
          className="flex items-center justify-center w-full gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors duration-150"
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Einklappen</span>
            </>
          )}
        </button>
      </div>
    </div>
  )

  // Auf der Login-Seite und in Bereichen mit eigenem Layout keine Sidebar
  if (
    pathname === '/login' ||
    pathname.startsWith('/werbebanden') ||
    pathname.startsWith('/schluessel') ||
    pathname.startsWith('/djk-info')
  )
    return null

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 text-white shadow-lg"
        aria-label="Navigation öffnen"
      >
        {mobileOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-gray-900 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
