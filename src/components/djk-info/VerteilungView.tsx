'use client'

import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, Input, Modal, Select } from '@/components/ui'
import { GEBIET_KATEGORIEN, PACKEINHEIT, PAECKCHEN, PAKET } from '@/data/djk-info'
import { useDarfVerwalten } from './InfoShell'
import { StrasseDto, VerteilerDto, VerteilgebietDto } from './typen'

interface VerteilungsDaten {
  gebiete: VerteilgebietDto[]
  verteiler: VerteilerDto[]
}

export function VerteilungView() {
  const darfVerwalten = useDarfVerwalten()
  const [daten, setDaten] = useState<VerteilungsDaten | null>(null)
  const [pdfOffen, setPdfOffen] = useState(false)
  const [neuOffen, setNeuOffen] = useState(false)

  const lade = () => {
    fetch('/api/djk-info/verteilung')
      .then(r => r.json())
      .then(setDaten)
      .catch(() => setDaten({ gebiete: [], verteiler: [] }))
  }
  useEffect(lade, [])

  if (daten === null) return <p className="text-sm text-gray-500 py-8 text-center">Lade Verteilung…</p>

  const ottenhofener = daten.gebiete.filter(g => g.kategorie === 'gebiet')
  const weitere = daten.gebiete.filter(g => g.kategorie !== 'gebiet')
  const summeOttenhofen = ottenhofener.reduce((s, g) => s + g.hefte, 0)
  const summeVerteiler = daten.verteiler.reduce((s, v) => s + v.stueckzahl, 0)

  // Einzelne Datensätze in-place aktualisieren (kein volles Neuladen beim Tippen)
  const patchGebiet = (g: VerteilgebietDto) =>
    setDaten(d => d && { ...d, gebiete: d.gebiete.map(x => (x.id === g.id ? { ...g, strassen: x.strassen } : x)) })
  const patchStrasse = (s: StrasseDto) =>
    setDaten(d => d && {
      ...d,
      gebiete: d.gebiete.map(g =>
        g.id === s.gebietId ? { ...g, strassen: g.strassen.map(x => (x.id === s.id ? s : x)) } : g,
      ),
    })
  const patchVerteiler = (v: VerteilerDto) =>
    setDaten(d => d && { ...d, verteiler: d.verteiler.map(x => (x.id === v.id ? v : x)) })

  return (
    <div className="space-y-4">
      {/* Packeinheiten-Kennzahlen (laut Verteilerliste) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="!py-3">
          <p className="text-xs text-gray-500">Hefte gesamt (Verteilerliste)</p>
          <p className="text-lg font-bold text-gray-900">{summeVerteiler}</p>
        </CardContent></Card>
        <Card><CardContent className="!py-3">
          <p className="text-xs text-gray-500">Einheiten à {PACKEINHEIT}</p>
          <p className="text-lg font-bold text-gray-900">{(summeVerteiler / PACKEINHEIT).toLocaleString('de-DE', { maximumFractionDigits: 1 })}</p>
        </CardContent></Card>
        <Card><CardContent className="!py-3">
          <p className="text-xs text-gray-500">Päckchen à {PAECKCHEN}</p>
          <p className="text-lg font-bold text-gray-900">≈ {(summeVerteiler / PAECKCHEN).toLocaleString('de-DE', { maximumFractionDigits: 1 })}</p>
        </CardContent></Card>
        <Card><CardContent className="!py-3">
          <p className="text-xs text-gray-500">Pakete à {PAKET}</p>
          <p className="text-lg font-bold text-gray-900">≈ {(summeVerteiler / PAKET).toLocaleString('de-DE', { maximumFractionDigits: 1 })}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="flex-1 text-sm text-gray-500">
          {darfVerwalten
            ? 'Alle Heftzahlen sind direkt in den Feldern änderbar — Summen rechnen automatisch mit.'
            : 'Ansicht der Verteilgebiete und Verteilerliste (schreibgeschützt).'}
        </p>
        <Button onClick={() => setPdfOffen(true)} className="!bg-emerald-600 hover:!bg-emerald-700">
          📄 PDF erstellen
        </Button>
      </div>

      {/* Ottenhofen: Austragegebiete mit Straßenlisten */}
      <Card>
        <CardHeader className="!py-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-gray-900">Ottenhofen — Austragegebiete ({summeOttenhofen} Hefte)</h3>
          <div className="flex gap-2">
            <a
              href="/api/djk-info/verteilung/pdf?ziel=ottenhofen"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              📄 PDF Ottenhofen
            </a>
            {darfVerwalten && (
              <Button size="sm" className="!bg-emerald-600 hover:!bg-emerald-700" onClick={() => setNeuOffen(true)}>
                + Bereich
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-gray-500">
            Koordination: <Badge variant="warning">noch zu definieren</Badge>
          </p>
          {ottenhofener.map(g => (
            <GebietAufklappbar
              key={g.id}
              gebiet={g}
              darfVerwalten={darfVerwalten}
              onPatchGebiet={patchGebiet}
              onPatchStrasse={patchStrasse}
              onStruktur={lade}
            />
          ))}
          {ottenhofener.length === 0 && (
            <p className="text-sm text-gray-400 py-2">Noch keine Austragegebiete angelegt.</p>
          )}
        </CardContent>
      </Card>

      {/* Ortsteile, Auslagen, Postversand */}
      <Card>
        <CardHeader className="!py-3">
          <h3 className="font-bold text-gray-900">
            Ortsteile, Auslagen &amp; Postversand ({weitere.reduce((s, g) => s + g.hefte, 0)} Hefte)
          </h3>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {weitere.map(g => (
            <BereichKarte
              key={g.id}
              gebiet={g}
              darfVerwalten={darfVerwalten}
              onPatch={patchGebiet}
              onStruktur={lade}
            />
          ))}
          {weitere.length === 0 && <p className="text-sm text-gray-400">Noch keine Bereiche angelegt.</p>}
        </CardContent>
      </Card>

      {/* Verteilerliste */}
      <VerteilerListe
        verteiler={daten.verteiler}
        summe={summeVerteiler}
        darfVerwalten={darfVerwalten}
        onPatch={patchVerteiler}
        onStruktur={lade}
      />

      {pdfOffen && <PdfModal onClose={() => setPdfOffen(false)} />}
      {neuOffen && (
        <NeuerBereichModal
          onClose={() => setNeuOffen(false)}
          onFertig={() => { setNeuOffen(false); lade() }}
        />
      )}
    </div>
  )
}

// Zahlenfeld für Heftzahlen: speichert beim Verlassen des Felds
function HeftInput({
  wert, label, disabled, onSpeichern,
}: {
  wert: number
  label: string
  disabled: boolean
  onSpeichern: (n: number) => void
}) {
  const [text, setText] = useState(String(wert))
  useEffect(() => setText(String(wert)), [wert])
  return (
    <input
      type="number"
      value={text}
      disabled={disabled}
      aria-label={label}
      onChange={e => setText(e.target.value)}
      onBlur={() => {
        const n = Math.max(0, Math.round(parseFloat(text.replace(',', '.')) || 0))
        setText(String(n))
        if (n !== wert) onSpeichern(n)
      }}
      className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 tabular-nums"
    />
  )
}

function GebietAufklappbar({
  gebiet, darfVerwalten, onPatchGebiet, onPatchStrasse, onStruktur,
}: {
  gebiet: VerteilgebietDto
  darfVerwalten: boolean
  onPatchGebiet: (g: VerteilgebietDto) => void
  onPatchStrasse: (s: StrasseDto) => void
  onStruktur: () => void
}) {
  const [neueStrasse, setNeueStrasse] = useState('')
  const summeStrassen = gebiet.strassen.reduce((s, x) => s + x.hefte, 0)

  const speichereGebiet = async (aenderung: Partial<VerteilgebietDto>) => {
    const res = await fetch(`/api/djk-info/verteilung/gebiete/${gebiet.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...gebiet, ...aenderung }),
    })
    if (res.ok) onPatchGebiet(await res.json())
  }

  const speichereStrasse = async (s: StrasseDto, aenderung: Partial<StrasseDto>) => {
    const res = await fetch(`/api/djk-info/verteilung/strassen/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...s, ...aenderung }),
    })
    if (res.ok) onPatchStrasse(await res.json())
  }

  const loescheStrasse = async (s: StrasseDto) => {
    if (!confirm(`Straße „${s.name}" löschen?`)) return
    await fetch(`/api/djk-info/verteilung/strassen/${s.id}`, { method: 'DELETE' })
    onStruktur()
  }

  const strasseAnlegen = async () => {
    const name = neueStrasse.trim()
    if (!name) return
    const res = await fetch('/api/djk-info/verteilung/strassen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gebietId: gebiet.id, name, hefte: 0 }),
    })
    if (res.ok) {
      setNeueStrasse('')
      onStruktur()
    }
  }

  const loescheGebiet = async () => {
    if (!confirm(`Gebiet „${gebiet.name}" mit ${gebiet.strassen.length} Straßen wirklich löschen?`)) return
    await fetch(`/api/djk-info/verteilung/gebiete/${gebiet.id}`, { method: 'DELETE' })
    onStruktur()
  }

  return (
    <details className="border border-gray-200 rounded-lg bg-white group">
      <summary className="flex items-center justify-between gap-2 px-4 py-2.5 cursor-pointer text-sm font-semibold text-gray-900 list-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span className="text-gray-400 transition-transform group-open:rotate-90">▸</span>
          {gebiet.name}
        </span>
        <span className="flex items-center gap-2">
          <Badge variant="default">{gebiet.strassen.length} Straßen</Badge>
          <Badge variant="success">{gebiet.hefte} Hefte</Badge>
        </span>
      </summary>
      <div className="px-4 pb-3 border-t border-gray-100">
        <table className="w-full text-sm mt-2">
          <tbody className="divide-y divide-gray-100">
            {gebiet.strassen.map(s => (
              <tr key={s.id}>
                <td className="py-1.5 pr-2">
                  {darfVerwalten ? (
                    <StrassenNameInput strasse={s} onSpeichern={n => speichereStrasse(s, { name: n })} />
                  ) : (
                    <span className="text-gray-700">{s.name}</span>
                  )}
                </td>
                <td className="py-1.5 text-right w-24">
                  <HeftInput
                    wert={s.hefte}
                    label={`Hefte ${s.name}`}
                    disabled={!darfVerwalten}
                    onSpeichern={n => speichereStrasse(s, { hefte: n })}
                  />
                </td>
                <td className="py-1.5 w-8 text-right">
                  {darfVerwalten && (
                    <button onClick={() => loescheStrasse(s)} className="text-gray-400 hover:text-red-600 text-xs" title="Straße löschen">✕</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <td className="py-2 text-sm font-semibold text-gray-700">
                Summe Straßen
                {summeStrassen !== gebiet.hefte && (
                  <span className="ml-2 text-xs font-normal text-amber-700">
                    (weicht von der Gebietszahl ab)
                  </span>
                )}
              </td>
              <td className="py-2 text-right font-semibold pr-2">{summeStrassen}</td>
              <td />
            </tr>
          </tfoot>
        </table>

        <div className="flex flex-wrap items-center gap-2 mt-1">
          <label className="flex items-center gap-1.5 text-sm text-gray-700">
            Hefte im Gebiet:
            <HeftInput
              wert={gebiet.hefte}
              label={`Hefte gesamt ${gebiet.name}`}
              disabled={!darfVerwalten}
              onSpeichern={n => speichereGebiet({ hefte: n })}
            />
          </label>
          <a
            href={`/api/djk-info/verteilung/pdf?ziel=${gebiet.id}`}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            📄 PDF {gebiet.name}
          </a>
          {darfVerwalten && (
            <>
              <span className="flex items-center gap-1">
                <input
                  type="text"
                  value={neueStrasse}
                  onChange={e => setNeueStrasse(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') strasseAnlegen() }}
                  placeholder="Neue Straße…"
                  className="w-40 px-2 py-1.5 text-xs border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button variant="secondary" size="sm" onClick={strasseAnlegen} disabled={!neueStrasse.trim()}>+ Straße</Button>
              </span>
              <button onClick={loescheGebiet} className="ml-auto text-xs text-gray-400 hover:text-red-600" title="Gebiet löschen">
                Gebiet löschen
              </button>
            </>
          )}
        </div>
      </div>
    </details>
  )
}

function StrassenNameInput({ strasse, onSpeichern }: { strasse: StrasseDto; onSpeichern: (name: string) => void }) {
  const [text, setText] = useState(strasse.name)
  useEffect(() => setText(strasse.name), [strasse.name])
  return (
    <input
      type="text"
      value={text}
      aria-label="Straßenname"
      onChange={e => setText(e.target.value)}
      onBlur={() => {
        const n = text.trim()
        if (n && n !== strasse.name) onSpeichern(n)
        else setText(strasse.name)
      }}
      className="w-full px-2 py-1 text-sm border border-transparent hover:border-gray-300 focus:border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
    />
  )
}

function BereichKarte({
  gebiet, darfVerwalten, onPatch, onStruktur,
}: {
  gebiet: VerteilgebietDto
  darfVerwalten: boolean
  onPatch: (g: VerteilgebietDto) => void
  onStruktur: () => void
}) {
  const speichere = async (aenderung: Partial<VerteilgebietDto>) => {
    const res = await fetch(`/api/djk-info/verteilung/gebiete/${gebiet.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...gebiet, ...aenderung }),
    })
    if (res.ok) onPatch(await res.json())
  }

  const loesche = async () => {
    if (!confirm(`Bereich „${gebiet.name}" wirklich löschen?`)) return
    await fetch(`/api/djk-info/verteilung/gebiete/${gebiet.id}`, { method: 'DELETE' })
    onStruktur()
  }

  const kategorieLabel = GEBIET_KATEGORIEN.find(k => k.value === gebiet.kategorie)?.label ?? gebiet.kategorie
  const pdfZiel = gebiet.kategorie === 'auslage' ? 'auslagen' : gebiet.kategorie === 'postversand' ? 'postversand' : gebiet.id

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-gray-900 text-sm">{gebiet.name}</p>
        <div className="flex items-center gap-2 shrink-0">
          <a href={`/api/djk-info/verteilung/pdf?ziel=${pdfZiel}`} className="text-emerald-700 hover:underline text-xs font-medium">
            📄 PDF
          </a>
          {darfVerwalten && (
            <button onClick={loesche} className="text-gray-400 hover:text-red-600 text-xs" title="Löschen">✕</button>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-0.5">
        {kategorieLabel}
        {gebiet.beschreibung ? ` · ${gebiet.beschreibung}` : ''}
      </p>
      <div className="flex items-center gap-1.5 mt-2">
        <HeftInput
          wert={gebiet.hefte}
          label={`Hefte ${gebiet.name}`}
          disabled={!darfVerwalten}
          onSpeichern={n => speichere({ hefte: n })}
        />
        <span className="text-xs text-gray-500">Hefte</span>
      </div>
    </div>
  )
}

function VerteilerListe({
  verteiler, summe, darfVerwalten, onPatch, onStruktur,
}: {
  verteiler: VerteilerDto[]
  summe: number
  darfVerwalten: boolean
  onPatch: (v: VerteilerDto) => void
  onStruktur: () => void
}) {
  const anlegen = async () => {
    const res = await fetch('/api/djk-info/verteilung/verteiler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ person: '', zustaendigkeit: 'Neue Zuständigkeit', stueckzahl: 0 }),
    })
    if (res.ok) onStruktur()
  }

  const loesche = async (v: VerteilerDto) => {
    if (!confirm(`Verteiler-Eintrag „${v.zustaendigkeit}" löschen?`)) return
    await fetch(`/api/djk-info/verteilung/verteiler/${v.id}`, { method: 'DELETE' })
    onStruktur()
  }

  const speichere = async (v: VerteilerDto, aenderung: Partial<VerteilerDto>) => {
    const res = await fetch(`/api/djk-info/verteilung/verteiler/${v.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...v, ...aenderung }),
    })
    if (res.ok) onPatch(await res.json())
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="!py-3 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Verteilerliste — wer trägt was aus?</h3>
        {darfVerwalten && (
          <Button size="sm" className="!bg-emerald-600 hover:!bg-emerald-700" onClick={anlegen}>+ Verteiler</Button>
        )}
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-3 font-semibold">Person</th>
              <th className="px-4 py-3 font-semibold">Zuständigkeit</th>
              <th className="px-4 py-3 font-semibold text-right">Stückzahl</th>
              <th className="px-4 py-3 font-semibold">Vergütung</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {verteiler.map(v => (
              <VerteilerZeile
                key={v.id}
                verteiler={v}
                darfVerwalten={darfVerwalten}
                onSpeichern={a => speichere(v, a)}
                onLoeschen={() => loesche(v)}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold text-gray-700">
              <td className="px-4 py-3" colSpan={2}>Gesamt</td>
              <td className="px-4 py-3 text-right">{summe}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  )
}

function VerteilerZeile({
  verteiler, darfVerwalten, onSpeichern, onLoeschen,
}: {
  verteiler: VerteilerDto
  darfVerwalten: boolean
  onSpeichern: (a: Partial<VerteilerDto>) => void
  onLoeschen: () => void
}) {
  const [person, setPerson] = useState(verteiler.person)
  const [zust, setZust] = useState(verteiler.zustaendigkeit)
  useEffect(() => { setPerson(verteiler.person); setZust(verteiler.zustaendigkeit) }, [verteiler])

  const textFeld = 'w-full px-2 py-1 text-sm border border-transparent hover:border-gray-300 focus:border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent'

  return (
    <tr className="hover:bg-emerald-50/50">
      <td className="px-3 py-1.5 w-44">
        {darfVerwalten ? (
          <input
            type="text"
            value={person}
            placeholder="noch offen"
            aria-label="Person"
            onChange={e => setPerson(e.target.value)}
            onBlur={() => { if (person !== verteiler.person) onSpeichern({ person }) }}
            className={textFeld}
          />
        ) : person ? (
          <span className="font-medium text-gray-900">{person}</span>
        ) : (
          <Badge variant="warning">noch offen</Badge>
        )}
      </td>
      <td className="px-3 py-1.5">
        {darfVerwalten ? (
          <input
            type="text"
            value={zust}
            aria-label="Zuständigkeit"
            onChange={e => setZust(e.target.value)}
            onBlur={() => { if (zust.trim() && zust !== verteiler.zustaendigkeit) onSpeichern({ zustaendigkeit: zust }) }}
            className={textFeld}
          />
        ) : (
          <span className="text-gray-700">{zust}</span>
        )}
      </td>
      <td className="px-3 py-1.5 text-right w-28">
        <HeftInput
          wert={verteiler.stueckzahl}
          label={`Stückzahl ${verteiler.zustaendigkeit}`}
          disabled={!darfVerwalten}
          onSpeichern={n => onSpeichern({ stueckzahl: n })}
        />
      </td>
      <td className="px-3 py-1.5 w-36">
        {darfVerwalten ? (
          <select
            value={verteiler.verguetung}
            onChange={e => onSpeichern({ verguetung: e.target.value })}
            className="text-xs border border-gray-200 rounded-md px-1.5 py-1 bg-white"
            aria-label="Vergütung"
          >
            <option value="kostenlos">kostenlos</option>
            <option value="verguetet">vergütet</option>
          </select>
        ) : (
          <Badge variant="default">{verteiler.verguetung === 'verguetet' ? 'vergütet' : 'kostenlos'}</Badge>
        )}
      </td>
      <td className="px-3 py-1.5 w-8 text-right">
        {darfVerwalten && (
          <button onClick={onLoeschen} className="text-gray-400 hover:text-red-600 text-xs" title="Löschen">✕</button>
        )}
      </td>
    </tr>
  )
}

function PdfModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal isOpen onClose={onClose} title="📄 Verteilungs-PDFs erstellen (DIN A4)">
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Druckfertige Listen für die Austräger und Verantwortlichen — immer mit den aktuell
          gespeicherten Heftzahlen.
        </p>
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-gray-900">Gesamtübersicht</p>
          <p className="text-xs text-gray-500 mb-2">
            Eine PDF mit allen Bereichen und der Verteilerliste inkl. Summen und Packeinheiten
            ({PACKEINHEIT} / {PAECKCHEN} / {PAKET}).
          </p>
          <a
            href="/api/djk-info/verteilung/pdf?ziel=gesamt"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            📄 Gesamtübersicht herunterladen
          </a>
        </div>
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-gray-900">Alle Einzel-Listen</p>
          <p className="text-xs text-gray-500 mb-2">
            Eine Druckdatei mit der Übersicht und je Bereich einer eigenen Seite zum Austeilen:
            je Ottenhofener Austragegebiet (mit Straßenliste), je Ortsteil, Auslagestellen und
            Postversand — einfach ausdrucken und auseinanderschneiden bzw. verteilen.
          </p>
          <a
            href="/api/djk-info/verteilung/pdf?ziel=alle"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            📦 Alle Einzel-Listen herunterladen
          </a>
        </div>
        <p className="text-xs text-gray-500">
          Einzelne PDFs gibt es auch direkt über die „📄 PDF&quot;-Knöpfe an jeder Karte bzw. jedem Gebiet.
        </p>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Schließen</Button>
        </div>
      </div>
    </Modal>
  )
}

function NeuerBereichModal({ onClose, onFertig }: { onClose: () => void; onFertig: () => void }) {
  const [form, setForm] = useState({ name: '', kategorie: 'gebiet', hefte: '0', beschreibung: '' })
  const [laufend, setLaufend] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  const anlegen = async () => {
    setLaufend(true)
    setFehler(null)
    const res = await fetch('/api/djk-info/verteilung/gebiete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLaufend(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setFehler(j.error || 'Anlegen fehlgeschlagen')
      return
    }
    onFertig()
  }

  return (
    <Modal isOpen onClose={onClose} title="Neuen Verteilbereich anlegen">
      <div className="space-y-4">
        <Input label="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Gebiet 5" />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Art"
            value={form.kategorie}
            onChange={e => setForm(f => ({ ...f, kategorie: e.target.value }))}
            options={GEBIET_KATEGORIEN}
          />
          <Input label="Hefte" inputMode="numeric" value={form.hefte} onChange={e => setForm(f => ({ ...f, hefte: e.target.value }))} />
        </div>
        <Input label="Beschreibung (optional)" value={form.beschreibung} onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))} />
        <p className="text-xs text-gray-500">
          Straßen lassen sich nach dem Anlegen direkt im aufgeklappten Gebiet ergänzen (nur bei Austragegebieten).
        </p>
        {fehler && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{fehler}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button onClick={anlegen} disabled={laufend || !form.name.trim()}>
            {laufend ? 'Lege an…' : 'Bereich anlegen'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
