'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, Input, Select, gruppenRahmen, gruppenTitel } from '@/components/ui'
import {
  PLATZ_ABSCHNITTE,
  RECHNUNGSVERSAND_OPTIONEN,
  PARTNER_STATUS_OPTIONEN,
  formatEuro,
} from '@/data/werbebanden'
import { DateiDto, PartnerDetailDto, alsDatumsfeld, formatDatum } from './typen'

// ansprechpartnerBande hat kein Eingabefeld mehr, bleibt aber im Formular-State:
// gespeichert wird immer das komplette Objekt, ein fehlender Schlüssel würde die
// vorhandenen Daten in der Datenbank löschen.
const LEER = {
  firma: '', ansprechpartner: '', ansprechpartnerBande: '', ansprechpartnerRechnung: '',
  strasse: '', plz: '', ort: '', telefon: '', email: '',
  telefonRechnung: '', emailRechnung: '', ustId: '',
  istLaenge: '', berechneteLaenge: '', preisProMeter: '40',
  vertragsbeginn: '', bandeErneuert: '', rechnungsversand: 'post',
  abschnitt: '', positionNr: '', kuendigungZum: '', status: 'aktiv', bemerkung: '',
}

const UPLOADS: { art: string; label: string; hinweis: string }[] = [
  { art: 'foto', label: '📷 Foto der Bande', hinweis: 'Bilddatei (JPG, PNG, WebP, HEIC)' },
  { art: 'vertrag', label: '📄 Unterschriebener Vertrag', hinweis: 'PDF oder Bilddatei' },
  { art: 'kuendigung', label: '✉️ Kündigungsschreiben', hinweis: 'PDF oder Bilddatei' },
]

export function PartnerDetailView({ partnerId }: { partnerId: string }) {
  const router = useRouter()
  const istNeu = partnerId === 'neu'

  const [form, setForm] = useState<Record<string, string>>(LEER)
  const [detail, setDetail] = useState<PartnerDetailDto | null>(null)
  const [laden, setLaden] = useState(!istNeu)
  const [speichern, setSpeichern] = useState(false)
  const [meldung, setMeldung] = useState<{ art: 'ok' | 'fehler'; text: string } | null>(null)

  const lade = async () => {
    const res = await fetch(`/api/werbebanden/partner/${partnerId}`)
    if (!res.ok) { setLaden(false); return }
    const p: PartnerDetailDto = await res.json()
    setDetail(p)
    setForm({
      firma: p.firma ?? '',
      ansprechpartner: p.ansprechpartner ?? '',
      ansprechpartnerBande: p.ansprechpartnerBande ?? '',
      ansprechpartnerRechnung: p.ansprechpartnerRechnung ?? '',
      strasse: p.strasse ?? '',
      plz: p.plz ?? '',
      ort: p.ort ?? '',
      telefon: p.telefon ?? '',
      email: p.email ?? '',
      telefonRechnung: p.telefonRechnung ?? '',
      emailRechnung: p.emailRechnung ?? '',
      ustId: p.ustId ?? '',
      istLaenge: String(p.istLaenge ?? ''),
      berechneteLaenge: String(p.berechneteLaenge ?? ''),
      preisProMeter: String(p.preisProMeter ?? ''),
      vertragsbeginn: alsDatumsfeld(p.vertragsbeginn),
      bandeErneuert: p.bandeErneuert ? String(p.bandeErneuert) : '',
      rechnungsversand: p.rechnungsversand ?? 'post',
      abschnitt: p.abschnitt ? String(p.abschnitt) : '',
      positionNr: p.positionNr ? String(p.positionNr) : '',
      kuendigungZum: alsDatumsfeld(p.kuendigungZum),
      status: p.status ?? 'aktiv',
      bemerkung: p.bemerkung ?? '',
    })
    setLaden(false)
  }

  useEffect(() => {
    if (!istNeu) lade()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const speichere = async () => {
    setSpeichern(true)
    setMeldung(null)
    const res = await fetch(istNeu ? '/api/werbebanden/partner' : `/api/werbebanden/partner/${partnerId}`, {
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
      const p = await res.json()
      router.replace(`/werbebanden/partner/${p.id}`)
      router.refresh()
    } else {
      setMeldung({ art: 'ok', text: 'Gespeichert.' })
      lade()
    }
  }

  const loesche = async () => {
    if (!confirm(`Partner „${form.firma}" wirklich löschen? Hochgeladene Dateien werden mit gelöscht; Rechnungen bleiben erhalten.`)) return
    const res = await fetch(`/api/werbebanden/partner/${partnerId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/werbebanden')
      router.refresh()
    }
  }

  if (laden) return <p className="text-sm text-gray-500 py-8 text-center">Lade Partner…</p>
  if (!istNeu && !detail) return <p className="text-sm text-gray-500 py-8 text-center">Partner nicht gefunden.</p>

  const brutto = (parseFloat(form.berechneteLaenge.replace(',', '.')) || 0)
    * (parseFloat(form.preisProMeter.replace(',', '.')) || 0) * 1.19

  // Altbestand kann noch auf einen inzwischen entfallenen Abschnitt zeigen (z.B. die
  // frühere Zusatzfläche 4). Ohne passende Option würde das Select leer anzeigen und
  // die Zuordnung beim nächsten Speichern still verlieren.
  const abschnittOptionen = [
    { value: '', label: '— kein —' },
    ...PLATZ_ABSCHNITTE.map(a => ({ value: String(a.nr), label: `${a.nr} · ${a.name}` })),
    ...(form.abschnitt && !PLATZ_ABSCHNITTE.some(a => String(a.nr) === form.abschnitt)
      ? [{ value: form.abschnitt, label: `${form.abschnitt} · (entfällt — bitte neu zuordnen)` }]
      : []),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link href="/werbebanden" className="text-sm text-gray-500 hover:text-gray-900">← Zur Partnerliste</Link>
        {!istNeu && (
          <Button variant="danger" size="sm" onClick={loesche}>Partner löschen</Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between !py-3">
          <h2 className="font-bold text-gray-900">{istNeu ? 'Neuen Partner anlegen' : form.firma}</h2>
          {!istNeu && (
            <Badge variant={form.status === 'aktiv' ? 'success' : 'danger'}>
              {form.status === 'aktiv' ? 'Aktiv' : 'Gekündigt'}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Fünf Feldgruppen, je in einem eingefärbten Block (Farbe = Art der Angabe,
              siehe components/ui/feldgruppe.ts). Beide Personen-Blöcke teilen sich
              dasselbe 3-Spalten-Raster. */}
          <div className="space-y-3">
            <div className={gruppenRahmen.stammdaten}>
              <p className={gruppenTitel.stammdaten}>Firma &amp; Anschrift</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Input label="Firma *" value={form.firma} onChange={set('firma')} />
                </div>
                <Input label="Umsatzsteuer-ID" value={form.ustId} onChange={set('ustId')} />
                <div className="sm:col-span-3">
                  <Input label="Straße" value={form.strasse} onChange={set('strasse')} />
                </div>
                <Input label="PLZ" value={form.plz} onChange={set('plz')} />
                <div className="sm:col-span-2">
                  <Input label="Ort" value={form.ort} onChange={set('ort')} />
                </div>
              </div>
            </div>

            <div className={gruppenRahmen.kontakt}>
              <p className={gruppenTitel.kontakt}>Ansprechpartner Allgemein</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Ansprechpartner Allgemein" value={form.ansprechpartner} onChange={set('ansprechpartner')} />
                <Input label="Telefon Allgemein" value={form.telefon} onChange={set('telefon')} />
                <Input label="E-Mail Allgemein" type="email" value={form.email} onChange={set('email')} />
              </div>
            </div>

            <div className={gruppenRahmen.geld}>
              <p className={gruppenTitel.geld}>Ansprechpartner Rechnung</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Ansprechpartner Rechnung" value={form.ansprechpartnerRechnung} onChange={set('ansprechpartnerRechnung')} />
                <Input label="Telefon Rechnung" value={form.telefonRechnung} onChange={set('telefonRechnung')} />
                <Input label="E-Mail Rechnung" type="email" value={form.emailRechnung} onChange={set('emailRechnung')} />
                <Select
                  label="Rechnungsversand"
                  value={form.rechnungsversand}
                  onChange={set('rechnungsversand')}
                  options={RECHNUNGSVERSAND_OPTIONEN}
                />
              </div>
            </div>

            <div className={gruppenRahmen.leistung}>
              <p className={gruppenTitel.leistung}>Bande &amp; Abrechnung</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input label="Ist-Länge (m)" inputMode="decimal" value={form.istLaenge} onChange={set('istLaenge')} />
                <Input label="Lfd. Meter (Abrechnung)" inputMode="decimal" value={form.berechneteLaenge} onChange={set('berechneteLaenge')} />
                <Input label="Preis pro Meter (€ netto)" inputMode="decimal" value={form.preisProMeter} onChange={set('preisProMeter')} />
                <div className="flex flex-col justify-end pb-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">Brutto/Jahr</p>
                  <p className="text-sm font-bold text-gray-900">{formatEuro(brutto)}</p>
                </div>
                <Select
                  label="Abschnitt"
                  value={form.abschnitt}
                  onChange={set('abschnitt')}
                  options={abschnittOptionen}
                />
                <Input label="Position im Abschnitt" inputMode="numeric" value={form.positionNr} onChange={set('positionNr')} />
                <Input label="Vertragsbeginn" type="date" value={form.vertragsbeginn} onChange={set('vertragsbeginn')} />
                <Input label="Bande erneuert (Jahr)" inputMode="numeric" value={form.bandeErneuert} onChange={set('bandeErneuert')} />
              </div>
            </div>

            <div className={gruppenRahmen.status}>
              <p className={gruppenTitel.status}>Status &amp; Kündigung</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select label="Status" value={form.status} onChange={set('status')} options={PARTNER_STATUS_OPTIONEN} />
                <Input label="Kündigung zum" type="date" value={form.kuendigungZum} onChange={set('kuendigungZum')} />
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bemerkung</label>
                  <textarea
                    value={form.bemerkung}
                    onChange={set('bemerkung')}
                    rows={2}
                    className="bg-gray-50 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
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

          <div className="flex justify-end">
            <Button onClick={speichere} disabled={speichern || !form.firma.trim()}>
              {speichern ? 'Speichern…' : istNeu ? 'Partner anlegen' : 'Speichern'}
            </Button>
          </div>
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
                partnerId={partnerId}
                dateien={detail.dateien.filter(d => d.art === u.art)}
                onAenderung={lade}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rechnungshistorie */}
      {!istNeu && detail && detail.rechnungen.length > 0 && (
        <Card>
          <CardHeader className="!py-3">
            <h3 className="font-bold text-gray-900">Rechnungen</h3>
          </CardHeader>
          <CardContent className="!px-0 !py-0 divide-y divide-gray-100">
            {detail.rechnungen.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 text-sm">
                <div className="min-w-0">
                  <Link href={`/werbebanden/rechnungen/${r.id}`} className="font-medium text-gray-900 hover:text-emerald-700 hover:underline">
                    {r.nummer}
                  </Link>
                  <span className="text-gray-500"> · Saison {r.saison} · {formatDatum(r.datum)}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-medium">{formatEuro(r.brutto)}</span>
                  <a
                    href={`/api/werbebanden/rechnungen/${r.id}/pdf`}
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
  art, label, hinweis, partnerId, dateien, onAenderung,
}: {
  art: string
  label: string
  hinweis: string
  partnerId: string
  dateien: DateiDto[]
  onAenderung: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [laufend, setLaufend] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  const accept = art === 'foto' ? 'image/*' : 'application/pdf,image/*'

  const hochladen = async (file: File) => {
    setLaufend(true)
    setFehler(null)
    const fd = new FormData()
    fd.set('partnerId', partnerId)
    fd.set('art', art)
    fd.set('file', file)
    const res = await fetch('/api/werbebanden/dateien', { method: 'POST', body: fd })
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
    await fetch(`/api/werbebanden/dateien/${d.id}`, { method: 'DELETE' })
    onAenderung()
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="text-xs text-gray-500 mb-2">{hinweis}, max. 10 MB</p>

      {dateien.length > 0 && art === 'foto' && dateien[0].mimeType.startsWith('image/') && (
        // eslint-disable-next-line @next/next/no-img-element
        <a href={`/api/werbebanden/dateien/${dateien[0].id}`} target="_blank" rel="noreferrer">
          <img
            src={`/api/werbebanden/dateien/${dateien[0].id}`}
            alt={`Foto der Bande (${dateien[0].dateiname})`}
            className="w-full h-32 object-cover rounded-md border border-gray-200 mb-2"
          />
        </a>
      )}

      <ul className="space-y-1 mb-2">
        {dateien.map(d => (
          <li key={d.id} className="flex items-center justify-between gap-2 text-xs">
            <a
              href={`/api/werbebanden/dateien/${d.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 hover:underline truncate"
              title={d.dateiname}
            >
              {d.dateiname}
            </a>
            <button onClick={() => loesche(d)} className="text-gray-400 hover:text-red-600 shrink-0" title="Löschen">✕</button>
          </li>
        ))}
        {dateien.length === 0 && <li className="text-xs text-gray-400">Noch nichts hochgeladen.</li>}
      </ul>

      {fehler && <p className="text-xs text-red-600 mb-2">{fehler}</p>}

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
    </div>
  )
}
