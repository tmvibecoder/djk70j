// Fachkonstanten des DJK-Info-Bereichs (Vereinszeitschrift).

// Anzeigengrößen in Anzeige-Reihenfolge (Schlüssel = InfoPreis.groesse)
export const GROESSEN_REIHENFOLGE = ['1/1', '3/4', '2/3', '1/2', '1/3', '1/4'] as const

export function groesseKurzLabel(groesse: string | null | undefined): string {
  const labels: Record<string, string> = {
    '1/1': '1 Seite', '3/4': '¾ Seite', '2/3': '⅔ Seite',
    '1/2': '½ Seite', '1/3': '⅓ Seite', '1/4': '¼ Seite',
  }
  return groesse ? labels[groesse] ?? groesse : '—'
}

// Versandarten (Rechnung an den Kunden bzw. Broschüre an den Werbepartner)
export const RECHNUNGSVERSAND_OPTIONEN = [
  { value: 'post', label: 'Post' },
  { value: 'persoenlich', label: 'Persönliche Übergabe' },
  { value: 'email', label: 'E-Mail' },
]

export const BROSCHUERENVERSAND_OPTIONEN = [
  { value: 'persoenlich', label: 'Persönliche Übergabe' },
  { value: 'post', label: 'Post' },
  { value: 'email', label: 'E-Mail mit Download-Link' },
]

export function versandLabel(value: string | null | undefined, optionen: { value: string; label: string }[]): string {
  return optionen.find(o => o.value === value)?.label ?? '—'
}

export const KUNDE_STATUS_OPTIONEN = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'gekuendigt', label: 'Gekündigt' },
]

export const RECHNUNG_STATUS_OPTIONEN = [
  { value: 'erstellt', label: 'Erstellt' },
  { value: 'versendet', label: 'Versendet' },
  { value: 'bezahlt', label: 'Bezahlt' },
]

export const AUSGABE_STATUS_OPTIONEN = [
  { value: 'geplant', label: 'Geplant' },
  { value: 'erschienen', label: 'Erschienen' },
]

// Verteilbereichs-Kategorien (InfoVerteilgebiet.kategorie)
export const GEBIET_KATEGORIEN = [
  { value: 'gebiet', label: 'Austragegebiet Ottenhofen' },
  { value: 'ortsteil', label: 'Ortsteil' },
  { value: 'auslage', label: 'Auslagestelle' },
  { value: 'postversand', label: 'Postversand' },
]

// Packeinheiten der Hefte-Logistik (aus der Verteilerliste)
export const PACKEINHEIT = 24 // 1 Einheit mit Paketband
export const PAECKCHEN = 96 // 4 Einheiten
export const PAKET = 384 // 4 Päckchen

export function formatEuro(value: number): string {
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

// Anteiliger Jahresbetrag: n geschaltete Ausgaben von ausgabenProJahr (3).
// WICHTIG: erst multiplizieren, dann runden — nie den gerundeten Einzelpreis
// mal n nehmen (290 ÷ 3 → 96,67 × 3 = 290,01 statt 290,00).
export function anteiligerNetto(jahresNetto: number, anzahlAusgaben: number, ausgabenProJahr = 3): number {
  return Math.round((jahresNetto * anzahlAusgaben * 100) / ausgabenProJahr) / 100
}

export function rund2(n: number): number {
  return Math.round(n * 100) / 100
}
