// Client-Typen + kleine Helfer des Dauerkarten-Bereichs (Spiegel der
// API-Antworten; Server-Wahrheit liegt in prisma/schema.prisma)

export interface Saison {
  id: string
  bezeichnung: string
  aktiv: boolean
  preisNormal: number
  preisErmaessigt: number
  musterPfad: string | null
  _count?: { karten: number }
}

export interface Inhaber {
  id: string
  vorname: string
  nachname: string
  anrede: string
  rentner: boolean
  behinderung: boolean
  info: string
  keineKarteMehr: boolean
  _count?: { karten: number }
}

export interface Karte {
  id: string
  saisonId: string
  inhaberId: string
  inhaber: Inhaber
  lfdNr: number
  kartennummer: string
  kategorie: string
  preis: number
  abweichung: number
  verteiler: string
  bemerkung: string
  zahlart: string
  bezahlt: boolean
  bezahltAm: string | null
  transaktionsNr: string
  zahlungSpaeterUeber: string
  status: string
  ausgabeDatum: string | null
  ohneSignatur: boolean
  pdfPfad: string | null
  hash: string | null
  signiertAm: string | null
  gedruckt: boolean
}

export interface Einstellung {
  verteiler: string
  druckerModell: string
  druckerArtikel: string
  lieferantKontakt: string
}

export function euro(n: number): string {
  return `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

export function datumKurz(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function inhaberName(i: Pick<Inhaber, 'vorname' | 'nachname'>): string {
  return `${i.vorname} ${i.nachname}`
}

export function kartennummerAnzeige(k: Pick<Karte, 'kartennummer' | 'lfdNr'>): string {
  return k.kartennummer || String(k.lfdNr).padStart(4, '0')
}

// Wunschnummer = Aufdruck weicht von der lfd. Nummer ab
export function istWunschnummer(k: Pick<Karte, 'kartennummer' | 'lfdNr'>): boolean {
  return !!k.kartennummer && k.kartennummer !== String(k.lfdNr).padStart(4, '0')
}

export function zahlbetragKarte(k: Pick<Karte, 'preis' | 'abweichung' | 'zahlart'>): number {
  if (k.zahlart === 'geschenk') return 0
  return Math.round((k.preis + k.abweichung) * 100) / 100
}
