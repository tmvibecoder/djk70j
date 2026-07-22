// Umsätze 70-Jahre-Fest — Endstand aus der Kassen-Excel „Umsatz 70JF" (Stand 22.07.2026).
// brutto = Umsatz laut Kassenzählung; ust/netto sind 1:1 aus der Excel übernommen
// (dort bei Zeilen mit Entnahmen teils auf den Umsatz abzüglich Entnahmen gerechnet,
// deshalb ergibt netto + ust nicht überall exakt brutto).

export type UmsatzDayKey = 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface UmsatzEntry {
  standort: string
  ustRate: 7 | 19
  day: UmsatzDayKey
  brutto: number
  ust: number
  netto: number
}

export const UMSATZ_DAYS: { key: UmsatzDayKey; label: string; short: string; icon: string; event: string }[] = [
  { key: 'thursday', label: 'Donnerstag 09.07.', short: 'Do 09.07.', icon: '🃏', event: 'Watt-Turnier' },
  { key: 'friday', label: 'Freitag 10.07.', short: 'Fr 10.07.', icon: '🎶', event: 'Disco-Party' },
  { key: 'saturday', label: 'Samstag 11.07.', short: 'Sa 11.07.', icon: '🎉', event: 'Festprogramm + Festzeltparty' },
  { key: 'sunday', label: 'Sonntag 12.07.', short: 'So 12.07.', icon: '⛪', event: 'Bayrischer Festsonntag' },
]

export const UMSATZ_ENTRIES: UmsatzEntry[] = [
  // Donnerstag 09.07.
  { standort: 'Schankwagen', ustRate: 19, day: 'thursday', brutto: 938.6, ust: 149.8605, netto: 788.7395 },
  { standort: 'Essen', ustRate: 7, day: 'thursday', brutto: 1248.6, ust: 81.6841, netto: 1166.9159 },
  // Freitag 10.07.
  { standort: 'Bar', ustRate: 19, day: 'friday', brutto: 2706.9, ust: 432.1941, netto: 2274.7059 },
  { standort: 'Schankwagen', ustRate: 19, day: 'friday', brutto: 3194.76, ust: 443.8176, netto: 2335.8824 },
  { standort: 'Essen', ustRate: 7, day: 'friday', brutto: 1237.58, ust: 71.5636, netto: 1022.3364 },
  { standort: 'Eintritt', ustRate: 7, day: 'friday', brutto: 679.6, ust: 44.4598, netto: 635.1402 },
  // Samstag 11.07.
  { standort: 'Bar', ustRate: 19, day: 'saturday', brutto: 4780.89, ust: 763.3354, netto: 4017.5546 },
  { standort: 'Schankwagen', ustRate: 19, day: 'saturday', brutto: 5463.54, ust: 471.5832, netto: 2482.0168 },
  { standort: 'Essen', ustRate: 7, day: 'saturday', brutto: 3099.7, ust: 202.7841, netto: 2896.9159 },
  { standort: 'Kaffee u. Kuchen', ustRate: 19, day: 'saturday', brutto: 871.4, ust: 144.7193, netto: 761.6807 },
  { standort: 'Eintritt', ustRate: 7, day: 'saturday', brutto: 1950.6, ust: 127.6093, netto: 1822.9907 },
  // Sonntag 12.07.
  { standort: 'Bar', ustRate: 19, day: 'sunday', brutto: 690.7, ust: 110.2798, netto: 580.4202 },
  { standort: 'Schankwagen', ustRate: 19, day: 'sunday', brutto: 1690.4, ust: 269.8958, netto: 1420.5042 },
  { standort: 'Essen', ustRate: 7, day: 'sunday', brutto: 364.6, ust: 23.8523, netto: 340.7477 },
  { standort: 'Gottesdienst Essen', ustRate: 7, day: 'sunday', brutto: 3300.5, ust: 215.9206, netto: 3084.5794 },
  { standort: 'Gottesdienst Getränke', ustRate: 19, day: 'sunday', brutto: 931.2, ust: 148.679, netto: 782.521 },
  { standort: 'Kaffee u. Kuchen', ustRate: 19, day: 'sunday', brutto: 726.1, ust: 115.9319, netto: 610.1681 },
]
