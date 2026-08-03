'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { PLATZ_ABSCHNITTE, formatMeter } from '@/data/werbebanden'
import { PartnerDto } from './typen'

// Farbpalette für die Belegungs-Segmente (rotierend)
const FARBEN = [
  'bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-violet-500',
  'bg-rose-500', 'bg-teal-500', 'bg-orange-500', 'bg-indigo-500',
]

export function PlatzView() {
  const [partner, setPartner] = useState<PartnerDto[] | null>(null)

  useEffect(() => {
    fetch('/api/werbebanden/partner?status=aktiv')
      .then(r => r.json())
      .then(setPartner)
      .catch(() => setPartner([]))
  }, [])

  if (partner === null) {
    return <p className="text-sm text-gray-500 py-8 text-center">Lade Platzübersicht…</p>
  }

  // Physische Belegung = Ist-Länge der Bande (Fallback: abgerechnete Meter)
  const physisch = (p: PartnerDto) => p.istLaenge || p.berechneteLaenge

  const ohneAbschnitt = partner.filter(p => !p.abschnitt && physisch(p) > 0)

  return (
    <div className="space-y-4">
      {PLATZ_ABSCHNITTE.map(abschnitt => {
        const belegt = partner
          .filter(p => p.abschnitt === abschnitt.nr)
          .sort((a, b) => (a.positionNr ?? 99) - (b.positionNr ?? 99))
        const belegteMeter = belegt.reduce((s, p) => s + physisch(p), 0)
        const frei = Math.max(0, abschnitt.laenge - belegteMeter)

        return (
          <Card key={abschnitt.nr}>
            <CardHeader className="!py-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-gray-900">
                Abschnitt {abschnitt.nr} · {abschnitt.name}
              </h3>
              <p className="text-xs text-gray-500">
                {formatMeter(belegteMeter)} von {formatMeter(abschnitt.laenge)} belegt
                {frei > 0.01 && <span className="text-emerald-700 font-semibold"> · {formatMeter(frei)} frei</span>}
              </p>
            </CardHeader>
            <CardContent>
              {/* Belegungs-Balken */}
              <div className="flex w-full h-9 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                {belegt.map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/werbebanden/partner/${p.id}`}
                    title={`${p.firma} — ${formatMeter(physisch(p))}`}
                    className={`${FARBEN[i % FARBEN.length]} h-full flex items-center justify-center text-[10px] text-white font-semibold px-0.5 overflow-hidden whitespace-nowrap hover:opacity-80 transition-opacity`}
                    style={{ width: `${(physisch(p) / abschnitt.laenge) * 100}%` }}
                  >
                    <span className="truncate">{p.firma}</span>
                  </Link>
                ))}
                {frei > 0.01 && (
                  <div
                    className="h-full flex items-center justify-center text-[10px] text-gray-500 font-medium"
                    style={{ width: `${(frei / abschnitt.laenge) * 100}%` }}
                    title={`${formatMeter(frei)} frei`}
                  >
                    frei
                  </div>
                )}
              </div>

              {/* Legende */}
              {belegt.length > 0 ? (
                <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  {belegt.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-2 text-xs text-gray-700">
                      <span className={`w-3 h-3 rounded-sm shrink-0 ${FARBEN[i % FARBEN.length]}`} />
                      <Link href={`/werbebanden/partner/${p.id}`} className="hover:underline truncate">
                        {p.positionNr ? `${p.positionNr}. ` : ''}{p.firma}
                      </Link>
                      <span className="text-gray-400 ml-auto shrink-0">{formatMeter(physisch(p))}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-gray-400">Noch keine Banden in diesem Abschnitt erfasst.</p>
              )}
            </CardContent>
          </Card>
        )
      })}

      {ohneAbschnitt.length > 0 && (
        <Card>
          <CardHeader className="!py-3">
            <h3 className="font-bold text-gray-900">Ohne Abschnitt erfasst</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {ohneAbschnitt.map(p => (
                <li key={p.id} className="text-sm">
                  <Link href={`/werbebanden/partner/${p.id}`} className="text-emerald-700 hover:underline">
                    {p.firma}
                  </Link>
                  <span className="text-gray-500 text-xs"> · {formatMeter(physisch(p))} — Abschnitt im Partner-Formular zuordnen</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
