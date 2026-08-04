// Feld-Whitelists für die Schlüssel-APIs: erlaubte Felder aus dem
// Request-Body übernehmen (statt Spread, damit z.B. id/createdAt nicht
// überschrieben werden können) und Typen robust wandeln (deutsche
// Dezimal-Eingaben mit Komma, leere Strings → Leerstring/null).

function str(body: Record<string, unknown>, k: string): string | null {
  const v = body[k]
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null
}

function num(body: Record<string, unknown>, k: string, fallback: number | null = null): number | null {
  const v = body[k]
  if (v === null || v === undefined || v === '') return fallback
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : fallback
}

export const SCHLUESSEL_SYSTEME = ['abus', 'transponder', 'schrank', 'sonstige'] as const
export const EXEMPLAR_STATUS = ['archiv', 'ausgegeben', 'keygarage', 'verloren', 'gesperrt'] as const

export function typDaten(body: Record<string, unknown>) {
  const system = str(body, 'system') ?? ''
  return {
    system: (SCHLUESSEL_SYSTEME as readonly string[]).includes(system) ? system : 'sonstige',
    code: str(body, 'code') ?? '',
    bezeichnung: str(body, 'bezeichnung') ?? '',
    kategorie: str(body, 'kategorie') ?? '',
    sortier: Math.round(num(body, 'sortier', 0) ?? 0),
    bemerkung: str(body, 'bemerkung'),
  }
}

export function exemplarDaten(body: Record<string, unknown>) {
  const status = str(body, 'status') ?? 'archiv'
  return {
    nummer: str(body, 'nummer'),
    status: (EXEMPLAR_STATUS as readonly string[]).includes(status) ? status : 'archiv',
    lagerDetail: str(body, 'lagerDetail'),
    bemerkung: str(body, 'bemerkung'),
  }
}

export function personDaten(body: Record<string, unknown>) {
  return {
    name: str(body, 'name') ?? '',
    bereich: str(body, 'bereich') ?? '',
    funktion: str(body, 'funktion') ?? '',
    adresse: str(body, 'adresse') ?? '',
    telefon: str(body, 'telefon') ?? '',
    email: str(body, 'email') ?? '',
    bemerkung: str(body, 'bemerkung'),
  }
}

export function tuerDaten(body: Record<string, unknown>) {
  return {
    name: str(body, 'name') ?? '',
    nummer: str(body, 'nummer'),
    sortier: Math.round(num(body, 'sortier', 0) ?? 0),
  }
}

export function einstellungenDaten(body: Record<string, unknown>) {
  return {
    standardPfand: num(body, 'standardPfand', 20) ?? 20,
    ausgeberName: str(body, 'ausgeberName') ?? '',
  }
}

export { num as parseNum, str as parseStr }
