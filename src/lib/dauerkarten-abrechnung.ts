// Abrechnungs-Logik der Dauerkarten — eine Rechenfunktion für die
// Abrechnungs-Ansicht (JSON-Route) UND die Abrechnungs-PDF, damit beide
// garantiert dieselben Zahlen zeigen.
//
// Bargeldtopf-Logik (Vorgabe des Kassiers): Überweisung und PayPal laufen
// über sein Privatkonto, er hebt das Geld ab und führt es dem Bargeld zu —
// sie zählen deshalb wie Bargeld. Nur POS-Zahlungen gehen direkt aufs
// Vereinskonto. Bareinzahlungen aufs Vereinskonto mindern den Topf.

import { zahlbetrag } from './dauerkarten-felder'

export interface DkKarteFuerAbrechnung {
  kategorie: string
  preis: number
  abweichung: number
  zahlart: string
  bezahlt: boolean
  status: string
}

export interface DkEinzahlungFuerAbrechnung {
  datum: Date | string
  betrag: number
  notiz: string
}

export interface DkAbrechnung {
  saison: string
  preisNormal: number
  preisErmaessigt: number
  anzahlKarten: number // ohne Nur-Druck
  anzahlDruck: number
  verkauft: {
    normal: { anzahl: number; summe: number } // bezahlt, Preis = Normalpreis
    ermaessigt: { anzahl: number; summe: number } // bezahlt, Preis = ermäßigter Preis
    sonderpreis: { anzahl: number; summe: number } // bezahlt, abweichender Preis (Verkauf während der Saison)
    gesamtAnzahl: number
  }
  geschenke: number
  zusatzzahlungen: number // Summe der Abweichungen bezahlter Karten (Spenden/Abzüge)
  gesamtEinnahmen: number
  offen: { anzahl: number; summe: number } // weder bezahlt noch Geschenk
  nichtAusgegeben: number // status "angelegt" (ohne Nur-Druck)
  zahlarten: { bar: number; ueberweisung: number; paypal: number; pos: number; posAnzahl: number }
  bargeldtopf: number // bar + ueberweisung + paypal
  kontoPos: number // POS direkt aufs Vereinskonto
  einzahlungen: { datum: string; betrag: number; notiz: string }[]
  einzahlungenSumme: number
  topfRest: number // bargeldtopf − einzahlungenSumme
}

export function berechneAbrechnung(
  saison: { bezeichnung: string; preisNormal: number; preisErmaessigt: number },
  karten: DkKarteFuerAbrechnung[],
  einzahlungen: DkEinzahlungFuerAbrechnung[],
): DkAbrechnung {
  const relevante = karten.filter(k => k.kategorie !== 'druck')
  const bezahlt = relevante.filter(k => k.bezahlt && k.zahlart !== 'geschenk')
  const geschenke = relevante.filter(k => k.zahlart === 'geschenk')
  const offene = relevante.filter(k => !k.bezahlt && k.zahlart !== 'geschenk')

  const rund = (n: number) => Math.round(n * 100) / 100
  const summe = (liste: DkKarteFuerAbrechnung[], wert: (k: DkKarteFuerAbrechnung) => number) =>
    rund(liste.reduce((s, k) => s + wert(k), 0))

  const normal = bezahlt.filter(k => k.preis === saison.preisNormal)
  const ermaessigt = bezahlt.filter(k => k.preis === saison.preisErmaessigt)
  const sonder = bezahlt.filter(k => k.preis !== saison.preisNormal && k.preis !== saison.preisErmaessigt)

  const zahlartSumme = (art: string) => summe(bezahlt.filter(k => k.zahlart === art), zahlbetrag)
  const zahlarten = {
    bar: zahlartSumme('bar'),
    ueberweisung: zahlartSumme('ueberweisung'),
    paypal: zahlartSumme('paypal'),
    pos: zahlartSumme('pos'),
    posAnzahl: bezahlt.filter(k => k.zahlart === 'pos').length,
  }
  const bargeldtopf = rund(zahlarten.bar + zahlarten.ueberweisung + zahlarten.paypal)
  const einzahlungenSumme = rund(einzahlungen.reduce((s, e) => s + e.betrag, 0))

  return {
    saison: saison.bezeichnung,
    preisNormal: saison.preisNormal,
    preisErmaessigt: saison.preisErmaessigt,
    anzahlKarten: relevante.length,
    anzahlDruck: karten.length - relevante.length,
    verkauft: {
      normal: { anzahl: normal.length, summe: summe(normal, k => k.preis) },
      ermaessigt: { anzahl: ermaessigt.length, summe: summe(ermaessigt, k => k.preis) },
      sonderpreis: { anzahl: sonder.length, summe: summe(sonder, k => k.preis) },
      gesamtAnzahl: bezahlt.length,
    },
    geschenke: geschenke.length,
    zusatzzahlungen: summe(bezahlt, k => k.abweichung),
    gesamtEinnahmen: summe(bezahlt, zahlbetrag),
    offen: { anzahl: offene.length, summe: summe(offene, zahlbetrag) },
    nichtAusgegeben: relevante.filter(k => k.status === 'angelegt').length,
    zahlarten,
    bargeldtopf,
    kontoPos: zahlarten.pos,
    einzahlungen: einzahlungen.map(e => ({
      datum: typeof e.datum === 'string' ? e.datum : e.datum.toISOString(),
      betrag: e.betrag,
      notiz: e.notiz,
    })),
    einzahlungenSumme,
    topfRest: rund(bargeldtopf - einzahlungenSumme),
  }
}
