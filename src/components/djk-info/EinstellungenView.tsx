'use client'

import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, Input } from '@/components/ui'
import { formatEuro } from '@/data/djk-info'
import { EinstellungenDto, PreisDto } from './typen'

export function EinstellungenView() {
  const [form, setForm] = useState<Record<string, string> | null>(null)
  const [preise, setPreise] = useState<PreisDto[]>([])
  const [preisEingaben, setPreisEingaben] = useState<Record<string, string>>({})
  const [verboten, setVerboten] = useState(false)
  const [speichern, setSpeichern] = useState(false)
  const [meldung, setMeldung] = useState<{ art: 'ok' | 'fehler'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/djk-info/einstellungen')
      .then(r => {
        if (r.status === 403) { setVerboten(true); return null }
        return r.json()
      })
      .then((e: EinstellungenDto | null) => {
        if (!e) return
        setForm({
          vereinsname: e.vereinsname ?? '',
          kassierName: e.kassierName ?? '',
          absenderzeile: e.absenderzeile ?? '',
          zahlungszielTage: String(e.zahlungszielTage ?? 14),
          mwstSatz: String(e.mwstSatz ?? 19),
          ausgabenProJahr: String(e.ausgabenProJahr ?? 3),
          druckereiName: e.druckereiName ?? '',
          druckereiAnsprechpartner: e.druckereiAnsprechpartner ?? '',
          druckereiTelefon: e.druckereiTelefon ?? '',
          druckereiEmail: e.druckereiEmail ?? '',
          kopfKontaktblock: e.kopfKontaktblock ?? '',
          fusszeileSpalte1: e.fusszeileSpalte1 ?? '',
          fusszeileSpalte2: e.fusszeileSpalte2 ?? '',
          fusszeileSpalte3: e.fusszeileSpalte3 ?? '',
        })
      })
    fetch('/api/djk-info/preise')
      .then(r => r.json())
      .then((p: PreisDto[]) => {
        setPreise(p)
        setPreisEingaben(Object.fromEntries(p.map(x => [x.groesse, String(x.jahresNetto)])))
      })
      .catch(() => {})
  }, [])

  if (verboten) {
    return (
      <p className="text-sm text-gray-500 py-8 text-center">
        Die Einstellungen sind der Rolle „Verwalten&quot; vorbehalten.
      </p>
    )
  }
  if (!form) return <p className="text-sm text-gray-500 py-8 text-center">Lade Einstellungen…</p>

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...(f as Record<string, string>), [k]: e.target.value }))

  const speichere = async () => {
    setSpeichern(true)
    setMeldung(null)
    const res = await fetch('/api/djk-info/einstellungen', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        preise: preise.map(p => ({ groesse: p.groesse, jahresNetto: preisEingaben[p.groesse] ?? p.jahresNetto })),
      }),
    })
    setSpeichern(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setMeldung({ art: 'fehler', text: j.error || 'Speichern fehlgeschlagen' })
      return
    }
    setMeldung({ art: 'ok', text: 'Gespeichert.' })
  }

  const preisZahl = (g: string) => parseFloat((preisEingaben[g] ?? '').replace(',', '.')) || 0

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader className="!py-3">
          <h2 className="font-bold text-gray-900">DJK-Stammdaten für Rechnungen</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-500">
            Diese Angaben erscheinen auf jeder Rechnungs-PDF und können hier jederzeit
            angepasst werden (z.&nbsp;B. bei neuem Vorstand oder Kassier).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Vereinsname" value={form.vereinsname} onChange={set('vereinsname')} />
            <Input label="Name des Kassiers" value={form.kassierName} onChange={set('kassierName')} />
            <div className="sm:col-span-2">
              <Input
                label="Absenderzeile (klein über dem Adressfeld)"
                value={form.absenderzeile}
                onChange={set('absenderzeile')}
                placeholder="DJK SG Ottenhofen e.V. · Herdweger Str. 4 · 85570 Ottenhofen"
              />
            </div>
            <Input label="Zahlungsziel (Tage)" inputMode="numeric" value={form.zahlungszielTage} onChange={set('zahlungszielTage')} />
            <Input label="MwSt.-Satz (%)" inputMode="decimal" value={form.mwstSatz} onChange={set('mwstSatz')} />
            <Input label="Ausgaben pro Jahr" inputMode="numeric" value={form.ausgabenProJahr} onChange={set('ausgabenProJahr')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="!py-3">
          <h2 className="font-bold text-gray-900">Preistabelle</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-500">
            Jahrespreise netto je Anzeigengröße. Preis pro Anzeige = Jahrespreis ÷ {form.ausgabenProJahr || 3}.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <th className="px-3 py-2 font-semibold">Größe</th>
                <th className="px-3 py-2 font-semibold text-right">Preis/Jahr netto (€)</th>
                <th className="px-3 py-2 font-semibold text-right">Preis/Anzeige</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {preise.map(p => (
                <tr key={p.groesse}>
                  <td className="px-3 py-1.5 text-gray-700">{p.bezeichnung}</td>
                  <td className="px-3 py-1.5 text-right">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={preisEingaben[p.groesse] ?? ''}
                      onChange={e => setPreisEingaben(x => ({ ...x, [p.groesse]: e.target.value }))}
                      aria-label={`Jahrespreis ${p.bezeichnung}`}
                      className="bg-gray-50 w-24 px-2 py-1 text-sm text-right border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right text-gray-500 tabular-nums">
                    {formatEuro(preisZahl(p.groesse) / (parseInt(form.ausgabenProJahr, 10) || 3))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="!py-3">
          <h2 className="font-bold text-gray-900">Briefkopf &amp; Fußzeile der Rechnung</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-500">
            Übernommen aus der offiziellen Briefvorlage — eine Zeile pro Textzeile.
            Die Logos (Wappen links, DJK-Verbandslogo rechts) sind fest eingebaut.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kontaktblock rechts oben (Kassier)</label>
            <textarea
              value={form.kopfKontaktblock}
              onChange={set('kopfKontaktblock')}
              rows={4}
              className="bg-gray-50 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fußzeile links (Anschrift)</label>
              <textarea
                value={form.fusszeileSpalte1}
                onChange={set('fusszeileSpalte1')}
                rows={5}
                className="bg-gray-50 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fußzeile Mitte (Register/Vorstand)</label>
              <textarea
                value={form.fusszeileSpalte2}
                onChange={set('fusszeileSpalte2')}
                rows={5}
                className="bg-gray-50 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fußzeile rechts (Banken)</label>
              <textarea
                value={form.fusszeileSpalte3}
                onChange={set('fusszeileSpalte3')}
                rows={5}
                className="bg-gray-50 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="!py-3">
          <h2 className="font-bold text-gray-900">Druckerei</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Druckerei" value={form.druckereiName} onChange={set('druckereiName')} placeholder="Name der Druckerei" />
          <Input label="Ansprechpartner" value={form.druckereiAnsprechpartner} onChange={set('druckereiAnsprechpartner')} />
          <Input label="Telefon" value={form.druckereiTelefon} onChange={set('druckereiTelefon')} />
          <Input label="E-Mail" type="email" value={form.druckereiEmail} onChange={set('druckereiEmail')} />
        </CardContent>
      </Card>

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
        <Button onClick={speichere} disabled={speichern}>
          {speichern ? 'Speichern…' : 'Speichern'}
        </Button>
      </div>
    </div>
  )
}
