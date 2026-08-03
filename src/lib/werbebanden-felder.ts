// Feld-Whitelists für die Werbebanden-APIs: erlaubte Felder aus dem
// Request-Body übernehmen (statt Spread, damit z.B. id/createdAt nicht
// überschrieben werden können) und Typen robust wandeln (deutsche
// Dezimal-Eingaben mit Komma, leere Strings → null).

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

function datum(body: Record<string, unknown>, k: string): Date | null {
  const v = str(body, k)
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export function partnerDaten(body: Record<string, unknown>) {
  const abschnitt = num(body, 'abschnitt')
  const positionNr = num(body, 'positionNr')
  const bandeErneuert = num(body, 'bandeErneuert')
  return {
    firma: str(body, 'firma') ?? '',
    ansprechpartner: str(body, 'ansprechpartner'),
    ansprechpartnerBande: str(body, 'ansprechpartnerBande'),
    ansprechpartnerRechnung: str(body, 'ansprechpartnerRechnung'),
    strasse: str(body, 'strasse'),
    plz: str(body, 'plz'),
    ort: str(body, 'ort'),
    telefon: str(body, 'telefon'),
    email: str(body, 'email'),
    istLaenge: num(body, 'istLaenge', 0) ?? 0,
    berechneteLaenge: num(body, 'berechneteLaenge', 0) ?? 0,
    preisProMeter: num(body, 'preisProMeter', 40) ?? 40,
    vertragsbeginn: datum(body, 'vertragsbeginn'),
    bandeErneuert: bandeErneuert !== null ? Math.round(bandeErneuert) : null,
    rechnungsversand: ['post', 'uebergabe', 'email'].includes(str(body, 'rechnungsversand') ?? '')
      ? (str(body, 'rechnungsversand') as string)
      : 'post',
    abschnitt: abschnitt !== null ? Math.round(abschnitt) : null,
    positionNr: positionNr !== null ? Math.round(positionNr) : null,
    kuendigungZum: datum(body, 'kuendigungZum'),
    status: str(body, 'status') === 'gekuendigt' ? 'gekuendigt' : 'aktiv',
    bemerkung: str(body, 'bemerkung'),
  }
}

export function rechnungDaten(body: Record<string, unknown>) {
  return {
    saison: str(body, 'saison') ?? '',
    datum: datum(body, 'datum'),
    firma: str(body, 'firma') ?? '',
    ansprechpartner: str(body, 'ansprechpartner'),
    strasse: str(body, 'strasse'),
    plz: str(body, 'plz'),
    ort: str(body, 'ort'),
    laenge: num(body, 'laenge', 0) ?? 0,
    preisProMeter: num(body, 'preisProMeter', 0) ?? 0,
    netto: num(body, 'netto', 0) ?? 0,
    mwstSatz: num(body, 'mwstSatz', 19) ?? 19,
    mwst: num(body, 'mwst', 0) ?? 0,
    brutto: num(body, 'brutto', 0) ?? 0,
    zahlungszielTage: Math.round(num(body, 'zahlungszielTage', 14) ?? 14),
    status: ['erstellt', 'versendet', 'bezahlt'].includes(str(body, 'status') ?? '')
      ? (str(body, 'status') as string)
      : 'erstellt',
    bemerkung: str(body, 'bemerkung'),
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
    zahlungszielTage: Math.round(num(body, 'zahlungszielTage', 14) ?? 14),
    standardPreisProMeter: num(body, 'standardPreisProMeter', 40) ?? 40,
    mwstSatz: num(body, 'mwstSatz', 19) ?? 19,
    kopfKontaktblock: str(body, 'kopfKontaktblock') ?? '',
    fusszeileSpalte1: str(body, 'fusszeileSpalte1') ?? '',
    fusszeileSpalte2: str(body, 'fusszeileSpalte2') ?? '',
    fusszeileSpalte3: str(body, 'fusszeileSpalte3') ?? '',
  }
}
