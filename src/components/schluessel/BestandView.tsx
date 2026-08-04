'use client'

// Bestand: je System eine Tabelle (Variante 2 „Kompakt-Tabellen").
// ABUS/Schrank/Sonstige aggregiert je Typ (Zeile aufklappbar → Exemplare),
// Transponder direkt als Exemplar-Liste mit Inhaber. Verwaltung inline:
// Typ anlegen, Exemplare anlegen, Status ändern, Exemplar ohne Historie löschen.

import { useCallback, useEffect, useState } from 'react'
import {
  Exemplar,
  STATUS_BADGE,
  STATUS_LABELS,
  SYSTEM_LABELS,
  Typ,
  datumKurz,
  typLabel,
} from './typen'

const SYSTEME = ['abus', 'transponder', 'schrank', 'sonstige'] as const
const NEU_STATUS = ['archiv', 'keygarage', 'verloren', 'gesperrt'] as const

function zaehle(typ: Typ, status: string): number {
  return typ.exemplare.filter(e => e.status === status).length
}

export function BestandView() {
  const [typen, setTypen] = useState<Typ[] | null>(null)
  const [offenTyp, setOffenTyp] = useState<string | null>(null)
  const [neuTypSystem, setNeuTypSystem] = useState<string | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)

  const laden = useCallback(async () => {
    const res = await fetch('/api/schluessel/typen')
    if (res.ok) setTypen(await res.json())
  }, [])

  useEffect(() => {
    laden()
  }, [laden])

  const aktion = async (url: string, method: string, body?: unknown) => {
    setFehler(null)
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setFehler(j.error || 'Aktion fehlgeschlagen')
    }
    await laden()
  }

  if (!typen) {
    return <div className="text-center text-gray-400 text-sm py-12">Lade Bestand…</div>
  }

  return (
    <div>
      {fehler && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">
          {fehler}
        </div>
      )}

      {SYSTEME.map(system => {
        const gruppe = typen.filter(t => t.system === system)
        return (
          <div key={system} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
              <h2 className="font-bold text-gray-900 text-sm">{SYSTEM_LABELS[system]}</h2>
              <button
                onClick={() => setNeuTypSystem(neuTypSystem === system ? null : system)}
                className="text-xs font-medium text-amber-700 hover:text-amber-900 shrink-0"
              >
                + Schlüsseltyp
              </button>
            </div>

            {neuTypSystem === system && (
              <NeuTypFormular
                system={system}
                onAnlegen={async daten => {
                  await aktion('/api/schluessel/typen', 'POST', daten)
                  setNeuTypSystem(null)
                }}
                onAbbrechen={() => setNeuTypSystem(null)}
              />
            )}

            {gruppe.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-400">Noch keine Schlüsseltypen angelegt.</p>
            ) : system === 'transponder' ? (
              <TransponderTabelle gruppe={gruppe} onAktion={aktion} />
            ) : (
              <AggregatTabelle
                gruppe={gruppe}
                offenTyp={offenTyp}
                setOffenTyp={setOffenTyp}
                onAktion={aktion}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function NeuTypFormular({
  system,
  onAnlegen,
  onAbbrechen,
}: {
  system: string
  onAnlegen: (daten: Record<string, string>) => Promise<void>
  onAbbrechen: () => void
}) {
  const [code, setCode] = useState('')
  const [bezeichnung, setBezeichnung] = useState('')
  return (
    <div className="px-4 py-3 bg-amber-50/50 border-b border-amber-100 flex flex-col sm:flex-row gap-2">
      <input
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder={system === 'abus' ? 'Code (z.B. GS2, 14)' : 'Code (z.B. Halle, SY0005)'}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-full sm:w-40"
      />
      <input
        value={bezeichnung}
        onChange={e => setBezeichnung(e.target.value)}
        placeholder="Bezeichnung (z.B. Trainer)"
        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
      />
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => code.trim() && onAnlegen({ system, code, bezeichnung })}
          className="text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
          disabled={!code.trim()}
        >
          Anlegen
        </button>
        <button onClick={onAbbrechen} className="text-xs text-gray-500 px-2">
          Abbrechen
        </button>
      </div>
    </div>
  )
}

function inhaberVon(exemplar: Exemplar): string | null {
  const aktive = exemplar.ausgaben[0]
  if (!aktive?.person) return null
  const zusatz = aktive.person.funktion || aktive.person.bereich
  return zusatz ? `${aktive.person.name} (${zusatz})` : aktive.person.name
}

function AggregatTabelle({
  gruppe,
  offenTyp,
  setOffenTyp,
  onAktion,
}: {
  gruppe: Typ[]
  offenTyp: string | null
  setOffenTyp: (id: string | null) => void
  onAktion: (url: string, method: string, body?: unknown) => Promise<void>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase text-gray-500 bg-gray-50">
            <th className="text-left px-4 py-2 font-semibold">Schlüssel</th>
            <th className="text-right px-3 py-2 font-semibold">Gesamt</th>
            <th className="text-right px-3 py-2 font-semibold">Ausgeg.</th>
            <th className="text-right px-3 py-2 font-semibold">Archiv</th>
            <th className="text-right px-3 py-2 font-semibold">Keygarage</th>
            <th className="text-right px-4 py-2 font-semibold">Verloren</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {gruppe.map(typ => {
            const verloren = zaehle(typ, 'verloren') + zaehle(typ, 'gesperrt')
            const offen = offenTyp === typ.id
            return (
              <TypZeilen
                key={typ.id}
                typ={typ}
                verloren={verloren}
                offen={offen}
                onToggle={() => setOffenTyp(offen ? null : typ.id)}
                onAktion={onAktion}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TypZeilen({
  typ,
  verloren,
  offen,
  onToggle,
  onAktion,
}: {
  typ: Typ
  verloren: number
  offen: boolean
  onToggle: () => void
  onAktion: (url: string, method: string, body?: unknown) => Promise<void>
}) {
  const [anzahl, setAnzahl] = useState('1')
  const archiv = zaehle(typ, 'archiv')
  const ausgegeben = zaehle(typ, 'ausgegeben')
  const keygarage = zaehle(typ, 'keygarage')
  const inhaber = typ.exemplare.map(inhaberVon).filter(Boolean) as string[]

  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer hover:bg-amber-50/40 ${typ.kategorie === 'general' ? 'font-semibold' : ''}`}
      >
        <td className="px-4 py-2">
          <span className="text-gray-400 text-xs mr-1.5">{offen ? '▾' : '▸'}</span>
          {typLabel(typ)}
        </td>
        <td className="text-right px-3 py-2">{typ.exemplare.length}</td>
        <td className={`text-right px-3 py-2 ${ausgegeben ? 'text-amber-700' : 'text-gray-400'}`}>
          {ausgegeben || '–'}
        </td>
        <td className={`text-right px-3 py-2 ${archiv ? 'text-emerald-700' : 'text-gray-400'}`}>
          {archiv || '–'}
        </td>
        <td className={`text-right px-3 py-2 ${keygarage ? 'text-sky-700' : 'text-gray-400'}`}>
          {keygarage || '–'}
        </td>
        <td className={`text-right px-4 py-2 ${verloren ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
          {verloren || '–'}
        </td>
      </tr>
      {offen && (
        <tr>
          <td colSpan={6} className="px-4 py-3 bg-gray-50/70">
            {inhaber.length > 0 && (
              <p className="text-xs text-gray-600 mb-2">
                <b>Ausgegeben an:</b> {inhaber.join(' · ')}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {typ.exemplare
                .filter(e => e.status !== 'ausgegeben')
                .map(e => (
                  <ExemplarChip key={e.id} exemplar={e} typ={typ} onAktion={onAktion} />
                ))}
              {typ.exemplare.filter(e => e.status !== 'ausgegeben').length === 0 && (
                <span className="text-xs text-gray-400">Keine Exemplare im Lager.</span>
              )}
            </div>
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <input
                value={anzahl}
                onChange={e => setAnzahl(e.target.value)}
                inputMode="numeric"
                className="w-14 rounded-lg border border-gray-300 px-2 py-1 text-xs text-right"
              />
              <button
                onClick={() =>
                  onAktion('/api/schluessel/exemplare', 'POST', {
                    typId: typ.id,
                    anzahl: parseInt(anzahl, 10) || 1,
                    status: 'archiv',
                  })
                }
                className="text-xs font-medium text-amber-700 hover:text-amber-900"
              >
                + Exemplare ins Archiv anlegen
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// Chip eines Lager-Exemplars mit Status-Wechsel (Klick öffnet Auswahl)
function ExemplarChip({
  exemplar,
  typ,
  onAktion,
  mitNummer = true,
}: {
  exemplar: Exemplar
  typ: Typ
  onAktion: (url: string, method: string, body?: unknown) => Promise<void>
  mitNummer?: boolean
}) {
  const [offen, setOffen] = useState(false)
  return (
    <span className="relative inline-flex" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOffen(!offen)}
        className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[exemplar.status] ?? 'bg-gray-100 text-gray-600'}`}
      >
        {mitNummer && exemplar.nummer ? `Nr. ${exemplar.nummer} · ` : ''}
        {STATUS_LABELS[exemplar.status] ?? exemplar.status}
      </button>
      {offen && (
        <span className="absolute z-10 top-6 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex flex-col min-w-32">
          {NEU_STATUS.filter(s => s !== exemplar.status).map(s => (
            <button
              key={s}
              onClick={async () => {
                setOffen(false)
                await onAktion(`/api/schluessel/exemplare/${exemplar.id}`, 'PUT', {
                  ...exemplar,
                  status: s,
                })
              }}
              className="text-left text-xs px-2 py-1.5 hover:bg-gray-50 rounded"
            >
              → {STATUS_LABELS[s]}
            </button>
          ))}
          <button
            onClick={async () => {
              setOffen(false)
              if (confirm(`Exemplar ${typ.code}${exemplar.nummer ? ` Nr. ${exemplar.nummer}` : ''} wirklich entfernen?`)) {
                await onAktion(`/api/schluessel/exemplare/${exemplar.id}`, 'DELETE')
              }
            }}
            className="text-left text-xs px-2 py-1.5 hover:bg-red-50 text-red-600 rounded"
          >
            Entfernen
          </button>
        </span>
      )}
    </span>
  )
}

function TransponderTabelle({
  gruppe,
  onAktion,
}: {
  gruppe: Typ[]
  onAktion: (url: string, method: string, body?: unknown) => Promise<void>
}) {
  const [neuNummer, setNeuNummer] = useState('')
  // Transponder: meist ein Typ „Halle" mit nummerierten Exemplaren
  const exemplare = gruppe
    .flatMap(t => t.exemplare.map(e => ({ ...e, typ: t })))
    .sort((a, b) => (parseInt(a.nummer ?? '0', 10) || 0) - (parseInt(b.nummer ?? '0', 10) || 0))
  const ersterTyp = gruppe[0]

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase text-gray-500 bg-gray-50">
              <th className="text-left px-4 py-2 font-semibold">Nr.</th>
              <th className="text-left px-3 py-2 font-semibold">Status</th>
              <th className="text-left px-3 py-2 font-semibold">Inhaber</th>
              <th className="text-left px-4 py-2 font-semibold">Seit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exemplare.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-sm text-gray-400">
                  Noch keine Transponder angelegt.
                </td>
              </tr>
            )}
            {exemplare.map(e => {
              const verloren = e.status === 'verloren' || e.status === 'gesperrt'
              return (
                <tr key={e.id} className={verloren ? 'text-gray-400' : ''}>
                  <td className={`px-4 py-2 font-mono font-bold ${verloren ? 'line-through' : ''}`}>
                    {e.nummer ?? '–'}
                  </td>
                  <td className="px-3 py-2">
                    {e.status === 'ausgegeben' ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[e.status]}`}>
                        {STATUS_LABELS[e.status]}
                      </span>
                    ) : (
                      <ExemplarChip exemplar={e} typ={e.typ} onAktion={onAktion} mitNummer={false} />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {inhaberVon(e) ?? <span className="text-gray-400">{e.lagerDetail ?? '–'}</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {e.ausgaben[0] ? datumKurz(e.ausgaben[0].ausgabeDatum) : '–'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {ersterTyp && (
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-2">
          <input
            value={neuNummer}
            onChange={e => setNeuNummer(e.target.value)}
            placeholder="Nr."
            inputMode="numeric"
            className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-xs text-right"
          />
          <button
            onClick={async () => {
              if (!neuNummer.trim()) return
              await onAktion('/api/schluessel/exemplare', 'POST', {
                typId: ersterTyp.id,
                anzahl: 1,
                nummer: neuNummer.trim(),
                status: 'archiv',
              })
              setNeuNummer('')
            }}
            className="text-xs font-medium text-amber-700 hover:text-amber-900 disabled:opacity-50"
            disabled={!neuNummer.trim()}
          >
            + Transponder anlegen
          </button>
        </div>
      )}
    </>
  )
}
