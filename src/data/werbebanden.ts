// Fachdaten des Werbebanden-Bereichs (Platzmaße, Auswahllisten).
// Quelle: Excel „Abrechnung DJK Bandenwerbung 2026", Blatt „Allgemein".

export interface PlatzAbschnitt {
  nr: number
  name: string
  laenge: number // Meter
}

// Drei Platzabschnitte (alle mit Befestigung). Die früher separat geführte
// Zusatzfläche (17,5 m) gehört zu Abschnitt 3 und ist dort eingerechnet.
export const PLATZ_ABSCHNITTE: PlatzAbschnitt[] = [
  { nr: 1, name: 'Bis zur 1. Spielerbank (DJK)', laenge: 34 },
  { nr: 2, name: 'Zwischen den Spielerbänken', laenge: 26.88 },
  { nr: 3, name: 'Ab der 2. Spielerbank (Heimmannschaft)', laenge: 35.5 },
]

export function abschnittName(nr: number | null | undefined): string {
  const a = PLATZ_ABSCHNITTE.find(x => x.nr === nr)
  return a ? a.name : '—'
}

export const RECHNUNGSVERSAND_OPTIONEN = [
  { value: 'post', label: 'Post' },
  { value: 'uebergabe', label: 'Persönliche Übergabe' },
  { value: 'email', label: 'E-Mail-Versand' },
]

export function rechnungsversandLabel(value: string | null | undefined): string {
  return RECHNUNGSVERSAND_OPTIONEN.find(o => o.value === value)?.label ?? '—'
}

export const PARTNER_STATUS_OPTIONEN = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'gekuendigt', label: 'Gekündigt' },
]

export const RECHNUNG_STATUS_OPTIONEN = [
  { value: 'erstellt', label: 'Erstellt' },
  { value: 'versendet', label: 'Versendet' },
  { value: 'bezahlt', label: 'Bezahlt' },
]

// "2026" → "2025/2026"
export function saisonFuerJahr(jahr: number): string {
  return `${jahr - 1}/${jahr}`
}

export function formatEuro(value: number): string {
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

export function formatMeter(value: number): string {
  return `${value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} m`
}
