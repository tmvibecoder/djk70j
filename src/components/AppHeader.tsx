'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const EVENT_START = new Date('2026-07-09T18:00:00')

function getCountdown(now: Date) {
  const diff = EVENT_START.getTime() - now.getTime()
  if (diff <= 0) return { running: true, days: 0, hours: 0 }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return { running: false, days, hours }
}

export function AppHeader() {
  const pathname = usePathname()
  const [countdown, setCountdown] = useState(() => getCountdown(new Date()))

  useEffect(() => {
    setCountdown(getCountdown(new Date()))
    const id = setInterval(() => setCountdown(getCountdown(new Date())), 60_000)
    return () => clearInterval(id)
  }, [])

  if (pathname === '/login') return null

  const urgent = !countdown.running && countdown.days <= 7
  const pillBase =
    'flex items-center gap-2 px-3 py-1.5 rounded-lg border shrink-0'
  const pillColor = urgent
    ? 'bg-red-50 border-red-200'
    : 'bg-emerald-50 border-emerald-200'
  const mainColor = urgent ? 'text-red-900' : 'text-emerald-900'
  const subColor = urgent ? 'text-red-700' : 'text-emerald-700'

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 lg:px-6 h-14 pl-14 lg:pl-6">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-widest uppercase text-yellow-600 leading-tight">
            DJK Ottenhofen
          </div>
          <div className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate">
            70 Jahre Jubiläumsfest
          </div>
        </div>

        <div className={`${pillBase} ${pillColor}`} aria-label={countdown.running ? 'Das Fest läuft' : `Noch ${countdown.days} Tage und ${countdown.hours} Stunden bis zum Fest am 9. Juli 2026`}>
          <span className="text-lg sm:text-xl" aria-hidden>⏱</span>
          <div className="text-right leading-tight">
            {countdown.running ? (
              <div className={`font-bold text-sm sm:text-base ${mainColor}`}>
                Fest läuft! 🎉
              </div>
            ) : (
              <>
                <div className={`font-bold text-sm sm:text-base ${mainColor}`}>
                  {countdown.days} Tage {countdown.hours} Std
                </div>
                <div className={`text-[10px] ${subColor}`}>bis 09. Juli 2026</div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
