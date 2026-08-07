'use client'

// Kartendruck-Tab: Druckliste mit Export-Namen in GROSSBUCHSTABEN (so wie
// sie auf die Plastikkarte kommen), Gedruckt-Haken, Nur-Druck-Rubrik (lila)
// und Kartenmuster der Saison. Export als CSV für den Seriendruck
// (Hiti CS200e).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { exportName } from '@/lib/dauerkarten-felder'
import { Karte, Saison, istWunschnummer, kartennummerAnzeige } from './typen'

export function KartendruckView() {
  const [saisons, setSaisons] = useState<Saison[]>([])
  const [saisonId, setSaisonId] = useState('')
  const [saison, setSaison] = useState<Saison | null>(null)
  const [karten, setKarten] = useState<Karte[]>([])
  const [geladen, setGeladen] = useState(false)
  const [nurUngedruckt, setNurUngedruckt] = useState(false)

  const laden = useCallback(async (ziel?: string) => {
    const [sRes, kRes] = await Promise.all([
      fetch('/api/dauerkarten/saisons'),
      fetch(`/api/dauerkarten/karten${ziel ? `?saison=${ziel}` : ''}`),
    ])
    if (sRes.ok) setSaisons(await sRes.json())
    if (kRes.ok) {
      const j = await kRes.json()
      setSaison(j.saison)
      setSaisonId(j.saison.id)
      setKarten(j.karten)
    }
    setGeladen(true)
  }, [])

  useEffect(() => {
    laden()
  }, [laden])

  const sichtbar = useMemo(
    () => (nurUngedruckt ? karten.filter(k => !k.gedruckt) : karten),
    [karten, nurUngedruckt],
  )

  const toggleGedruckt = async (karte: Karte) => {
    // Optimistisch umschalten, kompletter Feldsatz (PUT-Konvention)
    setKarten(prev => prev.map(k => (k.id === karte.id ? { ...k, gedruckt: !k.gedruckt } : k)))
    const res = await fetch(`/api/dauerkarten/karten/${karte.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lfdNr: karte.lfdNr,
        kartennummer: karte.kartennummer,
        kategorie: karte.kategorie,
        preis: karte.preis,
        abweichung: karte.abweichung,
        verteiler: karte.verteiler,
        bemerkung: karte.bemerkung,
        gedruckt: !karte.gedruckt,
      }),
    })
    if (!res.ok) {
      setKarten(prev => prev.map(k => (k.id === karte.id ? { ...k, gedruckt: karte.gedruckt } : k)))
    }
  }

  if (!geladen) return <div className="text-center text-gray-400 text-sm py-12">Lade…</div>
  if (!saison) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-sm text-gray-500">
        Noch keine Saison angelegt.
      </div>
    )
  }

  const gedruckteAnzahl = karten.filter(k => k.gedruckt).length

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden self-start">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <select
              value={saisonId}
              onChange={e => laden(e.target.value)}
              className="bg-white rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-medium"
            >
              {saisons.map(s => (
                <option key={s.id} value={s.id}>
                  Saison {s.bezeichnung}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500">
              {gedruckteAnzahl}/{karten.length} gedruckt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={nurUngedruckt}
                onChange={e => setNurUngedruckt(e.target.checked)}
                className="rounded accent-yellow-500"
              />
              nur ungedruckte
            </label>
            <a
              href={`/api/dauerkarten/export/seriendruck?saison=${saisonId}`}
              className="text-xs font-semibold bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-lg"
            >
              ⬇ Excel für Seriendruck
            </a>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left">Karten-Nr.</th>
                <th className="px-4 py-2 text-left">Aufdruck (GROSS)</th>
                <th className="px-4 py-2 text-right">Preis</th>
                <th className="px-4 py-2 text-center">Gedruckt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sichtbar.map(k => {
                const name = exportName(k.inhaber.vorname, k.inhaber.nachname)
                return (
                  <tr key={k.id} className={k.kategorie === 'druck' ? 'bg-purple-50/40' : undefined}>
                    <td className="px-4 py-2 font-mono">
                      <span className={istWunschnummer(k) ? 'text-yellow-600 font-bold' : ''}>
                        {kartennummerAnzeige(k)}
                        {istWunschnummer(k) ? ' ★' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {name.vorname} {name.nachname}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {k.kategorie === 'druck' ? (
                        <span className="text-purple-600 text-xs">Nur Druck</span>
                      ) : (
                        `${k.preis.toLocaleString('de-DE')} €`
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={k.gedruckt}
                        onChange={() => toggleGedruckt(k)}
                        className="rounded accent-yellow-500"
                      />
                    </td>
                  </tr>
                )
              })}
              {sichtbar.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-400" colSpan={4}>
                    Keine Karten.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 bg-purple-50 border-t border-purple-100 text-xs text-purple-700">
          Lila = Rubrik „Nur Druck&quot; (ab Nr. 200: Kinder, Ehrengäste, Nachbarn) — Karte wird gedruckt,
          aber nicht verkauft/quittiert. Anlegen über „+ Neue Karte&quot; mit Kategorie „Nur Druck&quot;.
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 self-start">
        <h2 className="font-bold text-gray-900 text-sm mb-2">Kartenmuster {saison.bezeichnung}</h2>
        {saison.musterPfad ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/dauerkarten/saisons/${saison.id}/muster`}
            alt={`Kartenmuster ${saison.bezeichnung}`}
            className="rounded-lg border-2 border-gray-900 w-full"
          />
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-lg py-10 text-center text-xs text-gray-400">
            Noch kein Muster hinterlegt —<br />
            Upload unter ⚙️ Einstellungen.
          </div>
        )}
        <p className="text-[11px] text-gray-400 mt-3">
          Druck über Seriendruck (Word) mit dem Excel-Export. Drucker &amp; Material stehen unter
          ⚙️ Einstellungen.
        </p>
      </div>
    </div>
  )
}
