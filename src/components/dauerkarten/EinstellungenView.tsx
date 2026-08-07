'use client'

// Einstellungen (nur Rolle „verwalten"): Verteiler, Drucker/Material,
// Kartenstudio-Kontakt + Saisonverwaltung (Preise, aktiv-Schalter,
// Kartenmuster-Upload, neue Saison mit Karten-Übernahme).

import { useCallback, useEffect, useRef, useState } from 'react'
import { Saison } from './typen'

const eingabe = 'bg-gray-50 mt-0.5 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm'
const label = 'text-[10px] font-semibold text-gray-500 uppercase'

export function EinstellungenView() {
  // Vorgaben
  const [verteiler, setVerteiler] = useState('')
  const [druckerModell, setDruckerModell] = useState('')
  const [druckerArtikel, setDruckerArtikel] = useState('')
  const [lieferantKontakt, setLieferantKontakt] = useState('')
  const [meldung, setMeldung] = useState<string | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)

  // Saisons
  const [saisons, setSaisons] = useState<Saison[]>([])
  const [saisonFehler, setSaisonFehler] = useState<string | null>(null)
  const [neuBezeichnung, setNeuBezeichnung] = useState('')
  const [neuPreisNormal, setNeuPreisNormal] = useState('40')
  const [neuPreisErmaessigt, setNeuPreisErmaessigt] = useState('35')
  const [uebernehmen, setUebernehmen] = useState(true)
  const uploadRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const laden = useCallback(async () => {
    const [eRes, sRes] = await Promise.all([
      fetch('/api/dauerkarten/einstellungen'),
      fetch('/api/dauerkarten/saisons'),
    ])
    if (eRes.ok) {
      const e = await eRes.json()
      setVerteiler(e.verteiler ?? '')
      setDruckerModell(e.druckerModell ?? '')
      setDruckerArtikel(e.druckerArtikel ?? '')
      setLieferantKontakt(e.lieferantKontakt ?? '')
    }
    if (sRes.ok) setSaisons(await sRes.json())
  }, [])

  useEffect(() => {
    laden()
  }, [laden])

  const speichern = async () => {
    setMeldung(null)
    setFehler(null)
    const res = await fetch('/api/dauerkarten/einstellungen', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verteiler, druckerModell, druckerArtikel, lieferantKontakt }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setFehler(j.error || 'Speichern fehlgeschlagen')
      return
    }
    setMeldung('Gespeichert.')
  }

  const saisonSpeichern = async (s: Saison, aktivSetzen = false) => {
    setSaisonFehler(null)
    const res = await fetch(`/api/dauerkarten/saisons/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bezeichnung: s.bezeichnung,
        preisNormal: s.preisNormal,
        preisErmaessigt: s.preisErmaessigt,
        aktiv: aktivSetzen || s.aktiv,
      }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setSaisonFehler(j.error || 'Speichern fehlgeschlagen')
      return
    }
    await laden()
  }

  const saisonAendern = (id: string, feld: keyof Saison, wert: string) => {
    setSaisons(prev =>
      prev.map(s =>
        s.id === id
          ? {
              ...s,
              [feld]:
                feld === 'bezeichnung' ? wert : parseFloat(wert.replace(',', '.')) || 0,
            }
          : s,
      ),
    )
  }

  const neueSaison = async () => {
    setSaisonFehler(null)
    const aktive = saisons.find(s => s.aktiv)
    const res = await fetch('/api/dauerkarten/saisons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bezeichnung: neuBezeichnung,
        preisNormal: neuPreisNormal,
        preisErmaessigt: neuPreisErmaessigt,
        uebernehmenVon: uebernehmen && aktive ? aktive.id : undefined,
      }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setSaisonFehler(j.error || 'Anlegen fehlgeschlagen')
      return
    }
    setNeuBezeichnung('')
    await laden()
  }

  const musterHochladen = async (s: Saison, datei: File) => {
    setSaisonFehler(null)
    const form = new FormData()
    form.append('datei', datei)
    const res = await fetch(`/api/dauerkarten/saisons/${s.id}/muster`, { method: 'POST', body: form })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setSaisonFehler(j.error || 'Upload fehlgeschlagen')
      return
    }
    await laden()
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Vorgaben */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 self-start">
        <h2 className="font-bold text-gray-900 text-sm mb-3">Vorgaben</h2>
        <label className="block mb-2">
          <span className={label}>Verteiler (kommagetrennt — Dropdown &amp; Ausgabelisten)</span>
          <input value={verteiler} onChange={e => setVerteiler(e.target.value)} className={eingabe} placeholder="Raacke, Settles, Kugler" />
        </label>
        <label className="block mb-2">
          <span className={label}>Kartendrucker (Modell)</span>
          <input value={druckerModell} onChange={e => setDruckerModell(e.target.value)} className={eingabe} />
        </label>
        <label className="block mb-2">
          <span className={label}>Material / Artikelnummern</span>
          <textarea value={druckerArtikel} onChange={e => setDruckerArtikel(e.target.value)} rows={3} className={eingabe} />
        </label>
        <label className="block mb-2">
          <span className={label}>Lieferant / Kontakt</span>
          <textarea value={lieferantKontakt} onChange={e => setLieferantKontakt(e.target.value)} rows={4} className={eingabe} />
        </label>
        {meldung && <p className="text-xs text-emerald-700 mb-2">{meldung}</p>}
        {fehler && <p className="text-xs text-red-600 mb-2">{fehler}</p>}
        <button onClick={speichern} className="text-sm font-semibold bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg">
          Speichern
        </button>
      </div>

      {/* Saisons */}
      <div className="space-y-4 self-start">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm">Saisons</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {saisons.map(s => (
              <div key={s.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={s.bezeichnung}
                    onChange={e => saisonAendern(s.id, 'bezeichnung', e.target.value)}
                    className="bg-gray-50 w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-medium"
                  />
                  <label className="text-xs text-gray-500">
                    Normal{' '}
                    <input
                      value={String(s.preisNormal)}
                      onChange={e => saisonAendern(s.id, 'preisNormal', e.target.value)}
                      inputMode="decimal"
                      className="bg-gray-50 w-14 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right"
                    />{' '}
                    €
                  </label>
                  <label className="text-xs text-gray-500">
                    Ermäßigt{' '}
                    <input
                      value={String(s.preisErmaessigt)}
                      onChange={e => saisonAendern(s.id, 'preisErmaessigt', e.target.value)}
                      inputMode="decimal"
                      className="bg-gray-50 w-14 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right"
                    />{' '}
                    €
                  </label>
                  <div className="flex-1" />
                  {s.aktiv ? (
                    <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                      aktiv
                    </span>
                  ) : (
                    <button
                      onClick={() => saisonSpeichern(s, true)}
                      className="text-[11px] text-gray-600 border border-gray-300 px-2 py-0.5 rounded-full hover:bg-gray-50"
                    >
                      aktiv setzen
                    </button>
                  )}
                  <button
                    onClick={() => saisonSpeichern(s)}
                    className="text-xs font-semibold bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-lg"
                  >
                    Speichern
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{s._count?.karten ?? 0} Karten</span>
                  <span>·</span>
                  <span>Kartenmuster: {s.musterPfad ? '✓ hinterlegt' : '—'}</span>
                  <input
                    ref={el => {
                      uploadRefs.current[s.id] = el
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => {
                      const datei = e.target.files?.[0]
                      if (datei) musterHochladen(s, datei)
                      e.target.value = ''
                    }}
                  />
                  <button
                    onClick={() => uploadRefs.current[s.id]?.click()}
                    className="text-blue-600 underline"
                  >
                    {s.musterPfad ? 'ersetzen' : 'JPG hochladen'}
                  </button>
                  {s.musterPfad && (
                    <button
                      onClick={async () => {
                        await fetch(`/api/dauerkarten/saisons/${s.id}/muster`, { method: 'DELETE' })
                        await laden()
                      }}
                      className="text-red-500 underline"
                    >
                      entfernen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="font-bold text-gray-900 text-sm mb-2">Neue Saison anlegen</h2>
          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className={label}>Bezeichnung</span>
              <input
                value={neuBezeichnung}
                onChange={e => setNeuBezeichnung(e.target.value)}
                placeholder="2027/28"
                className="bg-gray-50 mt-0.5 w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block">
              <span className={label}>Normal €</span>
              <input
                value={neuPreisNormal}
                onChange={e => setNeuPreisNormal(e.target.value)}
                inputMode="decimal"
                className="bg-gray-50 mt-0.5 w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right"
              />
            </label>
            <label className="block">
              <span className={label}>Ermäßigt €</span>
              <input
                value={neuPreisErmaessigt}
                onChange={e => setNeuPreisErmaessigt(e.target.value)}
                inputMode="decimal"
                className="bg-gray-50 mt-0.5 w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right"
              />
            </label>
            <button
              onClick={neueSaison}
              disabled={!neuBezeichnung.trim()}
              className="text-sm font-semibold bg-yellow-500 text-gray-900 px-4 py-1.5 rounded-lg disabled:opacity-50"
            >
              Anlegen
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 mt-3">
            <input
              type="checkbox"
              checked={uebernehmen}
              onChange={e => setUebernehmen(e.target.checked)}
              className="rounded accent-yellow-500"
            />
            Karten aus der aktiven Saison übernehmen (ohne Inhaber mit „keine Karte mehr&quot;)
          </label>
          <p className="text-[11px] text-gray-400 mt-1">
            Übernommen werden Nummern, Kategorie und Verteiler — Zahlungen und Ausgaben starten leer,
            Preise kommen aus den neuen Saisonpreisen. Die neue Saison wird automatisch die aktive.
          </p>
          {saisonFehler && <p className="text-xs text-red-600 mt-2">{saisonFehler}</p>}
        </div>
      </div>
    </div>
  )
}
