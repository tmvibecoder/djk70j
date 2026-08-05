'use client'

// Inhaber-Detail: Stammdaten (editierbar), aktive Schlüssel mit
// Rückgabe-Flow (Auswahl → Pfand → Finger-Signatur → Beleg + PDF),
// komplette Historie und Belege der Person.

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Person, PersonAusgabe, datumKurz, euro, typLabel } from './typen'
import { SignaturPad, SignaturPadHandle } from './SignaturPad'

interface PersonVoll extends Person {
  belege: { id: string; art: string; status: string; hash: string | null; signiertAm: string | null; createdAt: string }[]
}

export function InhaberDetailView({ personId }: { personId: string }) {
  const [person, setPerson] = useState<PersonVoll | null>(null)
  const [fehlt, setFehlt] = useState(false)
  const [editOffen, setEditOffen] = useState(false)
  const [rueckgabeOffen, setRueckgabeOffen] = useState(false)

  const laden = useCallback(async () => {
    const res = await fetch(`/api/schluessel/personen/${personId}`)
    if (!res.ok) {
      setFehlt(true)
      return
    }
    setPerson(await res.json())
  }, [personId])

  useEffect(() => {
    laden()
  }, [laden])

  if (fehlt) {
    return <div className="text-center text-gray-400 text-sm py-12">Person nicht gefunden.</div>
  }
  if (!person) {
    return <div className="text-center text-gray-400 text-sm py-12">Lade…</div>
  }

  const aktive = person.ausgaben.filter(a => a.status === 'aktiv')
  const historie = person.ausgaben.filter(a => a.status !== 'aktiv')
  const pfandOffen = aktive.reduce((s, a) => s + a.pfandBetrag, 0)

  return (
    <div>
      <div className="mb-3">
        <Link href="/schluessel/inhaber" className="text-xs text-gray-500 hover:text-gray-800">
          ← Zur Inhaberliste
        </Link>
      </div>

      {/* Stammdaten */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{person.name}</h2>
            <p className="text-sm text-gray-500">
              {[person.funktion, person.bereich].filter(Boolean).join(' · ') || 'Keine Funktion hinterlegt'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {[person.adresse, person.telefon, person.email].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
          <button
            onClick={() => setEditOffen(!editOffen)}
            className="text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 shrink-0"
          >
            ✏️ Bearbeiten
          </button>
        </div>
        {editOffen && (
          <PersonBearbeiten
            person={person}
            onFertig={async () => {
              setEditOffen(false)
              await laden()
            }}
          />
        )}
      </div>

      {/* Aktive Schlüssel + Rückgabe */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
          <h3 className="font-bold text-gray-900 text-sm">
            Aktuelle Schlüssel ({aktive.length}) · Pfand {euro(pfandOffen)}
          </h3>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/schluessel/ausgabe?person=${person.id}`}
              className="text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg"
            >
              + Ausgabe
            </Link>
            {aktive.length > 0 && (
              <button
                onClick={() => setRueckgabeOffen(!rueckgabeOffen)}
                className="text-xs font-medium text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
              >
                ↩ Rückgabe
              </button>
            )}
          </div>
        </div>
        {aktive.length === 0 ? (
          <p className="px-4 py-4 text-sm text-gray-400">Keine Schlüssel ausgegeben.</p>
        ) : rueckgabeOffen ? (
          <RueckgabeFlow person={person} aktive={aktive} onFertig={laden} />
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {aktive.map(a => (
                <tr key={a.id}>
                  <td className="px-4 py-2 font-medium">
                    {typLabel(a.exemplar.typ)}
                    {a.exemplar.nummer ? ` — Nr. ${a.exemplar.nummer}` : ''}
                  </td>
                  <td className="px-3 py-2 text-gray-500 text-right">seit {datumKurz(a.ausgabeDatum)}</td>
                  <td className="px-4 py-2 text-right w-20">{a.pfandBetrag ? euro(a.pfandBetrag) : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Historie */}
      {historie.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Historie</h3>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {historie.map(a => (
                <tr key={a.id} className="text-gray-500">
                  <td className="px-4 py-2">
                    {typLabel(a.exemplar.typ)}
                    {a.exemplar.nummer ? ` — Nr. ${a.exemplar.nummer}` : ''}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {datumKurz(a.ausgabeDatum)} – {datumKurz(a.rueckgabeDatum)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Belege */}
      {person.belege.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Belege</h3>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {person.belege.map(b => (
                <tr key={b.id}>
                  <td className="px-4 py-2">
                    {b.art === 'ausgabe' ? 'Empfangsbestätigung' : 'Rückgabebestätigung'}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{datumKurz(b.createdAt)}</td>
                  <td className="px-3 py-2">
                    {b.status === 'signiert' ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">signiert</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">offen</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {b.status === 'signiert' && (
                      <a
                        href={`/api/schluessel/belege/${b.id}/pdf`}
                        target="_blank"
                        className="text-xs text-amber-700 font-medium"
                      >
                        PDF →
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PersonBearbeiten({ person, onFertig }: { person: Person; onFertig: () => Promise<void> }) {
  const [daten, setDaten] = useState({
    name: person.name,
    bereich: person.bereich,
    funktion: person.funktion,
    adresse: person.adresse,
    telefon: person.telefon,
    email: person.email,
  })
  const feld = (k: keyof typeof daten, label: string, breit = false) => (
    <label className={`block ${breit ? 'sm:col-span-2' : ''}`}>
      <span className="text-[10px] font-semibold text-gray-500 uppercase">{label}</span>
      <input
        value={daten[k]}
        onChange={e => setDaten({ ...daten, [k]: e.target.value })}
        className="bg-gray-50 mt-0.5 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
      />
    </label>
  )
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="grid sm:grid-cols-2 gap-2">
        {feld('name', 'Name')}
        {feld('funktion', 'Funktion')}
        {feld('bereich', 'Bereich')}
        {feld('telefon', 'Telefon')}
        {feld('adresse', 'Adresse', true)}
        {feld('email', 'E-Mail', true)}
      </div>
      <button
        onClick={async () => {
          await fetch(`/api/schluessel/personen/${person.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(daten),
          })
          await onFertig()
        }}
        disabled={!daten.name.trim()}
        className="mt-3 text-sm font-semibold bg-amber-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
      >
        Speichern
      </button>
    </div>
  )
}

// Rückgabe: Schlüssel auswählen, Pfand-Rückzahlung angeben, unterschreiben.
// Bucht sofort (Exemplar → Archiv) und signiert den Rückgabe-Beleg.
function RueckgabeFlow({
  person,
  aktive,
  onFertig,
}: {
  person: Person
  aktive: PersonAusgabe[]
  onFertig: () => Promise<void>
}) {
  const [gewaehlt, setGewaehlt] = useState<Set<string>>(new Set(aktive.map(a => a.id)))
  const [pfand, setPfand] = useState(String(aktive.reduce((s, a) => s + a.pfandBetrag, 0)))
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [ergebnis, setErgebnis] = useState<{ id: string; hash: string } | null>(null)
  const pad = useRef<SignaturPadHandle>(null)

  const toggle = (id: string) => {
    setGewaehlt(prev => {
      const neu = new Set(prev)
      if (neu.has(id)) neu.delete(id)
      else neu.add(id)
      return neu
    })
  }

  const abschicken = async () => {
    const unterschrift = pad.current?.getDataUrl()
    if (!unterschrift) {
      setFehler('Bitte zuerst unterschreiben.')
      return
    }
    setFehler(null)
    setLaeuft(true)
    try {
      const res = await fetch('/api/schluessel/rueckgaben', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: person.id,
          ausgabeIds: Array.from(gewaehlt),
          pfandZurueck: parseFloat(pfand.replace(',', '.')) || 0,
        }),
      })
      const beleg = await res.json()
      if (!res.ok) throw new Error(beleg.error || 'Rückgabe fehlgeschlagen')
      const sigRes = await fetch(`/api/schluessel/belege/${beleg.id}/signieren`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unterschrift }),
      })
      const signiert = await sigRes.json()
      if (!sigRes.ok) throw new Error(signiert.error || 'Signieren fehlgeschlagen')
      setErgebnis({ id: beleg.id, hash: signiert.hash })
      await onFertig()
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Fehler bei der Rückgabe')
    } finally {
      setLaeuft(false)
    }
  }

  if (ergebnis) {
    return (
      <div className="p-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="text-sm font-semibold text-emerald-800">✅ Rückgabe bestätigt</div>
          <div className="text-[10px] text-emerald-700 font-mono mt-1 break-all">SHA-256: {ergebnis.hash}</div>
          <a
            href={`/api/schluessel/belege/${ergebnis.id}/pdf`}
            target="_blank"
            className="inline-block mt-2 text-xs font-semibold text-emerald-800 underline"
          >
            Rückgabebestätigung (PDF) öffnen
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <div className="space-y-1.5 text-sm">
        {aktive.map(a => (
          <label
            key={a.id}
            className={`flex items-center justify-between border rounded-lg px-3 py-2 cursor-pointer ${
              gewaehlt.has(a.id) ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
            }`}
          >
            <span>
              <input
                type="checkbox"
                checked={gewaehlt.has(a.id)}
                onChange={() => toggle(a.id)}
                className="mr-2 accent-amber-600"
              />
              {typLabel(a.exemplar.typ)}
              {a.exemplar.nummer ? ` — Nr. ${a.exemplar.nummer}` : ''}
            </span>
            <span className="text-xs text-gray-500">seit {datumKurz(a.ausgabeDatum)}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Pfand zurück (bar)</span>
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
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Unterschrift {person.name}</div>
        <SignaturPad ref={pad} />
      </div>
      {fehler && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{fehler}</div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => pad.current?.clear()}
          className="text-xs font-medium bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg"
        >
          🗑️
        </button>
        <button
          onClick={abschicken}
          disabled={laeuft || gewaehlt.size === 0}
          className="flex-1 text-sm font-semibold bg-amber-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {laeuft ? 'Signiere…' : 'Rückgabe signieren & PDF erzeugen'}
        </button>
      </div>
    </div>
  )
}
