// Veranstaltungs-Register — DIE zentrale Stelle für alle Veranstaltungen.
// Eine neue Veranstaltung = ein neuer Eintrag in VERANSTALTUNGEN (siehe
// ANLEITUNG-NEUE-VERANSTALTUNG.md im Projekt-Root). Navigation, Übersicht,
// URLs (/[eventId]/…) und das API-Scoping folgen automatisch diesem Register.

export type VeranstaltungId = 'jubilaeum-2026' | 'sommerfest-2027'

export type BereichKey = 'festplanung' | 'finanzplanung' | 'abschlussbericht'

export type VeranstaltungStatus = 'geplant' | 'laeuft' | 'abgeschlossen'

// Ein Veranstaltungstag (ersetzt die früheren hartkodierten UMSATZ_DAYS /
// ACCORDION_DAYS / EVENT_DAY_OPTIONS in der Finanzplanung).
export interface VeranstaltungsTag {
  key: string // z.B. "thursday" — auch Wert von eventDay in der DB
  label: string // z.B. "Donnerstag 09.07."
  short: string // z.B. "Do 09.07."
  icon: string // Emoji
  event: string // Programm des Tages, z.B. "Watt-Turnier"
}

export interface Veranstaltung {
  id: VeranstaltungId // technischer Kurzname, Teil der URL
  titel: string // Anzeigename im Menü
  icon: string // Emoji für Menü/Kacheln
  jahr: number // Sortierung/Archivierung
  zeitraum: string // Datum als Text, z.B. "9.–12. Juli 2026"
  status: VeranstaltungStatus
  bereiche: BereichKey[] // welche Unterseiten sichtbar sind (Reihenfolge = Menü)
  standNote?: string // sichtbarer Stand-Hinweis, z.B. "Endabrechnung per 27. Juli 2026"
  startDate?: string // ISO-Datum des Festbeginns — steuert den Countdown im Header
  tage: VeranstaltungsTag[] // Festtage (leer = noch nicht geplant)
}

export const BEREICH_LABELS: Record<BereichKey, string> = {
  festplanung: 'Festplanung',
  finanzplanung: 'Finanzplanung',
  abschlussbericht: 'Abschlussbericht',
}

export const BEREICH_ICONS: Record<BereichKey, string> = {
  festplanung: '📝',
  finanzplanung: '💰',
  abschlussbericht: '📄',
}

// Feste Reihenfolge der Bereiche in Menü und Kacheln — bei allen
// Veranstaltungen gleich (Vorgabe: Festplanung | Finanzplanung | Abschlussbericht).
export const BEREICH_ORDER: BereichKey[] = ['festplanung', 'finanzplanung', 'abschlussbericht']

export const DEFAULT_EVENT_ID: VeranstaltungId = 'jubilaeum-2026'

export const VERANSTALTUNGEN: Veranstaltung[] = [
  {
    id: 'jubilaeum-2026',
    titel: '70 Jahre Jubiläum 2026',
    icon: '🎉',
    jahr: 2026,
    zeitraum: '9.–12. Juli 2026',
    status: 'abgeschlossen',
    bereiche: ['festplanung', 'finanzplanung', 'abschlussbericht'],
    standNote: 'Endabrechnung per 27. Juli 2026',
    startDate: '2026-07-09T18:00:00',
    tage: [
      { key: 'thursday', label: 'Donnerstag 09.07.', short: 'Do 09.07.', icon: '🃏', event: 'Watt-Turnier' },
      { key: 'friday', label: 'Freitag 10.07.', short: 'Fr 10.07.', icon: '🎶', event: 'Disco-Party' },
      { key: 'saturday', label: 'Samstag 11.07.', short: 'Sa 11.07.', icon: '🎉', event: 'Festprogramm + Festzeltparty' },
      { key: 'sunday', label: 'Sonntag 12.07.', short: 'So 12.07.', icon: '⛪', event: 'Bayrischer Festsonntag' },
    ],
  },
  {
    id: 'sommerfest-2027',
    titel: 'DJK Sommerfest 2027',
    icon: '☀️',
    jahr: 2027,
    zeitraum: 'Sommer 2027',
    status: 'geplant',
    bereiche: ['festplanung', 'finanzplanung'],
    // startDate eintragen, sobald der Termin steht — dann erscheint der Countdown.
    // tage eintragen, sobald das Programm steht — dann zeigen Kosten/Umsätze die Festtage.
    tage: [],
  },
]

// Neueste zuerst (für Menü und Übersicht).
export const VERANSTALTUNGEN_SORTIERT: Veranstaltung[] = [...VERANSTALTUNGEN].sort(
  (a, b) => b.jahr - a.jahr
)

export function getVeranstaltung(id: string | undefined): Veranstaltung | undefined {
  return VERANSTALTUNGEN.find((v) => v.id === id)
}

// Bereiche einer Veranstaltung in der festen Anzeige-Reihenfolge.
export function sichtbareBereiche(v: Veranstaltung): BereichKey[] {
  return BEREICH_ORDER.filter((b) => v.bereiche.includes(b))
}

export const STATUS_LABELS: Record<VeranstaltungStatus, string> = {
  geplant: 'Geplant',
  laeuft: 'Läuft',
  abgeschlossen: 'Abgeschlossen',
}
