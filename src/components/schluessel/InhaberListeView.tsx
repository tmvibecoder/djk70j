'use client'

// Inhaberliste (Variante 2): Suche + Bereichsfilter, Desktop-Tabelle,
// am Handy Karten-Liste (responsives Doppel-Layout wie bei Werbebanden).
// Fußzeile: aktive Inhaber, ausgegebene Schlüssel, Pfandsumme.

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Person, datumKurz, euro, exemplarBadge } from './typen'

function badgeKlasse(system: string, code: string): string {
  if (code === 'GHS') return 'bg-gray-900 text-white'
  if (system === 'transponder') return 'bg-amber-100 text-amber-800'
  return 'bg-gray-100 text-gray-700'
}

function PersonBadges({ person, max = 3 }: { person: Person; max?: number }) {
  const aktive = person.ausgaben
  return (
    <span className="space-x-1">
      {aktive.slice(0, max).map(a => (
        <span
          key={a.id}
          className={`text-xs px-1.5 py-0.5 rounded ${badgeKlasse(a.exemplar.typ.system, a.exemplar.typ.code)}`}
        >
          {exemplarBadge(a.exemplar, a.exemplar.typ)}
        </span>
      ))}
      {aktive.length > max && (
        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
          +{aktive.length - max}
        </span>
      )}
    </span>
  )
}

export function InhaberListeView() {
  const [personen, setPersonen] = useState<Person[] | null>(null)
  const [suche, setSuche] = useState('')
  const [bereich, setBereich] = useState('')
  const [neuOffen, setNeuOffen] = useState(false)

  const laden = async () => {
    const res = await fetch('/api/schluessel/personen')
    if (res.ok) setPersonen(await res.json())
  }
  useEffect(() => {
    laden()
  }, [])

  const bereiche = useMemo(
    () => Array.from(new Set((personen ?? []).map(p => p.bereich).filter(Boolean))).sort(),
    [personen],
  )

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()
    return (personen ?? []).filter(
      p =>
        (!q || p.name.toLowerCase().includes(q) || p.funktion.toLowerCase().includes(q)) &&
        (!bereich || p.bereich === bereich),
    )
  }, [personen, suche, bereich])

  if (!personen) {
    return <div className="text-center text-gray-400 text-sm py-12">Lade Inhaber…</div>
  }

  const aktiveInhaber = personen.filter(p => p.ausgaben.length > 0)
  const schluesselGesamt = personen.reduce((s, p) => s + p.ausgaben.length, 0)
  const pfandSumme = personen.reduce(
    (s, p) => s + p.ausgaben.reduce((x, a) => x + a.pfandBetrag, 0),
    0,
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="search"
          value={suche}
          onChange={e => setSuche(e.target.value)}
          placeholder="🔍 Name suchen…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50"
        />
        <select
          value={bereich}
          onChange={e => setBereich(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50"
        >
          <option value="">Alle Bereiche</option>
          {bereiche.map(b => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <button
          onClick={() => setNeuOffen(!neuOffen)}
          className="text-sm font-semibold bg-amber-600 text-white px-4 py-2 rounded-lg shrink-0"
        >
          + Person
        </button>
      </div>

      {neuOffen && (
        <NeuPersonFormular
          onFertig={async () => {
            setNeuOffen(false)
            await laden()
          }}
          onAbbrechen={() => setNeuOffen(false)}
        />
      )}

      {/* Desktop: Tabelle */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase text-gray-500 bg-gray-50">
                <th className="text-left px-4 py-2 font-semibold">Name</th>
                <th className="text-left px-3 py-2 font-semibold">Funktion</th>
                <th className="text-left px-3 py-2 font-semibold">Schlüssel</th>
                <th className="text-right px-3 py-2 font-semibold">Pfand</th>
                <th className="text-left px-3 py-2 font-semibold">Seit</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gefiltert.map(p => (
                <tr key={p.id} className="hover:bg-amber-50/40">
                  <td className="px-4 py-2.5 font-semibold">{p.name}</td>
                  <td className="px-3 py-2.5 text-gray-600">
                    {[p.funktion, p.bereich].filter(Boolean).join(' · ') || '–'}
                  </td>
                  <td className="px-3 py-2.5">
                    {p.ausgaben.length > 0 ? <PersonBadges person={p} /> : <span className="text-gray-400 text-xs">keine</span>}
                  </td>
                  <td className="text-right px-3 py-2.5">
                    {euro(p.ausgaben.reduce((s, a) => s + a.pfandBetrag, 0))}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500">
                    {p.ausgaben[0] ? datumKurz(p.ausgaben[0].ausgabeDatum) : '–'}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link href={`/schluessel/inhaber/${p.id}`} className="text-xs text-amber-700 font-medium">
                      Detail →
                    </Link>
                  </td>
                </tr>
              ))}
              {gefiltert.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-sm text-gray-400">
                    Keine Personen gefunden.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <td className="px-4 py-2" colSpan={3}>
                  {aktiveInhaber.length} aktive Inhaber · {schluesselGesamt} Schlüssel ausgegeben
                </td>
                <td className="text-right px-3 py-2 font-semibold text-gray-700">Σ {euro(pfandSumme)}</td>
                <td colSpan={2} className="px-3 py-2">
                  Pfand offen
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Mobil: Karten */}
      <div className="sm:hidden space-y-2">
        {gefiltert.map(p => (
          <Link
            key={p.id}
            href={`/schluessel/inhaber/${p.id}`}
            className="block bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm">{p.name}</span>
              <span className="text-xs text-gray-500">
                {euro(p.ausgaben.reduce((s, a) => s + a.pfandBetrag, 0))}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {[p.funktion, p.bereich].filter(Boolean).join(' · ') || '—'}
            </div>
            <div className="mt-1.5">
              {p.ausgaben.length > 0 ? (
                <PersonBadges person={p} max={5} />
              ) : (
                <span className="text-xs text-gray-400">keine Schlüssel</span>
              )}
            </div>
          </Link>
        ))}
        {gefiltert.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">Keine Personen gefunden.</p>
        )}
        <p className="text-xs text-gray-500 text-center pt-2">
          {aktiveInhaber.length} aktive Inhaber · {schluesselGesamt} Schlüssel · Pfand {euro(pfandSumme)}
        </p>
      </div>
    </div>
  )
}

export function NeuPersonFormular({
  onFertig,
  onAbbrechen,
}: {
  onFertig: (person: Person) => void | Promise<void>
  onAbbrechen: () => void
}) {
  const [daten, setDaten] = useState({ name: '', bereich: '', funktion: '', adresse: '', telefon: '', email: '' })
  const [fehler, setFehler] = useState<string | null>(null)
  const feld = (k: keyof typeof daten, placeholder: string, breit = false) => (
    <input
      value={daten[k]}
      onChange={e => setDaten({ ...daten, [k]: e.target.value })}
      placeholder={placeholder}
      className={`bg-gray-50 rounded-lg border border-gray-300 px-3 py-1.5 text-sm ${breit ? 'sm:col-span-2' : ''}`}
    />
  )
  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 mb-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Neue Person</div>
      <div className="grid sm:grid-cols-2 gap-2">
        {feld('name', 'Name *')}
        {feld('funktion', 'Funktion (z.B. Trainer E-Jugend)')}
        {feld('bereich', 'Bereich (z.B. Vorstand, Trainer, Pächter)')}
        {feld('telefon', 'Telefon')}
        {feld('adresse', 'Adresse', true)}
        {feld('email', 'E-Mail', true)}
      </div>
      {fehler && <p className="text-xs text-red-600 mt-2">{fehler}</p>}
      <div className="flex gap-2 mt-3">
        <button
          onClick={async () => {
            setFehler(null)
            const res = await fetch('/api/schluessel/personen', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(daten),
            })
            if (!res.ok) {
              const j = await res.json().catch(() => ({}))
              setFehler(j.error || 'Anlegen fehlgeschlagen')
              return
            }
            await onFertig(await res.json())
          }}
          disabled={!daten.name.trim()}
          className="text-sm font-semibold bg-amber-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Anlegen
        </button>
        <button onClick={onAbbrechen} className="text-sm text-gray-500 px-2">
          Abbrechen
        </button>
      </div>
    </div>
  )
}
