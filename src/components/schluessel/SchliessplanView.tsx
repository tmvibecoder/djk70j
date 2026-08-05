'use client'

// Schließmatrix (Variante 2): Kreuztabelle Tür × ABUS-Schlüsseltyp, erste
// Spalte sticky. Bearbeiten-Modus: Zellen togglen, Türen anlegen/umbenennen/
// löschen. Die Spalte „Einzel" zeigt die Nummer des Einzelschlüssels der Tür.

import { useCallback, useEffect, useState } from 'react'
import { Tuer, Typ } from './typen'

export function SchliessplanView() {
  const [typen, setTypen] = useState<Typ[] | null>(null)
  const [tueren, setTueren] = useState<Tuer[]>([])
  const [eintraege, setEintraege] = useState<Set<string>>(new Set())
  const [bearbeiten, setBearbeiten] = useState(false)
  const [neuTuer, setNeuTuer] = useState('')
  const [neuNummer, setNeuNummer] = useState('')

  const laden = useCallback(async () => {
    const [typenRes, planRes] = await Promise.all([
      fetch('/api/schluessel/typen'),
      fetch('/api/schluessel/schliessplan'),
    ])
    if (typenRes.ok) {
      const alle: Typ[] = await typenRes.json()
      setTypen(alle.filter(t => t.system === 'abus' && t.kategorie !== 'einzel'))
    }
    if (planRes.ok) {
      const plan = await planRes.json()
      setTueren(plan.tueren)
      setEintraege(
        new Set((plan.eintraege as { tuerId: string; typId: string }[]).map(e => `${e.tuerId}:${e.typId}`)),
      )
    }
  }, [])

  useEffect(() => {
    laden()
  }, [laden])

  const toggle = async (tuerId: string, typId: string) => {
    if (!bearbeiten) return
    const key = `${tuerId}:${typId}`
    // Optimistisch togglen, Server bestätigt
    setEintraege(prev => {
      const neu = new Set(prev)
      if (neu.has(key)) neu.delete(key)
      else neu.add(key)
      return neu
    })
    await fetch('/api/schluessel/schliessplan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tuerId, typId }),
    })
  }

  const tuerAnlegen = async () => {
    if (!neuTuer.trim()) return
    await fetch('/api/schluessel/tueren', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: neuTuer, nummer: neuNummer }),
    })
    setNeuTuer('')
    setNeuNummer('')
    await laden()
  }

  const tuerLoeschen = async (tuer: Tuer) => {
    if (!confirm(`Tür „${tuer.name}" samt Matrix-Einträgen löschen?`)) return
    await fetch(`/api/schluessel/tueren/${tuer.id}`, { method: 'DELETE' })
    await laden()
  }

  const tuerUmbenennen = async (tuer: Tuer) => {
    const name = prompt('Neuer Name:', tuer.name)
    if (!name?.trim()) return
    await fetch(`/api/schluessel/tueren/${tuer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...tuer, name }),
    })
    await laden()
  }

  if (!typen) {
    return <div className="text-center text-gray-400 text-sm py-12">Lade Schließplan…</div>
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
          <h2 className="font-bold text-gray-900 text-sm">
            Schließmatrix — welcher Schlüssel sperrt welche Tür
          </h2>
          <button
            onClick={() => setBearbeiten(!bearbeiten)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border shrink-0 ${
              bearbeiten
                ? 'bg-amber-600 border-amber-600 text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {bearbeiten ? 'Fertig' : '✏️ Bearbeiten'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse min-w-full">
            <thead>
              <tr className="text-[11px] uppercase text-gray-500 bg-gray-50">
                <th className="sticky left-0 bg-gray-50 text-left px-4 py-2 font-semibold border-r border-gray-200">
                  Tür
                </th>
                {typen.map(t => (
                  <th key={t.id} className="px-3 py-2 font-semibold text-center whitespace-nowrap">
                    {t.code}
                    {t.bezeichnung && (
                      <>
                        <br />
                        <span className="font-normal normal-case">{t.bezeichnung}</span>
                      </>
                    )}
                  </th>
                ))}
                <th className="px-3 py-2 font-semibold text-center">Einzel</th>
                {bearbeiten && <th className="px-2 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tueren.length === 0 && (
                <tr>
                  <td colSpan={typen.length + 2} className="px-4 py-6 text-sm text-gray-400">
                    Noch keine Türen angelegt — über „Bearbeiten&quot; die erste Tür hinzufügen.
                  </td>
                </tr>
              )}
              {tueren.map(tuer => (
                <tr key={tuer.id}>
                  <td className="sticky left-0 bg-white px-4 py-2 font-medium border-r border-gray-200 whitespace-nowrap">
                    {bearbeiten ? (
                      <button onClick={() => tuerUmbenennen(tuer)} className="hover:underline text-left">
                        {tuer.name}
                      </button>
                    ) : (
                      tuer.name
                    )}
                  </td>
                  {typen.map(t => {
                    const aktiv = eintraege.has(`${tuer.id}:${t.id}`)
                    return (
                      <td
                        key={t.id}
                        onClick={() => toggle(tuer.id, t.id)}
                        className={`text-center font-bold ${
                          aktiv ? 'text-emerald-600' : 'text-gray-200'
                        } ${bearbeiten ? 'cursor-pointer hover:bg-amber-50' : ''}`}
                      >
                        {aktiv ? '✓' : '·'}
                      </td>
                    )
                  })}
                  <td className="text-center text-gray-500 text-xs whitespace-nowrap">
                    {tuer.nummer ? `Nr. ${tuer.nummer}` : '–'}
                  </td>
                  {bearbeiten && (
                    <td className="px-2 text-center">
                      <button
                        onClick={() => tuerLoeschen(tuer)}
                        className="text-xs text-red-500 hover:text-red-700"
                        title="Tür löschen"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bearbeiten && (
          <div className="px-4 py-2.5 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
            <input
              value={neuTuer}
              onChange={e => setNeuTuer(e.target.value)}
              placeholder="Neue Tür (z.B. Heimkabine)"
              className="bg-gray-50 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            />
            <input
              value={neuNummer}
              onChange={e => setNeuNummer(e.target.value)}
              placeholder="Einzelschl.-Nr."
              className="bg-gray-50 w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            />
            <button
              onClick={tuerAnlegen}
              disabled={!neuTuer.trim()}
              className="text-xs font-semibold bg-amber-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 shrink-0"
            >
              + Tür
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2 px-1">
        Erste Spalte bleibt beim Scrollen stehen. Im Bearbeiten-Modus Zellen antippen zum Setzen/Entfernen.
      </p>
    </div>
  )
}
