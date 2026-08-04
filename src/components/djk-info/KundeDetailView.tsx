'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, Input, Select } from '@/components/ui'
import {
  BROSCHUERENVERSAND_OPTIONEN,
  KUNDE_STATUS_OPTIONEN,
  RECHNUNGSVERSAND_OPTIONEN,
  formatEuro,
} from '@/data/djk-info'
import { useDarfVerwalten } from './InfoShell'
import { DateiDto, KundeDetailDto, PreisDto, alsDatumsfeld, formatDatum } from './typen'

const LEER = {
  firma: '', zusatz: '', strasse: '', plz: '', ort: '', telefon: '', email: '',
  ansprechpartnerInhaber: '', ansprechpartnerRechnung: '', rechnungEmail: '',
  rechnungsversand: 'post', broschuerenversand: 'persoenlich', anzeigenGroesse: '1/2',
  kuendigungZum: '', status: 'aktiv', bemerkung: '',
}

const UPLOADS: { art: string; label: string; hinweis: string }[] = [
  { art: 'vertrag', label: '📄 Unterschriebener Vertrag', hinweis: 'PDF oder Bilddatei' },
  { art: 'anzeige', label: '🖼️ Bild der Anzeige', hinweis: 'Bilddatei (JPG, PNG, WebP, HEIC)' },
  { art: 'kuendigung', label: '✉️ Kündigungsschreiben', hinweis: 'PDF oder Bilddatei' },
]

export function KundeDetailView({ kundeId }: { kundeId: string }) {
  const router = useRouter()
  const darfVerwalten = useDarfVerwalten()
  const istNeu = kundeId === 'neu'

  const [form, setForm] = useState<Record<string, string>>(LEER)
  const [detail, setDetail] = useState<KundeDetailDto | null>(null)
  const [preise, setPreise] = useState<PreisDto[]>([])
  const [laden, setLaden] = useState(!istNeu)
  const [speichern, setSpeichern] = useState(false)
  const [meldung, setMeldung] = useState<{ art: 'ok' | 'fehler'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/djk-info/preise')
      .then(r => r.json())
      .then(setPreise)
      .catch(() => {})
  }, [])

  const lade = async () => {
    const res = await fetch(`/api/djk-info/kunden/${kundeId}`)
    if (!res.ok) { setLaden(false); return }
    const k: KundeDetailDto = await res.json()
    setDetail(k)
    setForm({
      firma: k.firma ?? '',
      zusatz: k.zusatz ?? '',
      strasse: k.strasse ?? '',
      plz: k.plz ?? '',
      ort: k.ort ?? '',
      telefon: k.telefon ?? '',
      email: k.email ?? '',
      ansprechpartnerInhaber: k.ansprechpartnerInhaber ?? '',
      ansprechpartnerRechnung: k.ansprechpartnerRechnung ?? '',
      rechnungEmail: k.rechnungEmail ?? '',
      rechnungsversand: k.rechnungsversand ?? 'post',
      broschuerenversand: k.broschuerenversand ?? 'persoenlich',
      anzeigenGroesse: k.anzeigenGroesse ?? '1/2',
      kuendigungZum: alsDatumsfeld(k.kuendigungZum),
      status: k.status ?? 'aktiv',
      bemerkung: k.bemerkung ?? '',
    })
    setLaden(false)
  }

  useEffect(() => {
    if (!istNeu) lade()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kundeId])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const speichere = async () => {
    setSpeichern(true)
    setMeldung(null)
    const res = await fetch(istNeu ? '/api/djk-info/kunden' : `/api/djk-info/kunden/${kundeId}`, {
      method: istNeu ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSpeichern(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setMeldung({ art: 'fehler', text: j.error || 'Speichern fehlgeschlagen' })
      return
    }
    if (istNeu) {
      const k = await res.json()
      router.replace(`/djk-info/kunden/${k.id}`)
      router.refresh()
    } else {
      setMeldung({ art: 'ok', text: 'Gespeichert.' })
      lade()
    }
  }

  const loesche = async () => {
    if (!confirm(`Kunde „${form.firma}" wirklich löschen? Hochgeladene Dateien und Schaltungen werden mit gelöscht; Rechnungen bleiben erhalten.`)) return
    const res = await fetch(`/api/djk-info/kunden/${kundeId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/djk-info')
      router.refresh()
    }
  }

  if (laden) return <p className="text-sm text-gray-500 py-8 text-center">Lade Kunde…</p>
  if (!istNeu && !detail) return <p className="text-sm text-gray-500 py-8 text-center">Kunde nicht gefunden.</p>

  const preis = preise.find(p => p.groesse === form.anzeigenGroesse)

  // Schaltungen nach Jahr gruppieren (für die Historien-Karte)
  const schaltungenJeJahr = new Map<number, string[]>()
  for (const s of detail?.schaltungen ?? []) {
    if (!s.ausgabe) continue
    const liste = schaltungenJeJahr.get(s.ausgabe.jahr) ?? []
    liste.push(s.ausgabe.bezeichnung)
    schaltungenJeJahr.set(s.ausgabe.jahr, liste)
  }
  const schaltungsJahre = Array.from(schaltungenJeJahr.entries()).sort((a, b) => b[0] - a[0])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link href="/djk-info" className="text-sm text-gray-500 hover:text-gray-900">← Zur Kundenliste</Link>
        {!istNeu && darfVerwalten && (
          <Button variant="danger" size="sm" onClick={loesche}>Kunde löschen</Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between !py-3">
          <h2 className="font-bold text-gray-900">{istNeu ? 'Neuen Kunden anlegen' : form.firma}</h2>
          {!istNeu && (
            <Badge variant={form.status === 'aktiv' ? 'success' : 'danger'}>
              {form.status === 'aktiv' ? 'Aktiv' : 'Gekündigt'}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <fieldset disabled={!darfVerwalten} className="space-y-5 disabled:opacity-90">
            {/* Stammdaten */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Firma *" value={form.firma} onChange={set('firma')} />
              <Input label="Zusatz" value={form.zusatz} onChange={set('zusatz')} />
              <Input label="Ansprechpartner DJK Info (Inhaber)" value={form.ansprechpartnerInhaber} onChange={set('ansprechpartnerInhaber')} />
              <Input label="Telefon" value={form.telefon} onChange={set('telefon')} />
              <div className="sm:col-span-2">
                <Input label="Straße" value={form.strasse} onChange={set('strasse')} />
              </div>
              <Input label="PLZ" value={form.plz} onChange={set('plz')} />
              <Input label="Ort" value={form.ort} onChange={set('ort')} />
              <Input label="E-Mail" type="email" value={form.email} onChange={set('email')} />
            </div>

            {/* Rechnung & Broschüre */}
            <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Ansprechpartner Rechnung" value={form.ansprechpartnerRechnung} onChange={set('ansprechpartnerRechnung')} />
              <Input label="E-Mail für Rechnungen (falls abweichend)" type="email" value={form.rechnungEmail} onChange={set('rechnungEmail')} />
              <Select
                label="Rechnungsversand"
                value={form.rechnungsversand}
                onChange={set('rechnungsversand')}
                options={RECHNUNGSVERSAND_OPTIONEN}
              />
              <Select
                label="Broschüren-Verteilung an den Kunden"
                value={form.broschuerenversand}
                onChange={set('broschuerenversand')}
                options={BROSCHUERENVERSAND_OPTIONEN}
              />
            </div>

            {/* Anzeige & Abrechnung */}
            <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Select
                  label="Anzeigengröße"
                  value={form.anzeigenGroesse}
                  onChange={set('anzeigenGroesse')}
                  options={preise.map(p => ({
                    value: p.groesse,
                    label: `${p.bezeichnung} — ${formatEuro(p.jahresNetto)} netto/Jahr`,
                  }))}
                />
              </div>
              <div className="flex flex-col justify-end pb-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Netto/Jahr lt. Preisliste</p>
                <p className="text-sm font-bold text-gray-900">{preis ? formatEuro(preis.jahresNetto) : '—'}</p>
              </div>
            </div>

            {/* Status & Kündigung */}
            <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select label="Status" value={form.status} onChange={set('status')} options={KUNDE_STATUS_OPTIONEN} />
              <Input label="Kündigung zum" type="date" value={form.kuendigungZum} onChange={set('kuendigungZum')} />
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bemerkung</label>
                <textarea
                  value={form.bemerkung}
                  onChange={set('bemerkung')}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {meldung && (
              <div className={`text-sm rounded-lg px-3 py-2 border ${
                meldung.art === 'ok'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {meldung.text}
              </div>
            )}

            {darfVerwalten && (
              <div className="flex justify-end">
                <Button onClick={speichere} disabled={speichern || !form.firma.trim()}>
                  {speichern ? 'Speichern…' : istNeu ? 'Kunden anlegen' : 'Speichern'}
                </Button>
              </div>
            )}
          </fieldset>
        </CardContent>
      </Card>

      {/* Dateien */}
      {!istNeu && detail && (
        <Card>
          <CardHeader className="!py-3">
            <h3 className="font-bold text-gray-900">Dateien</h3>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {UPLOADS.map(u => (
              <DateiBereich
                key={u.art}
                art={u.art}
                label={u.label}
                hinweis={u.hinweis}
                kundeId={kundeId}
                dateien={detail.dateien.filter(d => d.art === u.art)}
                darfAendern={darfVerwalten}
                onAenderung={lade}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Schaltungen & Rechnungen */}
      {!istNeu && detail && (schaltungsJahre.length > 0 || detail.rechnungen.length > 0) && (
        <Card>
          <CardHeader className="!py-3">
            <h3 className="font-bold text-gray-900">Schaltungen &amp; Rechnungen</h3>
          </CardHeader>
          <CardContent className="!px-0 !py-0 divide-y divide-gray-100">
            {schaltungsJahre.map(([jahr, ausgaben]) => {
              const hatRechnung = detail.rechnungen.some(r => r.leistungsjahr === jahr)
              return (
                <div key={jahr} className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium text-gray-900">Jahr {jahr}</span>
                    <span className="text-gray-500"> · geschaltet in {ausgaben.sort().join(', ')} ({ausgaben.length} von 3)</span>
                  </div>
                  {!hatRechnung && <Badge variant="warning">Rechnung offen</Badge>}
                </div>
              )
            })}
            {detail.rechnungen.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 text-sm">
                <div className="min-w-0">
                  <Link href={`/djk-info/rechnungen/${r.id}`} className="font-medium text-gray-900 hover:text-emerald-700 hover:underline">
                    {r.nummer}
                  </Link>
                  <span className="text-gray-500"> · Jahr {r.leistungsjahr} · {formatDatum(r.datum)}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-medium">{formatEuro(r.brutto)}</span>
                  <a
                    href={`/api/djk-info/rechnungen/${r.id}/pdf`}
                    className="text-emerald-700 hover:underline text-xs font-medium"
                  >
                    PDF
                  </a>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DateiBereich({
  art, label, hinweis, kundeId, dateien, darfAendern, onAenderung,
}: {
  art: string
  label: string
  hinweis: string
  kundeId: string
  dateien: DateiDto[]
  darfAendern: boolean
  onAenderung: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [laufend, setLaufend] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  const accept = art === 'anzeige' ? 'image/*' : 'application/pdf,image/*'

  const hochladen = async (file: File) => {
    setLaufend(true)
    setFehler(null)
    const fd = new FormData()
    fd.set('kundeId', kundeId)
    fd.set('art', art)
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

  const loesche = async (d: DateiDto) => {
    if (!confirm(`„${d.dateiname}" löschen?`)) return
    await fetch(`/api/djk-info/dateien/${d.id}`, { method: 'DELETE' })
    onAenderung()
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="text-xs text-gray-500 mb-2">{hinweis}, max. 10 MB</p>

      {dateien.length > 0 && art === 'anzeige' && dateien[0].mimeType.startsWith('image/') && (
        // eslint-disable-next-line @next/next/no-img-element
        <a href={`/api/djk-info/dateien/${dateien[0].id}`} target="_blank" rel="noreferrer">
          <img
            src={`/api/djk-info/dateien/${dateien[0].id}`}
            alt={`Bild der Anzeige (${dateien[0].dateiname})`}
            className="w-full h-32 object-contain bg-gray-50 rounded-md border border-gray-200 mb-2"
          />
        </a>
      )}

      <ul className="space-y-1 mb-2">
        {dateien.map(d => (
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
            {darfAendern && (
              <button onClick={() => loesche(d)} className="text-gray-400 hover:text-red-600 shrink-0" title="Löschen">✕</button>
            )}
          </li>
        ))}
        {dateien.length === 0 && <li className="text-xs text-gray-400">Noch nichts hochgeladen.</li>}
      </ul>

      {fehler && <p className="text-xs text-red-600 mb-2">{fehler}</p>}

      {darfAendern && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) hochladen(f)
              e.target.value = ''
            }}
          />
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={laufend}>
            {laufend ? 'Lädt hoch…' : '⬆️ Hochladen'}
          </Button>
        </>
      )}
    </div>
  )
}
