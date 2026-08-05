'use client'

// Ausgabe-Flow (Variante 2): 1 Empfänger wählen/anlegen → 2 Schlüssel &
// Pfand → 3 Finger-Signatur → Beleg wird gebucht, signiert und als PDF
// mit SHA-256-Prüfsumme erzeugt. ABUS-/Schrank-Typen als Checkbox („n frei"),
// Transponder mit konkreter Nummern-Auswahl.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Person, Typ, typLabel } from './typen'
import { SignaturPad, SignaturPadHandle } from './SignaturPad'
import { NeuPersonFormular } from './InhaberListeView'

interface Position {
  typId: string
  exemplarId?: string
}

export function AusgabeFlowView() {
  const params = useSearchParams()
  const [personen, setPersonen] = useState<Person[]>([])
  const [typen, setTypen] = useState<Typ[]>([])
  const [geladen, setGeladen] = useState(false)
  const [personId, setPersonId] = useState('')
  const [neuPerson, setNeuPerson] = useState(false)
  const [gewaehlt, setGewaehlt] = useState<Map<string, Position>>(new Map())
  const [pfand, setPfand] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [ergebnis, setErgebnis] = useState<{ id: string; hash: string } | null>(null)
  const pad = useRef<SignaturPadHandle>(null)

  const laden = async () => {
    const [pRes, tRes, eRes] = await Promise.all([
      fetch('/api/schluessel/personen'),
      fetch('/api/schluessel/typen'),
      fetch('/api/schluessel/einstellungen'),
    ])
    if (pRes.ok) setPersonen(await pRes.json())
    if (tRes.ok) setTypen(await tRes.json())
    if (eRes.ok) {
      const e = await eRes.json()
      setPfand(prev => prev || String(e.standardPfand ?? 20))
    }
    setGeladen(true)
  }
  useEffect(() => {
    laden()
  }, [])

  // Vorbelegung ?person=<id> (Link vom Inhaber-Detail)
  useEffect(() => {
    const vorgabe = params.get('person')
    if (vorgabe) setPersonId(vorgabe)
  }, [params])

  const verfuegbar = useMemo(
    () =>
      typen
        .map(t => ({
          ...t,
          freie: t.exemplare.filter(e => e.status === 'archiv' || e.status === 'keygarage'),
        }))
        .filter(t => t.freie.length > 0),
    [typen],
  )

  const toggleTyp = (typ: (typeof verfuegbar)[number]) => {
    setGewaehlt(prev => {
      const neu = new Map(prev)
      if (neu.has(typ.id)) {
        neu.delete(typ.id)
      } else {
        neu.set(typ.id, {
          typId: typ.id,
          // Transponder: konkretes Exemplar (erste freie Nummer als Vorgabe)
          exemplarId: typ.system === 'transponder' ? typ.freie[0]?.id : undefined,
        })
      }
      return neu
    })
  }

  const abschicken = async () => {
    const unterschrift = pad.current?.getDataUrl()
    if (!personId) {
      setFehler('Bitte einen Empfänger wählen.')
      return
    }
    if (gewaehlt.size === 0) {
      setFehler('Bitte mindestens einen Schlüssel wählen.')
      return
    }
    if (!unterschrift) {
      setFehler('Bitte zuerst unterschreiben.')
      return
    }
    setFehler(null)
    setLaeuft(true)
    try {
      const res = await fetch('/api/schluessel/ausgaben', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId,
          positionen: Array.from(gewaehlt.values()),
          pfandBetrag: parseFloat(pfand.replace(',', '.')) || 0,
        }),
      })
      const beleg = await res.json()
      if (!res.ok) throw new Error(beleg.error || 'Ausgabe fehlgeschlagen')
      const sigRes = await fetch(`/api/schluessel/belege/${beleg.id}/signieren`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unterschrift }),
      })
      const signiert = await sigRes.json()
      if (!sigRes.ok) throw new Error(signiert.error || 'Signieren fehlgeschlagen')
      setErgebnis({ id: beleg.id, hash: signiert.hash })
      await laden()
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Fehler bei der Ausgabe')
    } finally {
      setLaeuft(false)
    }
  }

  if (!geladen) {
    return <div className="text-center text-gray-400 text-sm py-12">Lade…</div>
  }

  if (ergebnis) {
    const person = personen.find(p => p.id === personId)
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-lg mx-auto">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-emerald-800">
            ✅ Empfangsbestätigung signiert{person ? ` — ${person.name}` : ''}
          </div>
          <div className="text-[10px] text-emerald-700 font-mono mt-1 break-all">SHA-256: {ergebnis.hash}</div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <a
            href={`/api/schluessel/belege/${ergebnis.id}/pdf`}
            target="_blank"
            className="flex-1 text-center text-sm font-semibold bg-amber-600 text-white px-4 py-2 rounded-lg"
          >
            PDF öffnen
          </a>
          <button
            onClick={() => {
              setErgebnis(null)
              setGewaehlt(new Map())
              setPersonId('')
              pad.current?.clear()
            }}
            className="flex-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
          >
            Neue Ausgabe
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">1 · Empfänger</div>
          <select
            value={neuPerson ? '__neu' : personId}
            onChange={e => {
              if (e.target.value === '__neu') {
                setNeuPerson(true)
              } else {
                setNeuPerson(false)
                setPersonId(e.target.value)
              }
            }}
            className="bg-gray-50 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-2"
          >
            <option value="">— Person wählen —</option>
            {personen.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.funktion ? ` — ${p.funktion}` : ''}
              </option>
            ))}
            <option value="__neu">Neue Person anlegen …</option>
          </select>

          {neuPerson && (
            <NeuPersonFormular
              onFertig={async person => {
                setNeuPerson(false)
                setPersonId(person.id)
                await laden()
              }}
              onAbbrechen={() => setNeuPerson(false)}
            />
          )}

          <div className="text-xs font-semibold text-gray-500 uppercase mb-2 mt-4">2 · Schlüssel &amp; Pfand</div>
          {verfuegbar.length === 0 && (
            <p className="text-sm text-gray-400">
              Keine freien Schlüssel im Bestand — zuerst im Tab „Bestand&quot; Exemplare anlegen.
            </p>
          )}
          <div className="space-y-1.5 text-sm">
            {verfuegbar.map(typ => {
              const aktiv = gewaehlt.has(typ.id)
              const position = gewaehlt.get(typ.id)
              return (
                <div key={typ.id}>
                  <label
                    className={`flex items-center justify-between border rounded-lg px-3 py-2 cursor-pointer ${
                      aktiv ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                    }`}
                  >
                    <span>
                      <input
                        type="checkbox"
                        checked={aktiv}
                        onChange={() => toggleTyp(typ)}
                        className="mr-2 accent-amber-600"
                      />
                      {typLabel(typ)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {typ.system === 'transponder'
                        ? `Nr. ${typ.freie.map(e => e.nummer).filter(Boolean).slice(0, 3).join(', ')}${typ.freie.length > 3 ? '…' : ''} frei`
                        : `${typ.freie.length} frei`}
                    </span>
                  </label>
                  {aktiv && typ.system === 'transponder' && typ.freie.length > 1 && (
                    <select
                      value={position?.exemplarId ?? ''}
                      onChange={e =>
                        setGewaehlt(prev => {
                          const neu = new Map(prev)
                          neu.set(typ.id, { typId: typ.id, exemplarId: e.target.value })
                          return neu
                        })
                      }
                      className="bg-gray-50 mt-1 ml-6 rounded-lg border border-gray-300 px-2 py-1 text-xs"
                    >
                      {typ.freie.map(e => (
                        <option key={e.id} value={e.id}>
                          Nr. {e.nummer ?? '?'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-gray-500">Pfand (bar)</span>
            <div>
              <input
                value={pfand}
                onChange={e => setPfand(e.target.value)}
                inputMode="decimal"
                className="bg-gray-50 w-24 text-right rounded-lg border border-gray-300 px-2 py-1 text-sm"
              />
              <span className="ml-1 text-gray-500">€</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">3 · Unterschrift Empfänger</div>
          <SignaturPad ref={pad} />
          {fehler && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mt-3">
              {fehler}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => pad.current?.clear()}
              className="text-xs font-medium bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg"
              title="Unterschrift löschen"
            >
              🗑️
            </button>
            <button
              onClick={abschicken}
              disabled={laeuft}
              className="flex-1 text-sm font-semibold bg-amber-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {laeuft ? 'Signiere…' : 'Signieren & PDF erzeugen'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-3">
            Mit der Unterschrift wird die Empfangsbestätigung erzeugt, mit einer SHA-256-Prüfsumme
            versiegelt und als PDF abgelegt.
          </p>
        </div>
      </div>
    </div>
  )
}
