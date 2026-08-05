'use client'

import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, Input } from '@/components/ui'
import { EinstellungenDto } from './typen'

export function EinstellungenView() {
  const [form, setForm] = useState<Record<string, string> | null>(null)
  const [speichern, setSpeichern] = useState(false)
  const [meldung, setMeldung] = useState<{ art: 'ok' | 'fehler'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/werbebanden/einstellungen')
      .then(r => r.json())
      .then((e: EinstellungenDto) =>
        setForm({
          vereinsname: e.vereinsname ?? '',
          kassierName: e.kassierName ?? '',
          absenderzeile: e.absenderzeile ?? '',
          zahlungszielTage: String(e.zahlungszielTage ?? 14),
          standardPreisProMeter: String(e.standardPreisProMeter ?? 40),
          mwstSatz: String(e.mwstSatz ?? 19),
          kopfKontaktblock: e.kopfKontaktblock ?? '',
          fusszeileSpalte1: e.fusszeileSpalte1 ?? '',
          fusszeileSpalte2: e.fusszeileSpalte2 ?? '',
          fusszeileSpalte3: e.fusszeileSpalte3 ?? '',
        }),
      )
  }, [])

  if (!form) return <p className="text-sm text-gray-500 py-8 text-center">Lade Einstellungen…</p>

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...(f as Record<string, string>), [k]: e.target.value }))

  const speichere = async () => {
    setSpeichern(true)
    setMeldung(null)
    const res = await fetch('/api/werbebanden/einstellungen', {
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
            <Input label="Standardpreis pro Meter (€ netto)" inputMode="decimal" value={form.standardPreisProMeter} onChange={set('standardPreisProMeter')} />
            <Input label="MwSt.-Satz (%)" inputMode="decimal" value={form.mwstSatz} onChange={set('mwstSatz')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="!py-3">
          <h2 className="font-bold text-gray-900">Briefkopf & Fußzeile der Rechnung</h2>
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
