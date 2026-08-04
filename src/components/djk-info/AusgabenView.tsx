'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card, CardHeader, Input, Modal, Select } from '@/components/ui'
import { AUSGABE_STATUS_OPTIONEN, formatEuro, groesseKurzLabel } from '@/data/djk-info'
import { useDarfSchalten, useDarfVerwalten } from './InfoShell'
import { AusgabeDto, DateiDto, KundeDto, SchaltungDto, alsDatumsfeld } from './typen'

export function AusgabenView() {
  const darfSchalten = useDarfSchalten()
  const darfVerwalten = useDarfVerwalten()

  const jetzt = new Date().getFullYear()
  const [jahr, setJahr] = useState(jetzt)
  const [jahre, setJahre] = useState<number[]>([jetzt])
  const [ausgaben, setAusgaben] = useState<AusgabeDto[] | null>(null)
  const [kunden, setKunden] = useState<KundeDto[]>([])
  const [schaltungen, setSchaltungen] = useState<SchaltungDto[] | null>(null)
  const [neuOffen, setNeuOffen] = useState(false)

  // Jahr-Auswahl aus allen vorhandenen Ausgaben aufbauen
  useEffect(() => {
    fetch('/api/djk-info/ausgaben')
      .then(r => r.json())
      .then((alle: AusgabeDto[]) => {
        const set = new Set(alle.map(a => a.jahr))
        set.add(jetzt)
        set.add(jetzt + 1)
        setJahre(Array.from(set).sort((a, b) => b - a))
      })
      .catch(() => {})
  }, [jetzt, ausgaben?.length])

  const lade = () => {
    fetch(`/api/djk-info/ausgaben?jahr=${jahr}`)
      .then(r => r.json())
      .then(setAusgaben)
      .catch(() => setAusgaben([]))
    fetch(`/api/djk-info/schaltungen?jahr=${jahr}`)
      .then(r => r.json())
      .then(setSchaltungen)
      .catch(() => setSchaltungen([]))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(lade, [jahr])

  useEffect(() => {
    fetch('/api/djk-info/kunden?status=alle')
      .then(r => r.json())
      .then(setKunden)
      .catch(() => setKunden([]))
  }, [])

  const geschaltet = new Set((schaltungen ?? []).map(s => `${s.kundeId}|${s.ausgabeId}`))

  const umschalten = async (kundeId: string, ausgabeId: string) => {
    const key = `${kundeId}|${ausgabeId}`
    const neu = !geschaltet.has(key)
    // Optimistisch umschalten, bei Fehler neu laden
    setSchaltungen(s =>
      neu
        ? [...(s ?? []), { id: key, kundeId, ausgabeId, groesse: null }]
        : (s ?? []).filter(x => !(x.kundeId === kundeId && x.ausgabeId === ausgabeId)),
    )
    const res = await fetch('/api/djk-info/schaltungen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kundeId, ausgabeId, geschaltet: neu }),
    })
    if (!res.ok) lade()
  }

  // Matrix-Zeilen: aktive Kunden + Kunden mit Schaltungen im gewählten Jahr
  const kundenMitSchaltung = new Set((schaltungen ?? []).map(s => s.kundeId))
  const matrixKunden = kunden
    .filter(k => k.status === 'aktiv' || kundenMitSchaltung.has(k.id))
    .sort((a, b) => a.firma.localeCompare(b.firma, 'de'))

  const erschienen = (ausgaben ?? []).filter(a => a.status === 'erschienen').length

  return (
    <div className="space-y-4">
      {/* Kopf: Jahr, Info, Neu */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-full sm:w-36">
          <Select
            value={String(jahr)}
            onChange={e => setJahr(parseInt(e.target.value, 10))}
            options={jahre.map(j => ({ value: String(j), label: String(j) }))}
            aria-label="Jahr wählen"
          />
        </div>
        <div className="flex-1 text-sm text-gray-500">
          {ausgaben ? `${ausgaben.length} Ausgaben · ${erschienen} erschienen` : ''}
        </div>
        {darfSchalten && (
          <Button onClick={() => setNeuOffen(true)} className="!bg-emerald-600 hover:!bg-emerald-700">
            + Ausgabe anlegen
          </Button>
        )}
      </div>

      {/* Ausgaben-Karten */}
      {ausgaben === null ? (
        <p className="text-sm text-gray-500 py-8 text-center">Lade Ausgaben…</p>
      ) : ausgaben.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Noch keine Ausgaben für {jahr}. Lege die erste Ausgabe an.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ausgaben.map(a => (
            <AusgabeKarte
              key={a.id}
              ausgabe={a}
              darfSchalten={darfSchalten}
              darfVerwalten={darfVerwalten}
              istKassier={darfVerwalten}
              onAenderung={lade}
            />
          ))}
        </div>
      )}

      {/* Schaltungs-Matrix */}
      {ausgaben && ausgaben.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="!py-3">
            <h3 className="font-bold text-gray-900">Schaltungs-Matrix — welche Anzeige war in welcher Ausgabe?</h3>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 font-semibold">Firma</th>
                  <th className="px-4 py-3 font-semibold">Größe</th>
                  {ausgaben.map(a => (
                    <th key={a.id} className="px-4 py-3 font-semibold text-center">{a.bezeichnung}</th>
                  ))}
                  <th className="px-4 py-3 font-semibold text-right">Summe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {matrixKunden.map(k => {
                  const anzahl = ausgaben.filter(a => geschaltet.has(`${k.id}|${a.id}`)).length
                  return (
                    <tr key={k.id} className="hover:bg-emerald-50/50">
                      <td className="px-4 py-2.5">
                        <Link href={`/djk-info/kunden/${k.id}`} className="font-medium text-gray-900 hover:text-emerald-700 hover:underline">
                          {k.firma}
                        </Link>
                        {k.status !== 'aktiv' && <span className="ml-2 text-xs text-red-600">(gekündigt)</span>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{groesseKurzLabel(k.anzeigenGroesse)}</td>
                      {ausgaben.map(a => (
                        <td key={a.id} className="px-4 py-2.5 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-emerald-600 disabled:opacity-50"
                            checked={geschaltet.has(`${k.id}|${a.id}`)}
                            disabled={!darfSchalten}
                            onChange={() => umschalten(k.id, a.id)}
                            aria-label={`${k.firma} in ${a.bezeichnung}`}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-right text-gray-600 whitespace-nowrap">
                        {anzahl} / {ausgaben.length}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 text-sm font-semibold text-gray-700">
                  <td className="px-4 py-3" colSpan={2}>Anzeigen je Ausgabe</td>
                  {ausgaben.map(a => (
                    <td key={a.id} className="px-4 py-3 text-center">
                      {matrixKunden.filter(k => geschaltet.has(`${k.id}|${a.id}`)).length}
                    </td>
                  ))}
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {neuOffen && (
        <NeueAusgabeModal
          jahr={jahr}
          vorhandeneNummern={(ausgaben ?? []).map(a => a.nummer)}
          onClose={() => setNeuOffen(false)}
          onFertig={() => { setNeuOffen(false); lade() }}
        />
      )}
    </div>
  )
}

function AusgabeKarte({
  ausgabe, darfSchalten, darfVerwalten, istKassier, onAenderung,
}: {
  ausgabe: AusgabeDto
  darfSchalten: boolean
  darfVerwalten: boolean
  istKassier: boolean
  onAenderung: () => void
}) {
  const [form, setForm] = useState({
    erscheinung: alsDatumsfeld(ausgabe.erscheinung),
    status: ausgabe.status,
    auflage: String(ausgabe.auflage),
    druckKosten: ausgabe.druckKosten !== null ? String(ausgabe.druckKosten) : '',
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const [laufend, setLaufend] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  const speichere = async (aenderung: Partial<typeof form>) => {
    const neu = { ...form, ...aenderung }
    setForm(neu)
    setFehler(null)
    const res = await fetch(`/api/djk-info/ausgaben/${ausgabe.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jahr: ausgabe.jahr, nummer: ausgabe.nummer, ...neu }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setFehler(j.error || 'Speichern fehlgeschlagen')
      return
    }
    onAenderung()
  }

  const loesche = async () => {
    if (!confirm(`Ausgabe ${ausgabe.bezeichnung} wirklich löschen? Alle Schaltungen dieser Ausgabe gehen verloren.`)) return
    const res = await fetch(`/api/djk-info/ausgaben/${ausgabe.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setFehler(j.error || 'Löschen fehlgeschlagen')
      return
    }
    onAenderung()
  }

  const druckrechnungen = (ausgabe.dateien ?? []).filter(d => d.art === 'druckrechnung')

  const hochladen = async (file: File) => {
    setLaufend(true)
    setFehler(null)
    const fd = new FormData()
    fd.set('ausgabeId', ausgabe.id)
    fd.set('art', 'druckrechnung')
    fd.set('file', file)
    const res = await fetch('/api/djk-info/dateien', { method: 'POST', body: fd })
    setLaufend(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setFehler(j.error || 'Upload fehlgeschlagen')
      return
    }
    onAenderung()
  }

  const loescheDatei = async (d: DateiDto) => {
    if (!confirm(`„${d.dateiname}" löschen?`)) return
    await fetch(`/api/djk-info/dateien/${d.id}`, { method: 'DELETE' })
    onAenderung()
  }

  return (
    <Card>
      <div className="px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-gray-900">Ausgabe {ausgabe.bezeichnung}</p>
          <div className="flex items-center gap-2">
            <Badge variant={ausgabe.status === 'erschienen' ? 'success' : 'warning'}>
              {ausgabe.status === 'erschienen' ? 'Erschienen' : 'Geplant'}
            </Badge>
            {darfVerwalten && (
              <button onClick={loesche} className="text-gray-400 hover:text-red-600 text-xs" title="Ausgabe löschen">✕</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Erscheinung"
            type="date"
            value={form.erscheinung}
            onChange={e => setForm(f => ({ ...f, erscheinung: e.target.value }))}
            onBlur={() => speichere({})}
            disabled={!darfSchalten}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={e => speichere({ status: e.target.value })}
            options={AUSGABE_STATUS_OPTIONEN}
            disabled={!darfSchalten}
          />
          <Input
            label="Auflage"
            inputMode="numeric"
            value={form.auflage}
            onChange={e => setForm(f => ({ ...f, auflage: e.target.value }))}
            onBlur={() => speichere({})}
            disabled={!darfSchalten}
          />
          {istKassier && (
            <Input
              label="Druckkosten (€)"
              inputMode="decimal"
              value={form.druckKosten}
              onChange={e => setForm(f => ({ ...f, druckKosten: e.target.value }))}
              onBlur={() => speichere({})}
            />
          )}
        </div>

        {!istKassier && ausgabe.druckKosten !== null && (
          <p className="text-xs text-gray-500">Druckkosten: {formatEuro(ausgabe.druckKosten)}</p>
        )}

        <div className="border-t border-gray-100 pt-2">
          <p className="text-xs font-semibold text-gray-700 mb-1">Druckrechnung</p>
          <ul className="space-y-1 mb-1.5">
            {druckrechnungen.map(d => (
              <li key={d.id} className="flex items-center justify-between gap-2 text-xs">
                <a
                  href={`/api/djk-info/dateien/${d.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:underline truncate"
                  title={d.dateiname}
                >
                  {d.dateiname}
                </a>
                {darfSchalten && (
                  <button onClick={() => loescheDatei(d)} className="text-gray-400 hover:text-red-600 shrink-0" title="Löschen">✕</button>
                )}
              </li>
            ))}
            {druckrechnungen.length === 0 && <li className="text-xs text-gray-400">Noch nichts hochgeladen.</li>}
          </ul>
          {darfSchalten && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) hochladen(f)
                  e.target.value = ''
                }}
              />
              <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={laufend}>
                {laufend ? 'Lädt hoch…' : '⬆️ Druckrechnung hochladen'}
              </Button>
            </>
          )}
        </div>

        {fehler && <p className="text-xs text-red-600">{fehler}</p>}
      </div>
    </Card>
  )
}

function NeueAusgabeModal({
  jahr, vorhandeneNummern, onClose, onFertig,
}: {
  jahr: number
  vorhandeneNummern: number[]
  onClose: () => void
  onFertig: () => void
}) {
  const naechste = [1, 2, 3].find(n => !vorhandeneNummern.includes(n)) ?? vorhandeneNummern.length + 1
  const [form, setForm] = useState({ jahr: String(jahr), nummer: String(naechste), erscheinung: '', auflage: '896' })
  const [laufend, setLaufend] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  const anlegen = async () => {
    setLaufend(true)
    setFehler(null)
    const res = await fetch('/api/djk-info/ausgaben', {
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
    <Modal isOpen onClose={onClose} title="Neue Ausgabe anlegen">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Jahr" inputMode="numeric" value={form.jahr} onChange={e => setForm(f => ({ ...f, jahr: e.target.value }))} />
          <Input label="Nummer (1–3)" inputMode="numeric" value={form.nummer} onChange={e => setForm(f => ({ ...f, nummer: e.target.value }))} />
          <Input label="Erscheinung (optional)" type="date" value={form.erscheinung} onChange={e => setForm(f => ({ ...f, erscheinung: e.target.value }))} />
          <Input label="Auflage" inputMode="numeric" value={form.auflage} onChange={e => setForm(f => ({ ...f, auflage: e.target.value }))} />
        </div>
        {fehler && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{fehler}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button onClick={anlegen} disabled={laufend}>
            {laufend ? 'Lege an…' : 'Ausgabe anlegen'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
