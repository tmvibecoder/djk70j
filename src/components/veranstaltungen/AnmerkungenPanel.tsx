'use client'

import { useCallback, useEffect, useState } from 'react'
import s from './abschlussbericht.module.css'

// Anmerkungen von Besuchern zum Abschlussbericht (Variante A aus den Mockups):
// gelber Balken, der beim Scrollen oben sichtbar bleibt; aufklappbares Formular
// mit Name, TOP-Auswahl (inkl. „Sonstiges"), abhängigem Unterpunkt-Dropdown und
// Notizfeld; darunter die für alle sichtbare Liste der bisherigen Anmerkungen.

interface Anmerkung {
  id: string
  name: string
  top: string
  unterpunkt: string | null
  text: string
  createdAt: string
}

// Struktur des Protokolls für die zweistufige Auswahl.
// „Sonstiges" fängt alles auf, was zu keinem TOP passt (kein Unterpunkt).
const TOPS: { id: string; label: string; subs: string[] }[] = [
  { id: 'top1', label: 'TOP 1 · Gesamtfazit', subs: [] },
  {
    id: 'top2',
    label: 'TOP 2 · Was gut gelaufen ist',
    subs: [
      'Stimmung & Team', 'Wetter & Gelände', 'Samstag', 'Festsonntag', 'Gastronomie',
      'Ausschankanhänger', 'Planung', 'Technik & Atmosphäre', 'Koordination',
      'Improvisation Festsonntag',
    ],
  },
  {
    id: 'top3',
    label: 'TOP 3 · Verbesserungspotenzial',
    subs: [
      '3.1 · Besucher & Werbung', '3.2 · Zuständigkeiten & Team',
      '3.3 · Einkauf, Rechnungen & Kasse', '3.4 · Infrastruktur & Abläufe',
      '3.5 · Gäste-Erlebnis',
    ],
  },
  {
    id: 'top4',
    label: 'TOP 4 · Maßnahmenliste',
    subs: [
      'Werbung', 'Gemeinde', 'Einkauf', 'Kasse', 'Personal', 'Ausschank', 'Küche',
      'Infrastruktur', 'Programm', 'Doku',
    ],
  },
  {
    id: 'top5',
    label: 'TOP 5 · Endabrechnung',
    subs: [
      '5.1 · Rahmendaten', '5.2 · Finanzübersicht', '5.3 · Umsätze & Kosten nach Tagen',
      '5.4 · Umsätze nach Standorten', '5.5 · Kostenübersicht',
    ],
  },
  { id: 'sonstiges', label: 'Sonstiges — passt zu keinem Punkt', subs: [] },
]

const topLabel = (id: string) => TOPS.find(t => t.id === id)?.label ?? id

export default function AnmerkungenPanel({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false)
  const [anmerkungen, setAnmerkungen] = useState<Anmerkung[]>([])
  const [name, setName] = useState('')
  const [top, setTop] = useState('')
  const [unterpunkt, setUnterpunkt] = useState('')
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/anmerkungen?event=${eventId}`)
    if (res.ok) setAnmerkungen(await res.json())
  }, [eventId])

  useEffect(() => { load() }, [load])

  const selectedTop = TOPS.find(t => t.id === top)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !top || !text.trim()) return
    setSaving(true)
    const res = await fetch('/api/anmerkungen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, name, top, unterpunkt: unterpunkt || null, text }),
    })
    setSaving(false)
    if (res.ok) {
      setSuccess(`Danke, ${name.trim()} — deine Anmerkung zu „${topLabel(top)}${unterpunkt ? ' › ' + unterpunkt : ''}“ ist gespeichert.`)
      setTop('')
      setUnterpunkt('')
      setText('')
      load()
    }
  }

  return (
    <div className={s['anm-sticky']}>
      <button
        type="button"
        className={s['anm-bar']}
        aria-expanded={open}
        onClick={() => { setOpen(o => !o); setSuccess(null) }}
      >
        <span>✎&nbsp; Anmerkung schreiben</span>
        <span className={s['anm-count']}>
          {anmerkungen.length === 1 ? '1 Anmerkung' : `${anmerkungen.length} Anmerkungen`} {open ? '▴' : '▾'}
        </span>
      </button>

      {open && (
        <div className={s['anm-panel']}>
          <p className={s['anm-title']}>Anmerkung zum Protokoll</p>
          <p className={s['anm-sub']}>
            Dein Hinweis ist für alle Besucher sichtbar und wird vom Festausschuss vor der
            Vorstandssitzung am 13. August gesichtet.
          </p>

          <form onSubmit={submit}>
            <div className={`${s['anm-row']} ${s['anm-row2']}`}>
              <div>
                <label className={s['anm-label']} htmlFor="anm-name">Dein Name</label>
                <input
                  id="anm-name"
                  className={s['anm-input']}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="z. B. Maria Huber"
                  required
                />
              </div>
              <div>
                <label className={s['anm-label']} htmlFor="anm-top">Zu welchem TOP-Punkt?</label>
                <select
                  id="anm-top"
                  className={s['anm-select']}
                  value={top}
                  onChange={e => { setTop(e.target.value); setUnterpunkt('') }}
                  required
                >
                  <option value="" disabled>Bitte wählen …</option>
                  {TOPS.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedTop && selectedTop.subs.length > 0 && (
              <div className={s['anm-row']}>
                <div>
                  <label className={s['anm-label']} htmlFor="anm-sub">Zu welchem Punkt genau?</label>
                  <select
                    id="anm-sub"
                    className={s['anm-select']}
                    value={unterpunkt}
                    onChange={e => setUnterpunkt(e.target.value)}
                  >
                    <option value="">Allgemein — der ganze TOP</option>
                    {selectedTop.subs.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <div className={s['anm-hint']}>Optional — „Allgemein“ lassen, wenn es um den ganzen TOP geht.</div>
                </div>
              </div>
            )}

            <div className={s['anm-row']}>
              <div>
                <label className={s['anm-label']} htmlFor="anm-text">Deine Anmerkung oder Korrektur</label>
                <textarea
                  id="anm-text"
                  className={s['anm-area']}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Was sollte angepasst werden, was fehlt, was stimmt so nicht?"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" className={s['anm-submit']} disabled={saving}>
                {saving ? 'Wird gespeichert …' : 'Anmerkung absenden'}
              </button>
              <button type="button" className={s['anm-cancel']} onClick={() => setOpen(false)}>
                Schließen
              </button>
            </div>
          </form>

          {success && (
            <div className={s['anm-success']}><b>✓</b> {success}</div>
          )}

          <div className={s['anm-sec']}>
            Bisherige Anmerkungen ({anmerkungen.length})
          </div>
          {anmerkungen.length === 0 && (
            <p className={s['anm-empty']}>Noch keine Anmerkungen — deine kann die erste sein.</p>
          )}
          {anmerkungen.map(a => (
            <div key={a.id} className={s['anm-item']}>
              <div className={s['anm-item-who']}>
                {a.name}{' '}
                <span className={s['anm-item-date']}>
                  · {new Date(a.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <span className={s['anm-item-where']}>
                {topLabel(a.top)}{a.unterpunkt ? ` › ${a.unterpunkt}` : ''}
              </span>
              <p className={s['anm-item-text']}>{a.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
