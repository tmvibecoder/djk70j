// Feld-Whitelists für die DJK-Info-APIs: erlaubte Felder aus dem Request-Body
// übernehmen (statt Spread, damit z.B. id/createdAt nicht überschrieben werden
// können) und Typen robust wandeln (deutsche Dezimal-Eingaben mit Komma,
// leere Strings → null). Muster wie src/lib/werbebanden-felder.ts.

import { GROESSEN_REIHENFOLGE } from '@/data/djk-info'

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

function ganzzahl(body: Record<string, unknown>, k: string, fallback: number): number {
  return Math.round(num(body, k, fallback) ?? fallback)
}

function datum(body: Record<string, unknown>, k: string): Date | null {
  const v = str(body, k)
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function auswahl(body: Record<string, unknown>, k: string, erlaubt: readonly string[], fallback: string): string {
  const v = str(body, k)
  return v && erlaubt.includes(v) ? v : fallback
}

const VERSANDARTEN = ['post', 'persoenlich', 'email'] as const

export function kundeDaten(body: Record<string, unknown>) {
  return {
    firma: str(body, 'firma') ?? '',
    zusatz: str(body, 'zusatz'),
    strasse: str(body, 'strasse'),
    plz: str(body, 'plz'),
    ort: str(body, 'ort'),
    telefon: str(body, 'telefon'),
    email: str(body, 'email'),
    ansprechpartnerInhaber: str(body, 'ansprechpartnerInhaber'),
    ansprechpartnerRechnung: str(body, 'ansprechpartnerRechnung'),
    rechnungEmail: str(body, 'rechnungEmail'),
    rechnungsversand: auswahl(body, 'rechnungsversand', VERSANDARTEN, 'post'),
    broschuerenversand: auswahl(body, 'broschuerenversand', VERSANDARTEN, 'persoenlich'),
    anzeigenGroesse: auswahl(body, 'anzeigenGroesse', GROESSEN_REIHENFOLGE, '1/2'),
    kuendigungZum: datum(body, 'kuendigungZum'),
    status: str(body, 'status') === 'gekuendigt' ? 'gekuendigt' : 'aktiv',
    bemerkung: str(body, 'bemerkung'),
  }
}

export function ausgabeDaten(body: Record<string, unknown>) {
  const jahr = ganzzahl(body, 'jahr', new Date().getFullYear())
  const nummer = ganzzahl(body, 'nummer', 1)
  return {
    jahr,
    nummer,
    bezeichnung: `${jahr}-${nummer}`,
    erscheinung: datum(body, 'erscheinung'),
    status: auswahl(body, 'status', ['geplant', 'erschienen'], 'geplant'),
    auflage: ganzzahl(body, 'auflage', 896),
    druckKosten: num(body, 'druckKosten'),
  }
}

export function rechnungDaten(body: Record<string, unknown>) {
  return {
    datum: datum(body, 'datum'),
    firma: str(body, 'firma') ?? '',
    zusatz: str(body, 'zusatz'),
    ansprechpartner: str(body, 'ansprechpartner'),
    strasse: str(body, 'strasse'),
    plz: str(body, 'plz'),
    ort: str(body, 'ort'),
    anzeigenGroesse: str(body, 'anzeigenGroesse') ?? '',
    jahresNetto: num(body, 'jahresNetto', 0) ?? 0,
    anzahlAusgaben: ganzzahl(body, 'anzahlAusgaben', 3),
    ausgabenListe: str(body, 'ausgabenListe') ?? '',
    netto: num(body, 'netto', 0) ?? 0,
    mwstSatz: num(body, 'mwstSatz', 19) ?? 19,
    mwst: num(body, 'mwst', 0) ?? 0,
    brutto: num(body, 'brutto', 0) ?? 0,
    zahlungszielTage: ganzzahl(body, 'zahlungszielTage', 14),
    status: auswahl(body, 'status', ['erstellt', 'versendet', 'bezahlt'], 'erstellt'),
    bemerkung: str(body, 'bemerkung'),
  }
}

export function verteilgebietDaten(body: Record<string, unknown>) {
  return {
    name: str(body, 'name') ?? '',
    kategorie: auswahl(body, 'kategorie', ['gebiet', 'ortsteil', 'auslage', 'postversand'], 'gebiet'),
    beschreibung: str(body, 'beschreibung'),
    hefte: ganzzahl(body, 'hefte', 0),
  }
}

export function strasseDaten(body: Record<string, unknown>) {
  return {
    name: str(body, 'name') ?? '',
    hefte: ganzzahl(body, 'hefte', 0),
  }
}

export function verteilerDaten(body: Record<string, unknown>) {
  return {
    person: str(body, 'person') ?? '',
    zustaendigkeit: str(body, 'zustaendigkeit') ?? '',
    stueckzahl: ganzzahl(body, 'stueckzahl', 0),
    verguetung: auswahl(body, 'verguetung', ['kostenlos', 'verguetet'], 'kostenlos'),
    betrag: num(body, 'betrag'),
  }
}

export function einstellungenDaten(body: Record<string, unknown>) {
  return {
    vereinsname: str(body, 'vereinsname') ?? 'DJK SG Ottenhofen e.V.',
    kassierName: str(body, 'kassierName') ?? '',
    absenderzeile: str(body, 'absenderzeile') ?? '',
    bankName: str(body, 'bankName') ?? '',
    iban: str(body, 'iban') ?? '',
    bic: str(body, 'bic') ?? '',
    zahlungszielTage: ganzzahl(body, 'zahlungszielTage', 14),
    mwstSatz: num(body, 'mwstSatz', 19) ?? 19,
    ausgabenProJahr: ganzzahl(body, 'ausgabenProJahr', 3),
    druckereiName: str(body, 'druckereiName') ?? '',
    druckereiAnsprechpartner: str(body, 'druckereiAnsprechpartner') ?? '',
    druckereiTelefon: str(body, 'druckereiTelefon') ?? '',
    druckereiEmail: str(body, 'druckereiEmail') ?? '',
    kopfKontaktblock: str(body, 'kopfKontaktblock') ?? '',
    fusszeileSpalte1: str(body, 'fusszeileSpalte1') ?? '',
    fusszeileSpalte2: str(body, 'fusszeileSpalte2') ?? '',
    fusszeileSpalte3: str(body, 'fusszeileSpalte3') ?? '',
  }
}
