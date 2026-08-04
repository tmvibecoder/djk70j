// Geteilte Client-Typen des Schlüssel-Bereichs (Spiegelbild der API-Antworten)

export const SYSTEM_LABELS: Record<string, string> = {
  abus: 'Schließanlage Sportheim (ABUS)',
  transponder: 'Transponder Sporthalle',
  schrank: 'Schrankschlösser',
  sonstige: 'Sonstige Schlüssel',
}

export const STATUS_LABELS: Record<string, string> = {
  archiv: 'Archiv',
  ausgegeben: 'ausgegeben',
  keygarage: 'Keygarage',
  verloren: 'verloren',
  gesperrt: 'gesperrt',
}

export const STATUS_BADGE: Record<string, string> = {
  archiv: 'bg-emerald-100 text-emerald-700',
  ausgegeben: 'bg-amber-100 text-amber-700',
  keygarage: 'bg-sky-100 text-sky-700',
  verloren: 'bg-red-100 text-red-700',
  gesperrt: 'bg-red-100 text-red-700',
}

export interface AktiveAusgabe {
  id: string
  ausgabeDatum: string
  pfandBetrag: number
  person?: { id: string; name: string; funktion: string; bereich: string }
}

export interface Exemplar {
  id: string
  typId: string
  nummer: string | null
  status: string
  lagerDetail: string | null
  bemerkung: string | null
  ausgaben: AktiveAusgabe[]
}

export interface Typ {
  id: string
  system: string
  code: string
  bezeichnung: string
  kategorie: string
  sortier: number
  bemerkung: string | null
  exemplare: Exemplar[]
}

export interface PersonAusgabe {
  id: string
  ausgabeDatum: string
  rueckgabeDatum: string | null
  pfandBetrag: number
  pfandZurueck: number
  status: string
  bemerkung: string | null
  exemplar: { id: string; nummer: string | null; typ: { id: string; system: string; code: string; bezeichnung: string } }
}

export interface Person {
  id: string
  name: string
  bereich: string
  funktion: string
  adresse: string
  telefon: string
  email: string
  bemerkung: string | null
  ausgaben: PersonAusgabe[]
}

export interface Beleg {
  id: string
  art: string
  status: string
  hash: string | null
  hashOk?: boolean | null
  signiertAm: string | null
  createdAt: string
  person: { id: string; name: string }
  ausgaben: PersonAusgabe[]
  rueckgaben: PersonAusgabe[]
}

export interface Tuer {
  id: string
  name: string
  nummer: string | null
  sortier: number
}

export function datumKurz(iso: string | null | undefined): string {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function euro(n: number): string {
  return `${n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`
}

// Anzeige-Label eines Typs, z.B. "GHS Generalschlüssel" oder "T-14"
export function typLabel(typ: { code: string; bezeichnung: string }): string {
  return [typ.code, typ.bezeichnung].filter(Boolean).join(' ')
}

// Kurz-Badge eines ausgegebenen Exemplars, z.B. "GHS", "T-14", "Schrank B"
export function exemplarBadge(exemplar: { nummer: string | null }, typ: { system: string; code: string }): string {
  if (typ.system === 'transponder') return `T-${exemplar.nummer ?? '?'}`
  return typ.code
}
