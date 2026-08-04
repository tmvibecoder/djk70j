// Gemeinsame Client-Typen des DJK-Info-Bereichs (JSON-Form der API-Antworten)

export interface KundeDto {
  id: string
  firma: string
  zusatz: string | null
  strasse: string | null
  plz: string | null
  ort: string | null
  telefon: string | null
  email: string | null
  ansprechpartnerInhaber: string | null
  ansprechpartnerRechnung: string | null
  rechnungEmail: string | null
  rechnungsversand: string
  broschuerenversand: string
  anzeigenGroesse: string
  kuendigungZum: string | null
  status: string
  bemerkung: string | null
  _count?: { dateien: number; rechnungen: number; schaltungen: number }
}

export interface DateiDto {
  id: string
  art: string
  dateiname: string
  mimeType: string
  groesse: number
  createdAt: string
}

export interface RechnungDto {
  id: string
  kundeId: string | null
  kunde?: { id: string; firma: string } | null
  leistungsjahr: number
  jahr: number
  laufnummer: number
  nummer: string
  datum: string
  firma: string
  zusatz: string | null
  ansprechpartner: string | null
  strasse: string | null
  plz: string | null
  ort: string | null
  anzeigenGroesse: string
  jahresNetto: number
  anzahlAusgaben: number
  ausgabenListe: string
  netto: number
  mwstSatz: number
  mwst: number
  brutto: number
  zahlungszielTage: number
  status: string
  bemerkung: string | null
}

export interface SchaltungDto {
  id: string
  kundeId: string
  ausgabeId: string
  groesse: string | null
  ausgabe?: { id: string; bezeichnung: string; jahr: number; nummer: number }
}

export interface AusgabeDto {
  id: string
  jahr: number
  nummer: number
  bezeichnung: string
  erscheinung: string | null
  status: string
  auflage: number
  druckKosten: number | null
  _count?: { schaltungen: number; dateien: number }
  dateien?: DateiDto[]
}

export interface KundeDetailDto extends KundeDto {
  dateien: DateiDto[]
  rechnungen: RechnungDto[]
  schaltungen: SchaltungDto[]
}

export interface PreisDto {
  id: string
  groesse: string
  bezeichnung: string
  jahresNetto: number
  sortierung: number
}

export interface StrasseDto {
  id: string
  gebietId: string
  name: string
  hefte: number
  sortierung: number
}

export interface VerteilgebietDto {
  id: string
  name: string
  kategorie: string
  beschreibung: string | null
  hefte: number
  sortierung: number
  strassen: StrasseDto[]
}

export interface VerteilerDto {
  id: string
  person: string
  zustaendigkeit: string
  stueckzahl: number
  verguetung: string
  betrag: number | null
  sortierung: number
}

export interface EinstellungenDto {
  vereinsname: string
  kassierName: string
  absenderzeile: string
  bankName: string
  iban: string
  bic: string
  zahlungszielTage: number
  mwstSatz: number
  ausgabenProJahr: number
  druckereiName: string
  druckereiAnsprechpartner: string
  druckereiTelefon: string
  druckereiEmail: string
  kopfKontaktblock: string
  fusszeileSpalte1: string
  fusszeileSpalte2: string
  fusszeileSpalte3: string
}

// "2026-07-01T00:00:00.000Z" → "2026-07-01" (für <input type="date">)
export function alsDatumsfeld(iso: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}

export function formatDatum(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
