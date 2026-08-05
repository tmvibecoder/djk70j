'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Input, Modal, Select } from '@/components/ui'
import {
  RECHNUNG_STATUS_OPTIONEN,
  formatEuro,
  formatMeter,
  rechnungsversandLabel,
  saisonFuerJahr,
} from '@/data/werbebanden'
import { PartnerDto, RechnungDto, formatDatum } from './typen'

type SortSpalte = 'nummer' | 'firma' | 'saison' | 'datum' | 'brutto' | 'status' | 'versandart' | 'versendet'

const SPALTEN: { key: SortSpalte; label: string; rechts?: boolean; mitte?: boolean }[] = [
  { key: 'nummer', label: 'Nummer' },
  { key: 'firma', label: 'Firma' },
  { key: 'saison', label: 'Saison' },
  { key: 'datum', label: 'Datum' },
  { key: 'brutto', label: 'Brutto', rechts: true },
  { key: 'status', label: 'Status' },
  { key: 'versandart', label: 'Versandart' },
  { key: 'versendet', label: 'Versendet', mitte: true },
]

// Sortierwert je Spalte: Zahl oder String; null/leer wird ans Ende sortiert.
function sortWert(r: RechnungDto, spalte: SortSpalte): number | string | null {
  switch (spalte) {
    case 'nummer': return r.jahr * 100000 + r.laufnummer
    case 'firma': return r.firma
    case 'saison': return r.saison
    case 'datum': return r.datum ? Date.parse(r.datum) : null
    case 'brutto': return r.brutto
    case 'status': return RECHNUNG_STATUS_OPTIONEN.findIndex(o => o.value === r.status)
    case 'versandart': return rechnungsversandLabel(r.partner?.rechnungsversand)
    case 'versendet': return r.versendetAm ? Date.parse(r.versendetAm) : null
  }
}

function stempelText(r: RechnungDto): string | null {
  if (!r.versendetAm) return null
  const wann = new Date(r.versendetAm).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  return `${r.versendetVon ? `von ${r.versendetVon} ` : ''}am ${wann}`
}

export function RechnungenView() {
  const [rechnungen, setRechnungen] = useState<RechnungDto[] | null>(null)
  const [saison, setSaison] = useState('alle')
  const [laufOffen, setLaufOffen] = useState(false)
  const [sortierung, setSortierung] = useState<{ spalte: SortSpalte; richtung: 'auf' | 'ab' }>({
    spalte: 'nummer',
    richtung: 'ab',
  })

  const lade = () => {
    fetch(`/api/werbebanden/rechnungen?saison=${encodeURIComponent(saison)}`)
      .then(r => r.json())
      .then(setRechnungen)
      .catch(() => setRechnungen([]))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(lade, [saison])

  const [saisonOptionen, setSaisonOptionen] = useState<string[]>([])
  useEffect(() => {
    // Saison-Filter aus vorhandenen Rechnungen + aktueller Saison aufbauen
    fetch('/api/werbebanden/rechnungen')
      .then(r => r.json())
      .then((alle: RechnungDto[]) => {
        const set = new Set(alle.map(r => r.saison))
        set.add(saisonFuerJahr(new Date().getFullYear()))
        set.add(saisonFuerJahr(new Date().getFullYear() + 1))
        setSaisonOptionen(Array.from(set).sort().reverse())
      })
      .catch(() => {})
  }, [rechnungen?.length])

  const setzeStatus = async (r: RechnungDto, status: string) => {
    await fetch(`/api/werbebanden/rechnungen/${r.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...r, status }),
    })
    lade()
  }

  // Stempel (Benutzer + Zeitpunkt) setzt der Server; hier wird nur der Wunsch gemeldet.
  const setzeVersendet = async (r: RechnungDto, versendet: boolean) => {
    await fetch(`/api/werbebanden/rechnungen/${r.id}/versand`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versendet }),
    })
    lade()
  }

  const loesche = async (r: RechnungDto) => {
    if (!confirm(`Rechnung ${r.nummer} wirklich löschen?`)) return
    await fetch(`/api/werbebanden/rechnungen/${r.id}`, { method: 'DELETE' })
    lade()
  }

  const sortiere = (spalte: SortSpalte) =>
    setSortierung(s => ({
      spalte,
      richtung: s.spalte === spalte && s.richtung === 'auf' ? 'ab' : 'auf',
    }))

  const sortierteRechnungen = useMemo(() => {
    if (!rechnungen) return null
    const faktor = sortierung.richtung === 'auf' ? 1 : -1
    return [...rechnungen].sort((a, b) => {
      const wa = sortWert(a, sortierung.spalte)
      const wb = sortWert(b, sortierung.spalte)
      if (wa === null && wb === null) return 0
      if (wa === null) return 1 // Leerwerte immer ans Ende, unabhängig von der Richtung
      if (wb === null) return -1
      const vergleich = typeof wa === 'string' && typeof wb === 'string'
        ? wa.localeCompare(wb, 'de')
        : Number(wa) - Number(wb)
      return vergleich * faktor
    })
  }, [rechnungen, sortierung])

  const summeBrutto = (rechnungen ?? []).reduce((s, r) => s + r.brutto, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-full sm:w-56">
          <Select
            value={saison}
            onChange={e => setSaison(e.target.value)}
            options={[{ value: 'alle', label: 'Alle Saisons' }, ...saisonOptionen.map(s => ({ value: s, label: `Saison ${s}` }))]}
            aria-label="Saison wählen"
          />
        </div>
        <div className="flex-1 text-sm text-gray-500">
          {rechnungen ? `${rechnungen.length} Rechnungen · ${formatEuro(summeBrutto)} brutto` : ''}
        </div>
        <Button onClick={() => setLaufOffen(true)} className="!bg-emerald-600 hover:!bg-emerald-700">
          🧾 Rechnungslauf starten
        </Button>
      </div>

      {rechnungen === null ? (
        <p className="text-sm text-gray-500 py-8 text-center">Lade Rechnungen…</p>
      ) : rechnungen.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          Noch keine Rechnungen{saison !== 'alle' ? ` für die Saison ${saison}` : ''}. Starte einen Rechnungslauf.
        </p>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                {SPALTEN.map(s => (
                  <th
                    key={s.key}
                    className={`px-4 py-3 font-semibold ${s.rechts ? 'text-right' : s.mitte ? 'text-center' : ''}`}
                    aria-sort={
                      sortierung.spalte === s.key
                        ? sortierung.richtung === 'auf' ? 'ascending' : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      onClick={() => sortiere(s.key)}
                      className={`inline-flex items-center gap-1 uppercase hover:text-gray-900 ${
                        sortierung.spalte === s.key ? 'text-gray-900' : ''
                      }`}
                      title={`Nach ${s.label} sortieren`}
                    >
                      {s.label}
                      <span className={sortierung.spalte === s.key ? '' : 'text-gray-300'}>
                        {sortierung.spalte === s.key ? (sortierung.richtung === 'auf' ? '▲' : '▼') : '▾'}
                      </span>
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(sortierteRechnungen ?? []).map(r => (
                <tr key={r.id} className="hover:bg-emerald-50/50">
                  <td className="px-4 py-3">
                    <Link href={`/werbebanden/rechnungen/${r.id}`} className="font-medium text-gray-900 hover:text-emerald-700 hover:underline whitespace-nowrap">
                      {r.nummer}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.firma}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.saison}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDatum(r.datum)}</td>
                  <td className="px-4 py-3 text-right font-medium whitespace-nowrap">{formatEuro(r.brutto)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={e => setzeStatus(r, e.target.value)}
                      className="text-xs border border-gray-200 rounded-md px-1.5 py-1 bg-gray-50"
                      aria-label={`Status von ${r.nummer}`}
                    >
                      {RECHNUNG_STATUS_OPTIONEN.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {rechnungsversandLabel(r.partner?.rechnungsversand)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={!!r.versendetAm}
                      onChange={e => setzeVersendet(r, e.target.checked)}
                      className="rounded border-gray-300"
                      aria-label={`Rechnung ${r.nummer} als versendet markieren`}
                      title={stempelText(r) ?? 'Noch nicht als versendet protokolliert'}
                    />
                    {r.versendetAm && (
                      <p className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">{stempelText(r)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <a
                      href={`/api/werbebanden/rechnungen/${r.id}/pdf`}
                      className="text-emerald-700 hover:underline text-xs font-medium mr-3"
                    >
                      PDF
                    </a>
                    <button onClick={() => loesche(r)} className="text-gray-400 hover:text-red-600 text-xs" title="Löschen">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {laufOffen && (
        <RechnungslaufModal
          onClose={() => setLaufOffen(false)}
          onFertig={() => { setLaufOffen(false); lade() }}
        />
      )}
    </div>
  )
}

function RechnungslaufModal({ onClose, onFertig }: { onClose: () => void; onFertig: () => void }) {
  const jetzt = new Date().getFullYear()
  const [saison, setSaison] = useState(saisonFuerJahr(jetzt))
  const [jahr, setJahr] = useState(String(jetzt))
  const [partner, setPartner] = useState<PartnerDto[] | null>(null)
  const [ausgewaehlt, setAusgewaehlt] = useState<Set<string>>(new Set())
  const [laufend, setLaufend] = useState(false)
  const [ergebnis, setErgebnis] = useState<{ angelegt: string[]; uebersprungen: string[] } | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/werbebanden/partner?status=aktiv')
      .then(r => r.json())
      .then((alle: PartnerDto[]) => {
        // Vorauswahl: alle aktiven Partner mit Preis > 0 (Gratisbanden nicht)
        const zahlend = alle.filter(p => p.preisProMeter > 0 && p.berechneteLaenge > 0)
        setPartner(alle)
        setAusgewaehlt(new Set(zahlend.map(p => p.id)))
      })
      .catch(() => setPartner([]))
  }, [])

  const umschalten = (id: string) =>
    setAusgewaehlt(s => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const starte = async () => {
    setLaufend(true)
    setFehler(null)
    const res = await fetch('/api/werbebanden/rechnungen/lauf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saison, jahr: parseInt(jahr, 10) || jetzt, partnerIds: Array.from(ausgewaehlt) }),
    })
    setLaufend(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setFehler(j.error || 'Rechnungslauf fehlgeschlagen')
      return
    }
    setErgebnis(await res.json())
  }

  const summe = useMemo(
    () => (partner ?? [])
      .filter(p => ausgewaehlt.has(p.id))
      .reduce((s, p) => s + p.berechneteLaenge * p.preisProMeter * 1.19, 0),
    [partner, ausgewaehlt],
  )

  return (
    <Modal isOpen onClose={onClose} title="Rechnungslauf">
      {ergebnis ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            ✅ {ergebnis.angelegt.length} Rechnung{ergebnis.angelegt.length === 1 ? '' : 'en'} angelegt
            {ergebnis.angelegt.length > 0 && ` (${ergebnis.angelegt[0]} – ${ergebnis.angelegt[ergebnis.angelegt.length - 1]})`}.
          </p>
          {ergebnis.uebersprungen.length > 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Übersprungen (haben für {saison} schon eine Rechnung): {ergebnis.uebersprungen.join(', ')}
            </p>
          )}
          <div className="flex justify-end">
            <Button onClick={onFertig}>Fertig</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Saison" value={saison} onChange={e => setSaison(e.target.value)} placeholder="2025/2026" />
            <Input label="Rechnungsjahr (Nummernkreis)" inputMode="numeric" value={jahr} onChange={e => setJahr(e.target.value)} />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Partner auswählen</p>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {partner === null ? (
                <p className="text-sm text-gray-500 p-3">Lade Partner…</p>
              ) : (
                partner.map(p => (
                  <label key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={ausgewaehlt.has(p.id)}
                      onChange={() => umschalten(p.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="flex-1 min-w-0 truncate">{p.firma}</span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {formatMeter(p.berechneteLaenge)} × {formatEuro(p.preisProMeter)}
                      {p.preisProMeter === 0 && ' (gratis)'}
                    </span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {ausgewaehlt.size} ausgewählt · Summe brutto {formatEuro(summe)}
            </p>
          </div>

          {fehler && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{fehler}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
            <Button onClick={starte} disabled={laufend || ausgewaehlt.size === 0}>
              {laufend ? 'Erzeuge Rechnungen…' : `${ausgewaehlt.size} Rechnungen erzeugen`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
