'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, Input, Select } from '@/components/ui'
import { RECHNUNG_STATUS_OPTIONEN, anteiligerNetto, formatEuro, rund2 } from '@/data/djk-info'
import { useDarfVerwalten } from './InfoShell'
import { RechnungDto, alsDatumsfeld } from './typen'

export function RechnungEditView({ rechnungId }: { rechnungId: string }) {
  const router = useRouter()
  const darfVerwalten = useDarfVerwalten()
  const [rechnung, setRechnung] = useState<RechnungDto | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [laden, setLaden] = useState(true)
  const [speichern, setSpeichern] = useState(false)
  const [meldung, setMeldung] = useState<{ art: 'ok' | 'fehler'; text: string } | null>(null)

  useEffect(() => {
    fetch(`/api/djk-info/rechnungen/${rechnungId}`)
      .then(r => (r.ok ? r.json() : null))
      .then((r: RechnungDto | null) => {
        if (r) {
          setRechnung(r)
          setForm({
            datum: alsDatumsfeld(r.datum),
            firma: r.firma,
            zusatz: r.zusatz ?? '',
            ansprechpartner: r.ansprechpartner ?? '',
            strasse: r.strasse ?? '',
            plz: r.plz ?? '',
            ort: r.ort ?? '',
            anzeigenGroesse: r.anzeigenGroesse,
            jahresNetto: String(r.jahresNetto),
            anzahlAusgaben: String(r.anzahlAusgaben),
            ausgabenListe: r.ausgabenListe,
            netto: String(r.netto),
            mwstSatz: String(r.mwstSatz),
            mwst: String(r.mwst),
            brutto: String(r.brutto),
            zahlungszielTage: String(r.zahlungszielTage),
            status: r.status,
            bemerkung: r.bemerkung ?? '',
          })
        }
        setLaden(false)
      })
  }, [rechnungId])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const zahl = (k: string) => parseFloat((form[k] ?? '').replace(',', '.')) || 0

  // Beträge aus Jahrespreis × Ausgaben ÷ 3 neu berechnen — überschreibt die
  // Betragsfelder, die danach weiterhin von Hand geändert werden können
  const neuBerechnen = () => {
    const netto = anteiligerNetto(zahl('jahresNetto'), Math.round(zahl('anzahlAusgaben')))
    const mwst = rund2((netto * zahl('mwstSatz')) / 100)
    setForm(f => ({
      ...f,
      netto: String(netto),
      mwst: String(mwst),
      brutto: String(rund2(netto + mwst)),
    }))
  }

  const speichere = async () => {
    setSpeichern(true)
    setMeldung(null)
    const res = await fetch(`/api/djk-info/rechnungen/${rechnungId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSpeichern(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setMeldung({ art: 'fehler', text: j.error || 'Speichern fehlgeschlagen' })
      return
    }
    setMeldung({ art: 'ok', text: 'Gespeichert.' })
  }

  const loesche = async () => {
    if (!rechnung || !confirm(`Rechnung ${rechnung.nummer} wirklich löschen?`)) return
    await fetch(`/api/djk-info/rechnungen/${rechnungId}`, { method: 'DELETE' })
    router.push('/djk-info/rechnungen')
    router.refresh()
  }

  if (laden) return <p className="text-sm text-gray-500 py-8 text-center">Lade Rechnung…</p>
  if (!rechnung) return <p className="text-sm text-gray-500 py-8 text-center">Rechnung nicht gefunden.</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link href="/djk-info/rechnungen" className="text-sm text-gray-500 hover:text-gray-900">← Zu den Rechnungen</Link>
        <div className="flex gap-2">
          <a
            href={`/api/djk-info/rechnungen/${rechnungId}/pdf`}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
          >
            📄 PDF herunterladen
          </a>
          {darfVerwalten && (
            <Button variant="danger" size="sm" onClick={loesche}>Löschen</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="!py-3 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Rechnung {rechnung.nummer}</h2>
          {rechnung.kunde && (
            <Link href={`/djk-info/kunden/${rechnung.kunde.id}`} className="text-xs text-emerald-700 hover:underline">
              Zum Kunden: {rechnung.kunde.firma}
            </Link>
          )}
        </CardHeader>
        <CardContent>
          <fieldset disabled={!darfVerwalten} className="space-y-5 disabled:opacity-90">
            <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Hinweis: Alle Felder sind bewusst nachträglich änderbar. Bedenke, dass bereits
              verschickte Rechnungen eigentlich nicht mehr geändert werden sollten.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Abrechnungsjahr" value={String(rechnung.leistungsjahr)} disabled />
              <Input label="Rechnungsdatum" type="date" value={form.datum ?? ''} onChange={set('datum')} />
              <Select label="Status" value={form.status ?? 'erstellt'} onChange={set('status')} options={RECHNUNG_STATUS_OPTIONEN} />
            </div>

            <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Firma (Rechnungsempfänger) *" value={form.firma ?? ''} onChange={set('firma')} />
              <Input label="Zusatz" value={form.zusatz ?? ''} onChange={set('zusatz')} />
              <Input label="Ansprechpartner" value={form.ansprechpartner ?? ''} onChange={set('ansprechpartner')} />
              <Input label="Straße" value={form.strasse ?? ''} onChange={set('strasse')} />
              <Input label="PLZ" value={form.plz ?? ''} onChange={set('plz')} />
              <Input label="Ort" value={form.ort ?? ''} onChange={set('ort')} />
            </div>

            <div className="border-t border-gray-100 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input label="Jahrespreis netto (€)" inputMode="decimal" value={form.jahresNetto ?? ''} onChange={set('jahresNetto')} />
              <Input label="Anzahl Ausgaben" inputMode="numeric" value={form.anzahlAusgaben ?? ''} onChange={set('anzahlAusgaben')} />
              <div className="flex items-end pb-1">
                <Button variant="secondary" size="sm" onClick={neuBerechnen}>↻ Beträge neu berechnen</Button>
              </div>
              <Input label="Netto (€)" inputMode="decimal" value={form.netto ?? ''} onChange={set('netto')} />
              <Input label={`MwSt. ${form.mwstSatz ?? 19} % (€)`} inputMode="decimal" value={form.mwst ?? ''} onChange={set('mwst')} />
              <Input label="Brutto (€)" inputMode="decimal" value={form.brutto ?? ''} onChange={set('brutto')} />
              <Input label="MwSt.-Satz (%)" inputMode="decimal" value={form.mwstSatz ?? ''} onChange={set('mwstSatz')} />
              <Input label="Zahlungsziel (Tage)" inputMode="numeric" value={form.zahlungszielTage ?? ''} onChange={set('zahlungszielTage')} />
              <div className="flex flex-col justify-end pb-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Endsumme</p>
                <p className="text-sm font-bold text-gray-900">{formatEuro(zahl('brutto'))}</p>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <Input label="Anzeigengröße (auf der PDF)" value={form.anzeigenGroesse ?? ''} onChange={set('anzeigenGroesse')} placeholder="z.B. 1/2" />
              </div>
              <Input label="Ausgaben (auf der PDF)" value={form.ausgabenListe ?? ''} onChange={set('ausgabenListe')} placeholder="z.B. 2026-1, 2026-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bemerkung (intern, erscheint nicht auf dem PDF)</label>
              <textarea
                value={form.bemerkung ?? ''}
                onChange={set('bemerkung')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                <Button onClick={speichere} disabled={speichern || !(form.firma ?? '').trim()}>
                  {speichern ? 'Speichern…' : 'Speichern'}
                </Button>
              </div>
            )}
          </fieldset>
        </CardContent>
      </Card>
    </div>
  )
}
