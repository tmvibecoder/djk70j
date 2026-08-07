'use client'

// Karten-Tab: Saison-Auswahl, Statistik, Suche/Filter, Karten-Grid
// (Mockup-Variante C) mit Ausgabe-Flow aus Variante B. Rot markiert = offen.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { verteilerListe } from '@/lib/dauerkarten-felder'
import { AusgabeFlow } from './AusgabeFlow'
import { KarteDetail } from './KarteDetail'
import { NeuKarte } from './NeuKarte'
import {
  Karte,
  Saison,
  euro,
  inhaberName,
  istWunschnummer,
  kartennummerAnzeige,
  zahlbetragKarte,
} from './typen'

type Filter = 'alle' | 'offen' | 'nichtAusgegeben' | 'geschenke' | 'druck'

const FILTER_LABELS: Record<Filter, string> = {
  alle: 'Alle',
  offen: 'Offen',
  nichtAusgegeben: 'Nicht ausgegeben',
  geschenke: 'Geschenke',
  druck: 'Nur Druck',
}

export function KartenView() {
  const [saisons, setSaisons] = useState<Saison[]>([])
  const [saisonId, setSaisonId] = useState('')
  const [saison, setSaison] = useState<Saison | null>(null)
  const [karten, setKarten] = useState<Karte[]>([])
  const [verteiler, setVerteiler] = useState<string[]>([])
  const [geladen, setGeladen] = useState(false)
  const [suche, setSuche] = useState('')
  const [filter, setFilter] = useState<Filter>('alle')
  const [detail, setDetail] = useState<Karte | null>(null)
  const [ausgabe, setAusgabe] = useState<Karte | null>(null)
  const [neuOffen, setNeuOffen] = useState(false)
  const [exporteOffen, setExporteOffen] = useState(false)

  const laden = useCallback(async (gewuenschteSaison?: string) => {
    const ziel = gewuenschteSaison ?? saisonId
    const [sRes, kRes, eRes] = await Promise.all([
      fetch('/api/dauerkarten/saisons'),
      fetch(`/api/dauerkarten/karten${ziel ? `?saison=${ziel}` : ''}`),
      fetch('/api/dauerkarten/einstellungen'),
    ])
    if (sRes.ok) setSaisons(await sRes.json())
    if (kRes.ok) {
      const j = await kRes.json()
      setSaison(j.saison)
      setSaisonId(j.saison.id)
      setKarten(j.karten)
    }
    if (eRes.ok) {
      const e = await eRes.json()
      setVerteiler(verteilerListe(e.verteiler ?? ''))
    }
    setGeladen(true)
  }, [saisonId])

  useEffect(() => {
    laden()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Detail-/Ausgabe-Karte nach dem Neuladen aktuell halten
  const aktualisieren = useCallback(async () => {
    const res = await fetch(`/api/dauerkarten/karten${saisonId ? `?saison=${saisonId}` : ''}`)
    if (res.ok) {
      const j = await res.json()
      setKarten(j.karten)
      setSaison(j.saison)
      setDetail(d => (d ? j.karten.find((k: Karte) => k.id === d.id) ?? null : null))
    }
  }, [saisonId])

  const stats = useMemo(() => {
    const relevante = karten.filter(k => k.kategorie !== 'druck')
    const offene = relevante.filter(k => !k.bezahlt)
    return {
      verkauft: relevante.filter(k => k.bezahlt && k.zahlart !== 'geschenk').length,
      offenAnzahl: offene.length,
      offenSumme: offene.reduce((s, k) => s + zahlbetragKarte(k), 0),
      geschenke: relevante.filter(k => k.zahlart === 'geschenk').length,
      nichtAusgegeben: relevante.filter(k => k.status === 'angelegt').length,
    }
  }, [karten])

  const gefiltert = useMemo(() => {
    const s = suche.trim().toLowerCase()
    return karten.filter(k => {
      if (filter === 'offen' && (k.bezahlt || k.kategorie === 'druck')) return false
      if (filter === 'nichtAusgegeben' && (k.status !== 'angelegt' || k.kategorie === 'druck')) return false
      if (filter === 'geschenke' && k.zahlart !== 'geschenk') return false
      if (filter === 'druck' && k.kategorie !== 'druck') return false
      if (filter === 'alle' && k.kategorie === 'druck') return false
      if (!s) return true
      return (
        inhaberName(k.inhaber).toLowerCase().includes(s) ||
        kartennummerAnzeige(k).includes(s) ||
        String(k.lfdNr).includes(s)
      )
    })
  }, [karten, suche, filter])

  if (!geladen) {
    return <div className="text-center text-gray-400 text-sm py-12">Lade…</div>
  }
  if (!saison) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-sm text-gray-500">
        Noch keine Saison angelegt — zuerst unter ⚙️ Einstellungen eine Saison anlegen.
      </div>
    )
  }

  return (
    <div>
      {/* Kopf: Saison + Aktionen */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <select
          value={saisonId}
          onChange={e => laden(e.target.value)}
          className="bg-white rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium"
        >
          {saisons.map(s => (
            <option key={s.id} value={s.id}>
              Saison {s.bezeichnung}{s.aktiv ? ' (aktiv)' : ''}
            </option>
          ))}
        </select>
        <div className="flex gap-2 relative">
          <button
            onClick={() => setNeuOffen(true)}
            className="text-sm font-semibold bg-yellow-500 text-gray-900 px-4 py-1.5 rounded-lg"
          >
            + Neue Karte
          </button>
          <button
            onClick={() => setExporteOffen(o => !o)}
            className="text-sm font-medium bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg"
          >
            Listen ▾
          </button>
          {exporteOffen && (
            <div className="absolute right-0 top-10 w-64 bg-white border border-gray-200 rounded-lg shadow-lg text-sm z-10 overflow-hidden">
              <a
                href={`/api/dauerkarten/pdf/kassierer?saison=${saisonId}`}
                target="_blank"
                className="block px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 font-medium text-gray-700"
                onClick={() => setExporteOffen(false)}
              >
                📋 Platzkassierer-Liste (PDF)
              </a>
              {verteiler.map(v => (
                <a
                  key={v}
                  href={`/api/dauerkarten/pdf/verteilerliste?saison=${saisonId}&verteiler=${encodeURIComponent(v)}`}
                  target="_blank"
                  className="block px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 text-gray-700"
                  onClick={() => setExporteOffen(false)}
                >
                  🖨 Ausgabeliste {v} (PDF)
                </a>
              ))}
              <a
                href={`/api/dauerkarten/export/seriendruck?saison=${saisonId}`}
                className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700"
                onClick={() => setExporteOffen(false)}
              >
                ⬇ Excel-Export Seriendruck (CSV)
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2.5 text-center">
          <p className="text-lg font-black text-gray-900">{stats.verkauft}</p>
          <p className="text-[10px] text-gray-500 uppercase">Verkauft</p>
        </div>
        <button onClick={() => setFilter(filter === 'offen' ? 'alle' : 'offen')} className={`bg-white rounded-xl border shadow-sm p-2.5 text-center ${filter === 'offen' ? 'border-red-400' : 'border-gray-200'}`}>
          <p className="text-lg font-black text-red-600">{stats.offenAnzahl}</p>
          <p className="text-[10px] text-gray-500 uppercase">Offen · {euro(stats.offenSumme)}</p>
        </button>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2.5 text-center">
          <p className="text-lg font-black text-purple-700">{stats.geschenke}</p>
          <p className="text-[10px] text-gray-500 uppercase">Geschenke</p>
        </div>
        <button onClick={() => setFilter(filter === 'nichtAusgegeben' ? 'alle' : 'nichtAusgegeben')} className={`bg-white rounded-xl border shadow-sm p-2.5 text-center ${filter === 'nichtAusgegeben' ? 'border-yellow-400' : 'border-gray-200'}`}>
          <p className="text-lg font-black text-gray-900">{stats.nichtAusgegeben}</p>
          <p className="text-[10px] text-gray-500 uppercase">Nicht ausgegeben</p>
        </button>
      </div>

      {/* Suche + Filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 mb-4">
        <input
          value={suche}
          onChange={e => setSuche(e.target.value)}
          placeholder="🔍 Name oder Kartennummer suchen…"
          className="bg-gray-50 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-2"
        />
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Karten-Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {gefiltert.map(k => {
          const offen = !k.bezahlt && k.kategorie !== 'druck'
          return (
            <button
              key={k.id}
              onClick={() => setDetail(k)}
              className={`text-left bg-white rounded-xl border shadow-sm p-3.5 hover:shadow-md transition ${
                offen ? 'border-l-4 border-red-500 border-t-gray-200 border-r-gray-200 border-b-gray-200' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{inhaberName(k.inhaber)}</p>
                  <p className="text-xs text-gray-500 truncate">
                    lfd. {k.lfdNr} · Karte{' '}
                    <span className={istWunschnummer(k) ? 'text-yellow-600 font-bold' : ''}>
                      {kartennummerAnzeige(k)}
                      {istWunschnummer(k) ? ' ★' : ''}
                    </span>
                    {k.inhaber.info ? ` · ${k.inhaber.info}` : ''}
                  </p>
                </div>
                <span
                  className={`font-mono text-xs px-2 py-0.5 rounded shrink-0 ${
                    k.kategorie === 'druck'
                      ? 'bg-purple-600 text-white'
                      : k.zahlart === 'geschenk'
                        ? 'bg-purple-600 text-white'
                        : offen
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-900 text-yellow-400'
                  }`}
                >
                  {k.kategorie === 'druck' ? 'Druck' : k.zahlart === 'geschenk' ? '🎁' : `${euro(zahlbetragKarte(k))}${offen ? ' offen' : ''}`}
                </span>
              </div>
              <div className="flex gap-1.5 flex-wrap items-center">
                {k.kategorie !== 'druck' && (
                  k.bezahlt ? (
                    <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      ✓ {k.zahlart === 'geschenk' ? 'Geschenk' : { bar: 'Bar', pos: `POS${k.transaktionsNr ? ` · ${k.transaktionsNr}` : ''}`, ueberweisung: 'Überweisung', paypal: 'PayPal' }[k.zahlart] ?? k.zahlart}
                    </span>
                  ) : (
                    <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      {k.zahlungSpaeterUeber ? `⏳ später: ${{ bar: 'Bar', ueberweisung: 'Überweisung', paypal: 'PayPal' }[k.zahlungSpaeterUeber]}` : 'offen'}
                    </span>
                  )
                )}
                {k.kategorie !== 'druck' && (
                  k.status === 'ausgegeben' ? (
                    <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      ✓ {k.ohneSignatur ? 'ohne el. Signatur' : 'signiert'}
                    </span>
                  ) : (
                    <span
                      onClick={e => {
                        e.stopPropagation()
                        setAusgabe(k)
                      }}
                      className="text-[11px] bg-gray-900 text-white px-2.5 py-0.5 rounded-full font-semibold cursor-pointer"
                    >
                      → Ausgeben
                    </span>
                  )
                )}
                {k.verteiler && (
                  <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{k.verteiler}</span>
                )}
                {k.inhaber.keineKarteMehr && (
                  <span className="text-[11px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">nächste Saison ✕</span>
                )}
              </div>
            </button>
          )
        })}
        {gefiltert.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-sm text-gray-400">
            Keine Karten gefunden.
          </div>
        )}
      </div>

      {detail && (
        <KarteDetail
          key={`${detail.id}-${detail.status}-${detail.bezahlt}`}
          karte={detail}
          verteilerListe={verteiler}
          onAktualisiert={aktualisieren}
          onSchliessen={() => setDetail(null)}
          onAusgabe={k => {
            setDetail(null)
            setAusgabe(k)
          }}
        />
      )}
      {ausgabe && (
        <AusgabeFlow
          karte={ausgabe}
          verteilerListe={verteiler}
          onFertig={async () => {
            setAusgabe(null)
            await aktualisieren()
          }}
          onSchliessen={() => setAusgabe(null)}
        />
      )}
      {neuOffen && (
        <NeuKarte
          saisonId={saisonId}
          verteilerListe={verteiler}
          onFertig={async () => {
            setNeuOffen(false)
            await aktualisieren()
          }}
          onSchliessen={() => setNeuOffen(false)}
        />
      )}
    </div>
  )
}
