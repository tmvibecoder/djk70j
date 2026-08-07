'use client'

// Neue Karte anlegen: bestehenden Inhaber wählen oder neuen in einem Rutsch
// anlegen. Ohne lfd. Nummer vergibt die API die nächste freie; ohne Preis
// gilt der Saisonpreis der Kategorie.

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { gruppenRahmen, gruppenTitel } from '@/components/ui'
import {
  DK_ANREDEN,
  DK_ANREDE_LABELS,
  DK_KATEGORIEN,
  DK_KATEGORIE_LABELS,
} from '@/lib/dauerkarten-felder'
import { Inhaber, inhaberName } from './typen'

const eingabe = 'bg-gray-50 mt-0.5 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm'
const label = 'text-[10px] font-semibold text-gray-500 uppercase'

export function NeuKarte({
  saisonId,
  verteilerListe,
  onFertig,
  onSchliessen,
}: {
  saisonId: string
  verteilerListe: string[]
  onFertig: () => Promise<void>
  onSchliessen: () => void
}) {
  const [inhaberListe, setInhaberListe] = useState<Inhaber[]>([])
  const [inhaberId, setInhaberId] = useState('')
  const [neuInhaber, setNeuInhaber] = useState(true)
  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [anrede, setAnrede] = useState('')
  const [rentner, setRentner] = useState(false)
  const [behinderung, setBehinderung] = useState(false)
  const [info, setInfo] = useState('')
  const [kategorie, setKategorie] = useState('normal')
  const [lfdNr, setLfdNr] = useState('')
  const [kartennummer, setKartennummer] = useState('')
  const [verteiler, setVerteiler] = useState(verteilerListe[0] ?? '')
  const [fehler, setFehler] = useState<string | null>(null)
  const [laeuft, setLaeuft] = useState(false)

  useEffect(() => {
    fetch('/api/dauerkarten/inhaber').then(async res => {
      if (res.ok) setInhaberListe(await res.json())
    })
  }, [])

  // Rentner/Behinderung → Vorschlag ermäßigt (nur solange nicht Nur-Druck)
  useEffect(() => {
    if (kategorie !== 'druck') {
      setKategorie(rentner || behinderung ? 'ermaessigt' : 'normal')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentner, behinderung])

  const anlegen = async () => {
    setFehler(null)
    if (neuInhaber && (!vorname.trim() || !nachname.trim())) {
      setFehler('Vor- und Nachname sind erforderlich.')
      return
    }
    if (!neuInhaber && !inhaberId) {
      setFehler('Bitte einen Inhaber wählen.')
      return
    }
    setLaeuft(true)
    try {
      const res = await fetch('/api/dauerkarten/karten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saisonId,
          ...(neuInhaber
            ? { inhaber: { vorname, nachname, anrede, rentner, behinderung, info } }
            : { inhaberId }),
          kategorie,
          lfdNr: lfdNr || undefined,
          kartennummer: kartennummer || undefined,
          verteiler,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Anlegen fehlgeschlagen')
      await onFertig()
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Anlegen fehlgeschlagen')
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <Modal isOpen onClose={onSchliessen} title="Neue Dauerkarte">
      <div className={gruppenRahmen.kontakt}>
        <p className={gruppenTitel.kontakt}>Inhaber</p>
        <div className="flex gap-2 mb-2 text-xs">
          <button
            onClick={() => setNeuInhaber(true)}
            className={`px-3 py-1.5 rounded-full font-medium ${neuInhaber ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Neue Person
          </button>
          <button
            onClick={() => setNeuInhaber(false)}
            className={`px-3 py-1.5 rounded-full font-medium ${!neuInhaber ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Bestehende Person
          </button>
        </div>
        {neuInhaber ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className={label}>Vorname</span>
                <input value={vorname} onChange={e => setVorname(e.target.value)} className={eingabe} />
              </label>
              <label className="block">
                <span className={label}>Nachname</span>
                <input value={nachname} onChange={e => setNachname(e.target.value)} className={eingabe} />
              </label>
              <label className="block">
                <span className={label}>Anrede</span>
                <select value={anrede} onChange={e => setAnrede(e.target.value)} className={eingabe}>
                  <option value="">—</option>
                  {DK_ANREDEN.map(a => (
                    <option key={a} value={a}>{DK_ANREDE_LABELS[a]}</option>
                  ))}
                </select>
              </label>
              <div className="flex items-end gap-3 pb-1 text-sm text-gray-700">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={rentner} onChange={e => setRentner(e.target.checked)} className="rounded accent-yellow-500" />
                  Rentner
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={behinderung} onChange={e => setBehinderung(e.target.checked)} className="rounded accent-yellow-500" />
                  Behinderung
                </label>
              </div>
            </div>
            <label className="block mt-2">
              <span className={label}>Info (z.B. „Freundin von …&quot;)</span>
              <input value={info} onChange={e => setInfo(e.target.value)} className={eingabe} />
            </label>
          </>
        ) : (
          <select value={inhaberId} onChange={e => setInhaberId(e.target.value)} className={eingabe}>
            <option value="">— Person wählen —</option>
            {inhaberListe.map(i => (
              <option key={i.id} value={i.id}>
                {inhaberName(i)}
                {i.info ? ` — ${i.info}` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={`${gruppenRahmen.stammdaten} mt-3`}>
        <p className={gruppenTitel.stammdaten}>Karte</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className={label}>Kategorie</span>
            <select value={kategorie} onChange={e => setKategorie(e.target.value)} className={eingabe}>
              {DK_KATEGORIEN.map(k => (
                <option key={k} value={k}>{DK_KATEGORIE_LABELS[k]}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>Verteiler</span>
            <select value={verteiler} onChange={e => setVerteiler(e.target.value)} className={eingabe}>
              <option value="">—</option>
              {verteilerListe.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>Lfd. Nr (leer = nächste freie)</span>
            <input value={lfdNr} onChange={e => setLfdNr(e.target.value)} inputMode="numeric" placeholder="auto" className={eingabe} />
          </label>
          <label className="block">
            <span className={label}>Kartennummer / Wunschnummer</span>
            <input value={kartennummer} onChange={e => setKartennummer(e.target.value)} placeholder="auto (= lfd. Nr)" className={eingabe} />
          </label>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Preis wird aus der Kategorie vorbelegt (Saisonpreise) und kann später an der Karte geändert werden.
        </p>
      </div>

      {fehler && <p className="text-xs text-red-600 mt-3">{fehler}</p>}
      <button
        onClick={anlegen}
        disabled={laeuft}
        className="w-full mt-4 text-sm font-semibold bg-yellow-500 text-gray-900 px-4 py-2.5 rounded-lg disabled:opacity-50"
      >
        {laeuft ? 'Lege an…' : 'Karte anlegen'}
      </button>
    </Modal>
  )
}
