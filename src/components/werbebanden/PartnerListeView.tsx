'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge, Card, CardContent } from '@/components/ui'
import { abschnittName, formatEuro, formatMeter } from '@/data/werbebanden'
import { PartnerDto } from './typen'

const FILTER = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'gekuendigt', label: 'Gekündigt' },
  { value: 'alle', label: 'Alle' },
]

export function PartnerListeView() {
  const [partner, setPartner] = useState<PartnerDto[] | null>(null)
  const [filter, setFilter] = useState('aktiv')
  const [suche, setSuche] = useState('')

  useEffect(() => {
    let aktiv = true
    fetch(`/api/werbebanden/partner?status=${filter}`)
      .then(r => r.json())
      .then(data => { if (aktiv) setPartner(data) })
      .catch(() => { if (aktiv) setPartner([]) })
    return () => { aktiv = false }
  }, [filter])

  const gefiltert = (partner ?? []).filter(p => {
    if (!suche.trim()) return true
    const s = suche.toLowerCase()
    return [p.firma, p.ansprechpartner, p.ort].some(f => f?.toLowerCase().includes(s))
  })

  const aktive = gefiltert.filter(p => p.status === 'aktiv')
  const summeMeter = aktive.reduce((s, p) => s + p.berechneteLaenge, 0)
  const summeBrutto = aktive.reduce(
    (s, p) => s + p.berechneteLaenge * p.preisProMeter * 1.19,
    0,
  )

  return (
    <div className="space-y-4">
      {/* Kopf: Filter, Suche, Neu */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 shrink-0">
          {FILTER.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === f.value ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Suchen (Firma, Name, Ort)…"
          value={suche}
          onChange={e => setSuche(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <Link
          href="/werbebanden/partner/neu"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shrink-0"
        >
          + Neuer Partner
        </Link>
      </div>

      {/* Summenzeile (nur aktive Partner der aktuellen Ansicht) */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="!py-3">
            <p className="text-xs text-gray-500">Belegte Meter (aktiv)</p>
            <p className="text-lg font-bold text-gray-900">{formatMeter(summeMeter)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!py-3">
            <p className="text-xs text-gray-500">Jahresumsatz brutto (aktiv)</p>
            <p className="text-lg font-bold text-gray-900">{formatEuro(summeBrutto)}</p>
          </CardContent>
        </Card>
      </div>

      {partner === null ? (
        <p className="text-sm text-gray-500 py-8 text-center">Lade Partner…</p>
      ) : gefiltert.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Keine Partner gefunden.</p>
      ) : (
        <>
          {/* Mobile: Karten */}
          <ul className="space-y-2 lg:hidden">
            {gefiltert.map(p => (
              <li key={p.id}>
                <Link href={`/werbebanden/partner/${p.id}`} className="block">
                  <Card className="hover:border-emerald-300 transition-colors">
                    <CardContent className="!px-4 !py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{p.firma}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {p.ansprechpartner || '—'} · {p.ort || '—'}
                          </p>
                        </div>
                        <Badge variant={p.status === 'aktiv' ? 'success' : 'danger'}>
                          {p.status === 'aktiv' ? 'Aktiv' : 'Gekündigt'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
                        <span>{formatMeter(p.berechneteLaenge)} · {formatEuro(p.preisProMeter)}/m</span>
                        {p.abschnitt && <span>Abschnitt {p.abschnitt}{p.positionNr ? ` · Pos. ${p.positionNr}` : ''}</span>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: Tabelle */}
          <Card className="hidden lg:block overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 font-semibold">Firma</th>
                  <th className="px-4 py-3 font-semibold">Ansprechpartner</th>
                  <th className="px-4 py-3 font-semibold">Position</th>
                  <th className="px-4 py-3 font-semibold text-right">Lfd. Meter</th>
                  <th className="px-4 py-3 font-semibold text-right">Preis/m</th>
                  <th className="px-4 py-3 font-semibold text-right">Brutto/Jahr</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gefiltert.map(p => (
                  <tr key={p.id} className="hover:bg-emerald-50/50">
                    <td className="px-4 py-3">
                      <Link href={`/werbebanden/partner/${p.id}`} className="font-medium text-gray-900 hover:text-emerald-700 hover:underline">
                        {p.firma}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.ansprechpartner || '—'}</td>
                    <td className="px-4 py-3 text-gray-600" title={p.abschnitt ? abschnittName(p.abschnitt) : undefined}>
                      {p.abschnitt ? `Abschnitt ${p.abschnitt}${p.positionNr ? ` · Pos. ${p.positionNr}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">{formatMeter(p.berechneteLaenge)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatEuro(p.preisProMeter)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatEuro(p.berechneteLaenge * p.preisProMeter * 1.19)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === 'aktiv' ? 'success' : 'danger'}>
                        {p.status === 'aktiv' ? 'Aktiv' : 'Gekündigt'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  )
}
