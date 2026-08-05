// Gemeinsame Client-Typen des Werbebanden-Bereichs (JSON-Form der API-Antworten)

export interface PartnerDto {
  id: string
  firma: string
  ansprechpartner: string | null
  ansprechpartnerBande: string | null
  ansprechpartnerRechnung: string | null
  strasse: string | null
  plz: string | null
  ort: string | null
  telefon: string | null
  email: string | null
  telefonRechnung: string | null
  emailRechnung: string | null
  ustId: string | null
  istLaenge: number
  berechneteLaenge: number
  preisProMeter: number
  vertragsbeginn: string | null
  bandeErneuert: number | null
  rechnungsversand: string
  abschnitt: number | null
  positionNr: number | null
  kuendigungZum: string | null
  status: string
  bemerkung: string | null
  _count?: { dateien: number; rechnungen: number }
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
  partnerId: string | null
  partner?: { id: string; firma: string; rechnungsversand: string } | null
  saison: string
  jahr: number
  laufnummer: number
  nummer: string
  datum: string
  firma: string
  ansprechpartner: string | null
  strasse: string | null
  plz: string | null
  ort: string | null
  laenge: number
  preisProMeter: number
  netto: number
  mwstSatz: number
  mwst: number
  brutto: number
  zahlungszielTage: number
  status: string
  versendetAm: string | null
  versendetVon: string | null
  bemerkung: string | null
}

export interface PartnerDetailDto extends PartnerDto {
  dateien: DateiDto[]
  rechnungen: RechnungDto[]
}

export interface EinstellungenDto {
  vereinsname: string
  kassierName: string
  absenderzeile: string
  bankName: string
  iban: string
  bic: string
  zahlungszielTage: number
  standardPreisProMeter: number
  mwstSatz: number
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
