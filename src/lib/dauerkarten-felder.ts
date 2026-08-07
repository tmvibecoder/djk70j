// Konstanten + Feld-Whitelists für den Dauerkarten-Bereich. Reine Werte ohne
// Server-Abhängigkeiten (kein Prisma, kein next/headers) — daher auch aus
// Client-Components importierbar (gleiches Muster wie lib/bereiche.ts).

export const DK_ZAHLARTEN = ['bar', 'pos', 'ueberweisung', 'paypal', 'geschenk'] as const
export type DkZahlart = (typeof DK_ZAHLARTEN)[number]
export const DK_ZAHLART_LABELS: Record<DkZahlart, string> = {
  bar: 'Bar',
  pos: 'POS (Kartenzahlung)',
  ueberweisung: 'Überweisung',
  paypal: 'PayPal',
  geschenk: 'Geschenk',
}

// „Zahlung erfolgt später über …" — steht wörtlich auf der Quittung
export const DK_SPAETER_WEGE = ['bar', 'ueberweisung', 'paypal'] as const
export type DkSpaeterWeg = (typeof DK_SPAETER_WEGE)[number]
export const DK_SPAETER_LABELS: Record<DkSpaeterWeg, string> = {
  bar: 'Bar',
  ueberweisung: 'Überweisung',
  paypal: 'PayPal',
}

// "druck" = Nur-Druck-Rubrik (ab Nr. 200: Kinder, Ehrenvorsitzende,
// Nachbarn, Ehrengäste) — Karte wird gedruckt, aber weder verkauft noch
// quittiert; taucht in der Abrechnung nicht als offen auf.
export const DK_KATEGORIEN = ['normal', 'ermaessigt', 'druck'] as const
export type DkKategorie = (typeof DK_KATEGORIEN)[number]
export const DK_KATEGORIE_LABELS: Record<DkKategorie, string> = {
  normal: 'Normal',
  ermaessigt: 'Ermäßigt',
  druck: 'Nur Druck',
}

export const DK_ANREDEN = ['herr', 'frau'] as const
export const DK_ANREDE_LABELS: Record<string, string> = { herr: 'Herr', frau: 'Frau' }

// Kommagetrennte Einstellung → Liste ("Raacke, Settles, Kugler")
export function verteilerListe(einstellungWert: string): string[] {
  return einstellungWert
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

// Zahlbetrag = Kartenpreis ± Abweichung (Spende/Abzug); Geschenke zählen 0 €
export function zahlbetrag(karte: { preis: number; abweichung: number; zahlart: string }): number {
  if (karte.zahlart === 'geschenk') return 0
  return Math.round((karte.preis + karte.abweichung) * 100) / 100
}

// Aufdruck-Name für den Seriendruck: BEWUSST alles groß (Kartendruck),
// in der App-Ansicht bleiben die Namen normal geschrieben.
export function exportName(vorname: string, nachname: string): { vorname: string; nachname: string } {
  return {
    vorname: vorname.toLocaleUpperCase('de-DE'),
    nachname: nachname.toLocaleUpperCase('de-DE'),
  }
}

// ── Feld-Whitelists (Muster schluessel-felder.ts): erlaubte Felder aus dem
// Request-Body übernehmen und Typen robust wandeln ──

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

function bool(body: Record<string, unknown>, k: string, fallback = false): boolean {
  const v = body[k]
  return typeof v === 'boolean' ? v : fallback
}

export function inhaberDaten(body: Record<string, unknown>) {
  const anrede = str(body, 'anrede') ?? ''
  return {
    vorname: str(body, 'vorname') ?? '',
    nachname: str(body, 'nachname') ?? '',
    anrede: (DK_ANREDEN as readonly string[]).includes(anrede) ? anrede : '',
    rentner: bool(body, 'rentner'),
    behinderung: bool(body, 'behinderung'),
    info: str(body, 'info') ?? '',
    keineKarteMehr: bool(body, 'keineKarteMehr'),
  }
}

// Kartenfelder ohne Zahlung/Ausgabe (die haben eigene Routen)
export function karteDaten(body: Record<string, unknown>) {
  const kategorie = str(body, 'kategorie') ?? 'normal'
  const lfdNr = Math.round(num(body, 'lfdNr', 0) ?? 0)
  return {
    lfdNr,
    kartennummer: str(body, 'kartennummer') ?? String(lfdNr).padStart(4, '0'),
    kategorie: (DK_KATEGORIEN as readonly string[]).includes(kategorie) ? kategorie : 'normal',
    preis: num(body, 'preis', 0) ?? 0,
    abweichung: num(body, 'abweichung', 0) ?? 0,
    verteiler: str(body, 'verteiler') ?? '',
    bemerkung: str(body, 'bemerkung') ?? '',
    gedruckt: bool(body, 'gedruckt'),
  }
}

export function zahlungDaten(body: Record<string, unknown>) {
  const zahlart = str(body, 'zahlart') ?? ''
  const spaeter = str(body, 'zahlungSpaeterUeber') ?? ''
  return {
    zahlart: (DK_ZAHLARTEN as readonly string[]).includes(zahlart) ? zahlart : '',
    transaktionsNr: str(body, 'transaktionsNr') ?? '',
    zahlungSpaeterUeber: (DK_SPAETER_WEGE as readonly string[]).includes(spaeter) ? spaeter : '',
  }
}

export function saisonDaten(body: Record<string, unknown>) {
  return {
    bezeichnung: str(body, 'bezeichnung') ?? '',
    preisNormal: num(body, 'preisNormal', 40) ?? 40,
    preisErmaessigt: num(body, 'preisErmaessigt', 35) ?? 35,
  }
}

export function einstellungenDaten(body: Record<string, unknown>) {
  return {
    verteiler: str(body, 'verteiler') ?? '',
    druckerModell: str(body, 'druckerModell') ?? '',
    druckerArtikel: str(body, 'druckerArtikel') ?? '',
    lieferantKontakt: str(body, 'lieferantKontakt') ?? '',
  }
}

export { num as parseNum, str as parseStr }
