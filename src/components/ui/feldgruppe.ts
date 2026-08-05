// Farbsystem für Feldgruppen in Formularen.
//
// Die Farbe steht für die ART der Angabe, nicht für die Position im Formular —
// eine Anschrift ist überall schiefergrau, Ansprechpartner überall grün, Geld
// überall bernstein. Wer ein Formular kennt, findet sich im nächsten zurecht.
//
// Grau scheidet als Gruppenfarbe aus: das tragen seit dem Umbau die
// Eingabefelder selbst (bg-gray-50 in Input/Select).
//
// Hinweis Schlüsselbereich: dort ist Bernstein die Systemfarbe für ausgewählte
// Schlüssel — 'geld' deshalb in /schluessel nicht verwenden.

export type Feldgruppe =
  | 'stammdaten' // Wer ist es: Firma, Anschrift, Rechnungskopf
  | 'kontakt' // Menschen: Ansprechpartner, Telefon, E-Mail, Empfänger
  | 'geld' // Rechnungskontakt, Versandweg, Beträge, Steuer
  | 'leistung' // die Leistung selbst: Bandenmaße, Anzeigengröße, Abschnitt
  | 'status' // Zustand und Laufzeit: Status, Kündigung, interne Bemerkung

export const gruppenRahmen: Record<Feldgruppe, string> = {
  stammdaten: 'border border-slate-300 bg-slate-100 rounded-lg p-3',
  kontakt: 'border border-emerald-200 bg-emerald-50 rounded-lg p-3',
  geld: 'border border-amber-200 bg-amber-50 rounded-lg p-3',
  leistung: 'border border-sky-200 bg-sky-50 rounded-lg p-3',
  status: 'border border-violet-200 bg-violet-50 rounded-lg p-3',
}

const TITEL_BASIS = 'text-xs font-semibold uppercase tracking-wide mb-2'

export const gruppenTitel: Record<Feldgruppe, string> = {
  stammdaten: `${TITEL_BASIS} text-slate-600`,
  kontakt: `${TITEL_BASIS} text-emerald-700`,
  geld: `${TITEL_BASIS} text-amber-700`,
  leistung: `${TITEL_BASIS} text-sky-700`,
  status: `${TITEL_BASIS} text-violet-700`,
}
