'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BEREICH_LABELS, BereichKey, getVeranstaltung } from '@/data/veranstaltungen'

function getCountdown(start: Date, now: Date) {
  const diff = start.getTime() - now.getTime()
  if (diff <= 0) return { running: true, days: 0, hours: 0 }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return { running: false, days, hours }
}

export function AppHeader() {
  const pathname = usePathname()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (
    pathname === '/login' ||
    pathname.startsWith('/werbebanden') ||
    pathname.startsWith('/schluessel') ||
    pathname.startsWith('/djk-info')
  )
    return null

  // Veranstaltung + Bereich aus der URL ableiten (/[eventId]/[bereich])
  const [, seg1, seg2] = pathname.split('/')
  const event = getVeranstaltung(seg1)
  const bereichLabel =
    event && seg2 && seg2 in BEREICH_LABELS ? BEREICH_LABELS[seg2 as BereichKey] : null

  // Countdown nur für Veranstaltungen mit künftigem Starttermin
  const start = event?.startDate ? new Date(event.startDate) : null
  const countdown = start && start.getTime() > now.getTime() ? getCountdown(start, now) : null
  const urgent = countdown !== null && countdown.days <= 7
  const pillColor = urgent ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
  const mainColor = urgent ? 'text-red-900' : 'text-emerald-900'
  const subColor = urgent ? 'text-red-700' : 'text-emerald-700'
  const startLabel = start?.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 lg:px-6 h-14 pl-14 lg:pl-6">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-widest uppercase text-yellow-600 leading-tight">
            DJK Ottenhofen
          </div>
          {event ? (
            /* Brotkrümel: Übersicht › Veranstaltung › Bereich */
            <nav
              aria-label="Brotkrümel"
              className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate"
            >
              <Link href="/" className="hover:underline">Übersicht</Link>
              <span className="text-gray-400 mx-1">›</span>
              {bereichLabel ? (
                <>
                  <Link href={`/${event.id}`} className="hover:underline">{event.titel}</Link>
                  <span className="text-gray-400 mx-1">›</span>
                  <span>{bereichLabel}</span>
                </>
              ) : (
                <span>{event.titel}</span>
              )}
            </nav>
          ) : (
            <div className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate">
              DJK Events
            </div>
          )}
        </div>

        {countdown && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shrink-0 ${pillColor}`}
            aria-label={`Noch ${countdown.days} Tage und ${countdown.hours} Stunden bis zum Fest am ${startLabel}`}
          >
            <span className="text-lg sm:text-xl" aria-hidden>⏱</span>
            <div className="text-right leading-tight">
              <div className={`font-bold text-sm sm:text-base ${mainColor}`}>
                {countdown.days} Tage {countdown.hours} Std
              </div>
              <div className={`text-[10px] ${subColor}`}>bis {startLabel}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
