'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge, Card, CardContent } from '@/components/ui'
import {
  BROSCHUERENVERSAND_OPTIONEN,
  RECHNUNGSVERSAND_OPTIONEN,
  formatEuro,
  groesseKurzLabel,
  versandLabel,
} from '@/data/djk-info'
import { useDarfVerwalten } from './InfoShell'
import { KundeDto, PreisDto } from './typen'

const FILTER = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'gekuendigt', label: 'Gekündigt' },
  { value: 'alle', label: 'Alle' },
]

export function KundenListeView() {
  const darfVerwalten = useDarfVerwalten()
  const [kunden, setKunden] = useState<KundeDto[] | null>(null)
  const [preise, setPreise] = useState<PreisDto[]>([])
  const [filter, setFilter] = useState('aktiv')
  const [suche, setSuche] = useState('')

  useEffect(() => {
    fetch('/api/djk-info/preise')
      .then(r => r.json())
      .then(setPreise)
      .catch(() => {})
  }, [])

  useEffect(() => {
    let aktiv = true
    fetch(`/api/djk-info/kunden?status=${filter}`)
      .then(r => r.json())
      .then(data => { if (aktiv) setKunden(data) })
      .catch(() => { if (aktiv) setKunden([]) })
    return () => { aktiv = false }
  }, [filter])

  const jahresNetto = (groesse: string) => preise.find(p => p.groesse === groesse)?.jahresNetto ?? 0

  const gefiltert = (kunden ?? []).filter(k => {
    if (!suche.trim()) return true
    const s = suche.toLowerCase()
    return [k.firma, k.zusatz, k.ansprechpartnerInhaber, k.ort].some(f => f?.toLowerCase().includes(s))
  })

  const aktive = gefiltert.filter(k => k.status === 'aktiv')
  const summeBrutto = aktive.reduce((s, k) => s + jahresNetto(k.anzeigenGroesse) * 1.19, 0)

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
        {darfVerwalten && (
          <Link
            href="/djk-info/kunden/neu"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shrink-0"
          >
            + Neuer Kunde
          </Link>
        )}
      </div>

      {/* Summenzeile (nur aktive Kunden der aktuellen Ansicht) */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="!py-3">
            <p className="text-xs text-gray-500">Aktive Kunden</p>
            <p className="text-lg font-bold text-gray-900">{aktive.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!py-3">
            <p className="text-xs text-gray-500">Jahresumsatz brutto (aktiv)</p>
            <p className="text-lg font-bold text-gray-900">{formatEuro(summeBrutto)}</p>
          </CardContent>
        </Card>
      </div>

      {kunden === null ? (
        <p className="text-sm text-gray-500 py-8 text-center">Lade Kunden…</p>
      ) : gefiltert.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Keine Kunden gefunden.</p>
      ) : (
        <>
          {/* Mobile: Karten */}
          <ul className="space-y-2 lg:hidden">
            {gefiltert.map(k => (
              <li key={k.id}>
                <Link href={`/djk-info/kunden/${k.id}`} className="block">
                  <Card className="hover:border-emerald-300 transition-colors">
                    <CardContent className="!px-4 !py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{k.firma}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {k.ansprechpartnerInhaber || k.zusatz || '—'} · {k.ort || '—'}
                          </p>
                        </div>
                        <Badge variant={k.status === 'aktiv' ? 'success' : 'danger'}>
                          {k.status === 'aktiv' ? 'Aktiv' : 'Gekündigt'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
                        <span>{groesseKurzLabel(k.anzeigenGroesse)}</span>
                        {k.status === 'aktiv' && jahresNetto(k.anzeigenGroesse) > 0 && (
                          <span>{formatEuro(jahresNetto(k.anzeigenGroesse))} netto/Jahr</span>
                        )}
                        <span>Rechnung: {versandLabel(k.rechnungsversand, RECHNUNGSVERSAND_OPTIONEN)}</span>
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
                  <th className="px-4 py-3 font-semibold">Größe</th>
                  <th className="px-4 py-3 font-semibold text-right">Netto/Jahr</th>
                  <th className="px-4 py-3 font-semibold">Rechnung per</th>
                  <th className="px-4 py-3 font-semibold">Broschüre per</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gefiltert.map(k => (
                  <tr key={k.id} className="hover:bg-emerald-50/50">
                    <td className="px-4 py-3">
                      <Link href={`/djk-info/kunden/${k.id}`} className="font-medium text-gray-900 hover:text-emerald-700 hover:underline">
                        {k.firma}
                      </Link>
                      {k.zusatz && <span className="block text-xs text-gray-500">{k.zusatz}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{k.ansprechpartnerInhaber || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{groesseKurzLabel(k.anzeigenGroesse)}</td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {jahresNetto(k.anzeigenGroesse) > 0 ? formatEuro(jahresNetto(k.anzeigenGroesse)) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{versandLabel(k.rechnungsversand, RECHNUNGSVERSAND_OPTIONEN)}</td>
                    <td className="px-4 py-3 text-gray-600">{versandLabel(k.broschuerenversand, BROSCHUERENVERSAND_OPTIONEN)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={k.status === 'aktiv' ? 'success' : 'danger'}>
                        {k.status === 'aktiv' ? 'Aktiv' : 'Gekündigt'}
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
