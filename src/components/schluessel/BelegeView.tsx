'use client'

// Beleg-Liste: alle Empfangs-/Rückgabebestätigungen mit serverseitig
// nachgerechneter Hash-Prüfung (✓ unverändert / ⚠ Abweichung) und
// PDF-Download. Offene Belege (abgebrochene Signatur) lassen sich
// nachsignieren.

import { useEffect, useRef, useState } from 'react'
import { Beleg, datumKurz } from './typen'
import { SignaturPad, SignaturPadHandle } from './SignaturPad'

function positionen(beleg: Beleg): string {
  const liste = beleg.art === 'ausgabe' ? beleg.ausgaben : beleg.rueckgaben
  return liste
    .map(a => `${a.exemplar.typ.code}${a.exemplar.nummer ? ` Nr. ${a.exemplar.nummer}` : ''}`)
    .join(', ')
}

export function BelegeView() {
  const [belege, setBelege] = useState<Beleg[] | null>(null)
  const [nachsignieren, setNachsignieren] = useState<string | null>(null)

  const laden = async () => {
    const res = await fetch('/api/schluessel/belege')
    if (res.ok) setBelege(await res.json())
  }
  useEffect(() => {
    laden()
  }, [])

  if (!belege) {
    return <div className="text-center text-gray-400 text-sm py-12">Lade Belege…</div>
  }
  if (belege.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-8 text-center text-sm text-gray-400">
        Noch keine Belege — die erste Ausgabe erzeugt automatisch eine Empfangsbestätigung.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase text-gray-500 bg-gray-50">
              <th className="text-left px-4 py-2 font-semibold">Datum</th>
              <th className="text-left px-3 py-2 font-semibold">Art</th>
              <th className="text-left px-3 py-2 font-semibold">Person</th>
              <th className="text-left px-3 py-2 font-semibold">Schlüssel</th>
              <th className="text-left px-3 py-2 font-semibold">Prüfung</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {belege.map(b => (
              <BelegZeile
                key={b.id}
                beleg={b}
                nachsignierenOffen={nachsignieren === b.id}
                onNachsignieren={() => setNachsignieren(nachsignieren === b.id ? null : b.id)}
                onFertig={async () => {
                  setNachsignieren(null)
                  await laden()
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BelegZeile({
  beleg,
  nachsignierenOffen,
  onNachsignieren,
  onFertig,
}: {
  beleg: Beleg
  nachsignierenOffen: boolean
  onNachsignieren: () => void
  onFertig: () => Promise<void>
}) {
  return (
    <>
      <tr className={beleg.status === 'offen' ? 'bg-amber-50/40' : ''}>
        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{datumKurz(beleg.createdAt)}</td>
        <td className="px-3 py-2 whitespace-nowrap">
          {beleg.art === 'ausgabe' ? 'Ausgabe' : 'Rückgabe'}
        </td>
        <td className="px-3 py-2 font-medium">{beleg.person.name}</td>
        <td className="px-3 py-2 text-gray-600">{positionen(beleg) || '–'}</td>
        <td className="px-3 py-2 whitespace-nowrap">
          {beleg.status === 'offen' ? (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">offen</span>
          ) : beleg.hashOk === true ? (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full" title={beleg.hash ?? ''}>
              ✓ unverändert
            </span>
          ) : beleg.hashOk === false ? (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">⚠ Abweichung</span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">–</span>
          )}
        </td>
        <td className="px-4 py-2 text-right whitespace-nowrap">
          {beleg.status === 'signiert' ? (
            <a
              href={`/api/schluessel/belege/${beleg.id}/pdf`}
              target="_blank"
              className="text-xs text-amber-700 font-medium"
            >
              PDF →
            </a>
          ) : (
            <button onClick={onNachsignieren} className="text-xs text-amber-700 font-medium">
              ✍️ Nachsignieren
            </button>
          )}
        </td>
      </tr>
      {nachsignierenOffen && (
        <tr>
          <td colSpan={6} className="px-4 py-3 bg-gray-50/70">
            <NachsignierenFormular belegId={beleg.id} personName={beleg.person.name} onFertig={onFertig} />
          </td>
        </tr>
      )}
    </>
  )
}

function NachsignierenFormular({
  belegId,
  personName,
  onFertig,
}: {
  belegId: string
  personName: string
  onFertig: () => Promise<void>
}) {
  const pad = useRef<SignaturPadHandle>(null)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  return (
    <div className="max-w-md">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">
        Unterschrift {personName}
      </div>
      <SignaturPad ref={pad} />
      {fehler && <p className="text-xs text-red-600 mt-2">{fehler}</p>}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => pad.current?.clear()}
          className="text-xs font-medium bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg"
        >
          🗑️
        </button>
        <button
          onClick={async () => {
            const unterschrift = pad.current?.getDataUrl()
            if (!unterschrift) {
              setFehler('Bitte zuerst unterschreiben.')
              return
            }
            setLaeuft(true)
            setFehler(null)
            const res = await fetch(`/api/schluessel/belege/${belegId}/signieren`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ unterschrift }),
            })
            setLaeuft(false)
            if (!res.ok) {
              const j = await res.json().catch(() => ({}))
              setFehler(j.error || 'Signieren fehlgeschlagen')
              return
            }
            await onFertig()
          }}
          disabled={laeuft}
          className="flex-1 text-sm font-semibold bg-amber-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {laeuft ? 'Signiere…' : 'Signieren & PDF erzeugen'}
        </button>
      </div>
    </div>
  )
}
