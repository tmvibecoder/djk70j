'use client'

// Abrechnungs-Tab: Verkaufsübersicht + „Wo ist das Geld?" (Bargeldtopf vs.
// Vereinskonto) + Einzahlungen. Zahlen kommen aus /api/dauerkarten/abrechnung
// — dieselbe Rechenfunktion wie die Abrechnungs-PDF.

import { useCallback, useEffect, useState } from 'react'
import type { DkAbrechnung } from '@/lib/dauerkarten-abrechnung'
import { Saison, datumKurz, euro } from './typen'

interface Einzahlung {
  id: string
  datum: string
  betrag: number
  notiz: string
}

export function AbrechnungView() {
  const [saisons, setSaisons] = useState<Saison[]>([])
  const [saisonId, setSaisonId] = useState('')
  const [daten, setDaten] = useState<DkAbrechnung | null>(null)
  const [einzahlungen, setEinzahlungen] = useState<Einzahlung[]>([])
  const [geladen, setGeladen] = useState(false)
  const [betrag, setBetrag] = useState('')
  const [datum, setDatum] = useState('')
  const [notiz, setNotiz] = useState('')
  const [fehler, setFehler] = useState<string | null>(null)

  const laden = useCallback(async (ziel?: string) => {
    const q = ziel ? `?saison=${ziel}` : ''
    const [sRes, aRes, eRes] = await Promise.all([
      fetch('/api/dauerkarten/saisons'),
      fetch(`/api/dauerkarten/abrechnung${q}`),
      fetch(`/api/dauerkarten/einzahlungen${q}`),
    ])
    if (sRes.ok) {
      const s: Saison[] = await sRes.json()
      setSaisons(s)
      if (!ziel) {
        const aktiv = s.find(x => x.aktiv)
        if (aktiv) setSaisonId(aktiv.id)
      } else {
        setSaisonId(ziel)
      }
    }
    if (aRes.ok) setDaten(await aRes.json())
    if (eRes.ok) setEinzahlungen(await eRes.json())
    setGeladen(true)
  }, [])

  useEffect(() => {
    laden()
  }, [laden])

  const einzahlen = async () => {
    setFehler(null)
    const res = await fetch('/api/dauerkarten/einzahlungen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saisonId, betrag, datum: datum || undefined, notiz }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setFehler(j.error || 'Einzahlung fehlgeschlagen')
      return
    }
    setBetrag('')
    setDatum('')
    setNotiz('')
    await laden(saisonId)
  }

  const einzahlungLoeschen = async (id: string) => {
    if (!confirm('Einzahlung wirklich löschen?')) return
    await fetch(`/api/dauerkarten/einzahlungen/${id}`, { method: 'DELETE' })
    await laden(saisonId)
  }

  if (!geladen) return <div className="text-center text-gray-400 text-sm py-12">Lade…</div>
  if (!daten) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-sm text-gray-500">
        Noch keine Saison angelegt.
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <select
          value={saisonId}
          onChange={e => laden(e.target.value)}
          className="bg-white rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium"
        >
          {saisons.map(s => (
            <option key={s.id} value={s.id}>
              Saison {s.bezeichnung}
              {s.aktiv ? ' (aktiv)' : ''}
            </option>
          ))}
        </select>
        <a
          href={`/api/dauerkarten/pdf/abrechnung?saison=${saisonId}`}
          target="_blank"
          className="text-sm font-medium bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg"
        >
          🖨 Abrechnungs-PDF
        </a>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Verkaufsübersicht */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden self-start">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm">Verkaufsübersicht</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2.5 text-gray-600">Erwachsene (Normal)</td>
                <td className="px-3 py-2.5 text-right text-gray-500 whitespace-nowrap">
                  {daten.verkauft.normal.anzahl} × {euro(daten.preisNormal)}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                  {euro(daten.verkauft.normal.summe)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">Ermäßigt (Rentner, Frauen …)</td>
                <td className="px-3 py-2.5 text-right text-gray-500 whitespace-nowrap">
                  {daten.verkauft.ermaessigt.anzahl} × {euro(daten.preisErmaessigt)}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                  {euro(daten.verkauft.ermaessigt.summe)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">Sonderpreis (während der Saison)</td>
                <td className="px-3 py-2.5 text-right text-gray-500 whitespace-nowrap">
                  {daten.verkauft.sonderpreis.anzahl} Karten
                </td>
                <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                  {euro(daten.verkauft.sonderpreis.summe)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">Zusatzzahlungen / Abzüge</td>
                <td></td>
                <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                  {euro(daten.zusatzzahlungen)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">Geschenke</td>
                <td className="px-3 py-2.5 text-right text-gray-500">{daten.geschenke} Karten</td>
                <td className="px-4 py-2.5 text-right text-gray-400">0,00 €</td>
              </tr>
              <tr className="bg-red-50/50">
                <td className="px-4 py-2.5 text-red-700">Noch offen</td>
                <td className="px-3 py-2.5 text-right text-red-600">{daten.offen.anzahl} Karten</td>
                <td className="px-4 py-2.5 text-right font-semibold text-red-600 whitespace-nowrap">
                  {euro(daten.offen.summe)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">Nicht ausgegeben</td>
                <td className="px-3 py-2.5 text-right text-gray-500">{daten.nichtAusgegeben} Karten</td>
                <td></td>
              </tr>
              <tr className="bg-gray-900">
                <td className="px-4 py-3 font-bold text-white">
                  Gesamteinnahmen ({daten.verkauft.gesamtAnzahl} verkauft)
                </td>
                <td></td>
                <td className="px-4 py-3 text-right font-black text-yellow-400 whitespace-nowrap">
                  {euro(daten.gesamtEinnahmen)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          {/* Wo ist das Geld? */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h2 className="font-bold text-gray-900 text-sm mb-3">Wo ist das Geld?</h2>
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-sm">
              <p className="font-semibold text-gray-900 mb-1.5">💶 Bargeldtopf (beim Kassier)</p>
              <div className="text-gray-600 space-y-1">
                <div className="flex justify-between"><span>Bar</span><span>{euro(daten.zahlarten.bar)}</span></div>
                <div className="flex justify-between"><span>Überweisung (Privatkonto → abgehoben)</span><span>{euro(daten.zahlarten.ueberweisung)}</span></div>
                <div className="flex justify-between"><span>PayPal (Privatkonto → abgehoben)</span><span>{euro(daten.zahlarten.paypal)}</span></div>
                <div className="flex justify-between border-t border-yellow-200 pt-1 mt-1 font-semibold text-gray-900">
                  <span>Summe Topf</span><span>{euro(daten.bargeldtopf)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>− Einzahlungen aufs Vereinskonto</span><span>{euro(daten.einzahlungenSumme)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Noch im Topf</span><span>{euro(daten.topfRest)}</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm mt-3">
              <p className="font-semibold text-gray-900 mb-1">💳 Direkt aufs Vereinskonto (POS)</p>
              <div className="flex justify-between text-gray-600">
                <span>{daten.zahlarten.posAnzahl} Kartenzahlungen</span>
                <span className="font-semibold text-gray-900">{euro(daten.kontoPos)}</span>
              </div>
            </div>
          </div>

          {/* Einzahlungen */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-sm">Einzahlungen aufs Vereinskonto</h2>
            </div>
            <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-2">
              <input
                type="date"
                value={datum}
                onChange={e => setDatum(e.target.value)}
                className="bg-gray-50 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
              <input
                value={betrag}
                onChange={e => setBetrag(e.target.value)}
                placeholder="Betrag €"
                inputMode="decimal"
                className="bg-gray-50 w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right"
              />
              <input
                value={notiz}
                onChange={e => setNotiz(e.target.value)}
                placeholder="Notiz"
                className="bg-gray-50 flex-1 min-w-[100px] rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
              <button
                onClick={einzahlen}
                disabled={!betrag.trim()}
                className="text-xs font-semibold bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                Buchen
              </button>
            </div>
            {fehler && <p className="text-xs text-red-600 px-4 py-2">{fehler}</p>}
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {einzahlungen.map(e => (
                  <tr key={e.id}>
                    <td className="px-4 py-1.5 text-gray-500 text-xs whitespace-nowrap">{datumKurz(e.datum)}</td>
                    <td className="px-3 py-1.5 text-gray-600 text-xs">{e.notiz}</td>
                    <td className="px-3 py-1.5 text-right font-medium whitespace-nowrap">{euro(e.betrag)}</td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        onClick={() => einzahlungLoeschen(e.id)}
                        className="text-gray-300 hover:text-red-500"
                        title="Löschen"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                {einzahlungen.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-sm text-gray-400" colSpan={4}>
                      Noch keine Einzahlungen.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
