// Manipulationsschutz für Dauerkarten-Empfangsbestätigungen — gleiches
// Verfahren wie SchluesselBeleg (lib/beleg-hash.ts): beim Signieren wird der
// kanonische Inhalt (payloadJson) eingefroren und
//   hash = SHA256( payloadJson + "\n" + SHA256(unterschriftPng) + "\n" + signiertAmIso )
// gebildet. Die PDF ist nur die Darstellung.

import { DK_SPAETER_LABELS, DK_ZAHLART_LABELS, zahlbetrag } from './dauerkarten-felder'
import type { DkSpaeterWeg, DkZahlart } from './dauerkarten-felder'

export { belegHash as quittungHash, sha256Hex } from './beleg-hash'

export interface DkQuittungPayload {
  karteId: string
  saison: string
  lfdNr: number
  kartennummer: string
  inhaberName: string
  kategorie: string // Label ("Normal" | "Ermäßigt")
  preis: number
  abweichung: number
  zahlbetrag: number
  zahlungsText: string // fertige Zahlungszeile — steht wörtlich auf der Quittung und im Hash
  verteiler: string // ausgegeben durch
  erstelltAm: string // ISO
}

function euro(n: number): string {
  return `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

// Zahlungszeile der Quittung. Marcos Anforderung: bei Ausgabe unbezahlter
// Karten muss „Zahlung erfolgt später über …" auf der Quittung stehen.
export function zahlungsText(karte: {
  preis: number
  abweichung: number
  zahlart: string
  bezahlt: boolean
  transaktionsNr: string
  zahlungSpaeterUeber: string
}): string {
  const betrag = euro(zahlbetrag(karte))
  if (karte.zahlart === 'geschenk') {
    return 'Die Dauerkarte wurde als Geschenk ausgegeben (kein Zahlbetrag).'
  }
  if (karte.bezahlt && karte.zahlart) {
    const art = DK_ZAHLART_LABELS[karte.zahlart as DkZahlart] ?? karte.zahlart
    const tx = karte.zahlart === 'pos' && karte.transaktionsNr ? ` (Transaktions-Nr. ${karte.transaktionsNr})` : ''
    return `Der Betrag von ${betrag} wurde bezahlt: ${art}${tx}.`
  }
  if (karte.zahlungSpaeterUeber) {
    const weg = DK_SPAETER_LABELS[karte.zahlungSpaeterUeber as DkSpaeterWeg] ?? karte.zahlungSpaeterUeber
    return `Zahlung erfolgt später über ${weg}. Offener Betrag: ${betrag}.`
  }
  return `Der Betrag von ${betrag} ist noch offen.`
}
