'use client'

// Einstellungen: Vorgaben (Standard-Pfand, Ausgeber-Name),
// Pfandkasse (Bestand aus Buchungssumme + manuelle Buchung).

import { useEffect, useState } from 'react'
import { datumKurz } from './typen'

interface PfandBuchung {
  id: string
  betrag: number
  notiz: string
  createdAt: string
}

export function EinstellungenView() {
  const [standardPfand, setStandardPfand] = useState('20')
  const [ausgeberName, setAusgeberName] = useState('')
  const [meldung, setMeldung] = useState<string | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)

  const [bestand, setBestand] = useState(0)
  const [buchungen, setBuchungen] = useState<PfandBuchung[]>([])
  const [buchungBetrag, setBuchungBetrag] = useState('')
  const [buchungNotiz, setBuchungNotiz] = useState('')

  const laden = async () => {
    const [eRes, pRes] = await Promise.all([
      fetch('/api/schluessel/einstellungen'),
      fetch('/api/schluessel/pfand'),
    ])
    if (eRes.ok) {
      const e = await eRes.json()
      setStandardPfand(String(e.standardPfand ?? 20))
      setAusgeberName(e.ausgeberName ?? '')
    }
    if (pRes.ok) {
      const p = await pRes.json()
      setBestand(p.bestand)
      setBuchungen(p.buchungen)
    }
  }
  useEffect(() => {
    laden()
  }, [])

  const speichern = async () => {
    setMeldung(null)
    setFehler(null)
    const res = await fetch('/api/schluessel/einstellungen', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ standardPfand, ausgeberName }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setFehler(j.error || 'Speichern fehlgeschlagen')
      return
    }
    setMeldung('Gespeichert.')
    await laden()
  }

  const buchen = async () => {
    setFehler(null)
    const res = await fetch('/api/schluessel/pfand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ betrag: buchungBetrag, notiz: buchungNotiz }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setFehler(j.error || 'Buchung fehlgeschlagen')
      return
    }
    setBuchungBetrag('')
    setBuchungNotiz('')
    await laden()
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="font-bold text-gray-900 text-sm mb-3">Vorgaben</h2>
          <label className="block mb-2">
            <span className="text-[10px] font-semibold text-gray-500 uppercase">Standard-Pfand (€)</span>
            <input
              value={standardPfand}
              onChange={e => setStandardPfand(e.target.value)}
              inputMode="decimal"
              className="mt-0.5 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            />
          </label>
          <label className="block mb-2">
            <span className="text-[10px] font-semibold text-gray-500 uppercase">
              Ausgegeben durch (Name auf Belegen)
            </span>
            <input
              value={ausgeberName}
              onChange={e => setAusgeberName(e.target.value)}
              className="mt-0.5 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            />
          </label>
          {meldung && <p className="text-xs text-emerald-700 mb-2">{meldung}</p>}
          {fehler && <p className="text-xs text-red-600 mb-2">{fehler}</p>}
          <button
            onClick={speichern}
            className="text-sm font-semibold bg-amber-600 text-white px-4 py-2 rounded-lg"
          >
            Speichern
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden self-start">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">Pfandkasse</h2>
          <span className="font-bold text-amber-700">
            {bestand.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
          </span>
        </div>
        <div className="px-4 py-3 border-b border-gray-100 flex gap-2">
          <input
            value={buchungBetrag}
            onChange={e => setBuchungBetrag(e.target.value)}
            placeholder="± Betrag"
            inputMode="decimal"
            className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right"
          />
          <input
            value={buchungNotiz}
            onChange={e => setBuchungNotiz(e.target.value)}
            placeholder="Notiz (z.B. Entnahme Kasse)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button
            onClick={buchen}
            disabled={!buchungBetrag.trim()}
            className="text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 shrink-0"
          >
            Buchen
          </button>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            {buchungen.slice(0, 30).map(b => (
              <tr key={b.id}>
                <td className="px-4 py-1.5 text-gray-500 whitespace-nowrap text-xs">
                  {datumKurz(b.createdAt)}
                </td>
                <td className="px-3 py-1.5 text-gray-600 text-xs">{b.notiz}</td>
                <td
                  className={`px-4 py-1.5 text-right whitespace-nowrap font-medium ${
                    b.betrag < 0 ? 'text-red-600' : 'text-emerald-700'
                  }`}
                >
                  {b.betrag > 0 ? '+' : ''}
                  {b.betrag.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                </td>
              </tr>
            ))}
            {buchungen.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-sm text-gray-400" colSpan={3}>
                  Noch keine Buchungen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
