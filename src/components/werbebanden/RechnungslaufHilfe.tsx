'use client'

// Erklärung des Rechnungslaufs: der Kernsatz steht immer im Dialog, die
// vollständige Fallliste blendet sich an seiner Stelle ein (kein zweites
// Fenster — verschachtelte Modals brechen auf dem Handy das Scrollen).
//
// Inhaltlich gilt: übersprungen wird je Saison + Partner (siehe
// api/werbebanden/rechnungen/lauf). Wer den Lauf ändert, muss hier nachziehen.

type Haeufigkeit = 'oft' | 'manchmal' | 'selten' | 'fehler'

interface Fall {
  titel: string
  haeufigkeit: Haeufigkeit
  text: string
  tun?: { label: string; text: string }
}

const HAEUFIGKEIT: Record<Haeufigkeit, { label: string; klasse: string }> = {
  oft: { label: 'sehr häufig', klasse: 'bg-emerald-100 text-emerald-800' },
  manchmal: { label: 'gelegentlich', klasse: 'bg-sky-100 text-sky-800' },
  selten: { label: 'selten', klasse: 'bg-violet-100 text-violet-800' },
  fehler: { label: 'Fehlermeldung', klasse: 'bg-red-100 text-red-800' },
}

const GRUPPEN: { titel: string; faelle: Fall[] }[] = [
  {
    titel: 'Das passiert am häufigsten',
    faelle: [
      {
        titel: 'Der erste Lauf einer neuen Saison',
        haeufigkeit: 'oft',
        text: 'Alle angehakten Partner bekommen je eine Rechnung, fortlaufend nummeriert (2026/B/0001, 0002, …). Vorausgewählt sind alle aktiven Partner mit einem Preis über 0 € und mindestens einem laufenden Meter.',
        tun: { label: 'Danach', text: 'Die Rechnungen stehen in der Liste mit Status „Erstellt". Das PDF öffnest du über den Link in der Zeile.' },
      },
      {
        titel: 'Ein Partner kommt nachträglich dazu',
        haeufigkeit: 'oft',
        text: 'Starte den Lauf einfach noch einmal mit derselben Saison. Alle, die schon eine Rechnung für diese Saison haben, werden übersprungen und dir am Ende namentlich aufgezählt. Nur der neue Partner bekommt eine Rechnung — mit der nächsten freien Nummer.',
        tun: { label: 'Kurz', text: 'Doppelte Rechnungen sind ausgeschlossen, solange die Saison gleich geschrieben ist.' },
      },
      {
        titel: 'Aus Versehen zweimal geklickt',
        haeufigkeit: 'oft',
        text: 'Es passiert nichts. Alle Partner werden übersprungen, die Meldung sagt „0 Rechnungen angelegt" und zählt die übersprungenen Firmen auf.',
      },
    ],
  },
  {
    titel: 'Kommt gelegentlich vor',
    faelle: [
      {
        titel: 'Preis oder Meter stimmten nicht — Rechnung ist schon da',
        haeufigkeit: 'manchmal',
        text: 'Eine fertige Rechnung ist ein Schnappschuss: Sie ändert sich nicht mehr mit, wenn du beim Partner etwas korrigierst.',
        tun: { label: 'Zwei Wege', text: 'Rechnung in der Liste anklicken und die Beträge direkt ändern — oder die Rechnung mit ✕ löschen, den Partner korrigieren und den Lauf wiederholen.' },
      },
      {
        titel: 'Gratisbande soll trotzdem eine Rechnung bekommen',
        haeufigkeit: 'manchmal',
        text: 'Partner mit 0 € pro Meter oder ohne laufende Meter stehen in der Liste, sind aber nicht vorausgewählt. Setz das Häkchen selbst, dann entsteht eine Rechnung über 0,00 €.',
      },
      {
        titel: 'Eine bestimmte Rechnung wiederfinden',
        haeufigkeit: 'manchmal',
        text: 'Über den Saison-Filter links oben, oder indem du auf eine Spaltenüberschrift klickst und nach Firma, Datum oder Betrag sortierst. Der zweite Klick dreht die Reihenfolge um.',
        tun: { label: 'Auch möglich', text: 'Den Partner öffnen — unten in seinem Formular stehen alle seine Rechnungen.' },
      },
    ],
  },
  {
    titel: 'Selten, aber gut zu wissen',
    faelle: [
      {
        titel: 'Versehentlich eine andere Saison eingetippt',
        haeufigkeit: 'selten',
        text: 'Der Schutz vor Doppelrechnungen gilt immer nur innerhalb derselben Saison. Steht dort „2026/2027" statt „2025/2026", gilt jeder Partner als noch nicht abgerechnet und bekommt eine zweite Rechnung.',
        tun: { label: 'Zu erkennen an', text: 'der Saison-Spalte in der Liste. Beheben: die falschen Zeilen mit ✕ löschen und den Lauf mit der richtigen Saison wiederholen.' },
      },
      {
        titel: 'Gekündigter Partner soll noch abgerechnet werden',
        haeufigkeit: 'selten',
        text: 'In der Auswahlliste stehen nur aktive Partner — ein gekündigter taucht dort nicht auf.',
        tun: { label: 'Weg dorthin', text: 'Beim Partner den Status vorübergehend auf „Aktiv" setzen, den Lauf starten und den Status danach wieder auf „Gekündigt" stellen. Die Rechnung bleibt erhalten.' },
      },
      {
        titel: 'Rechnung gelöscht und Lauf wiederholt',
        haeufigkeit: 'selten',
        text: 'Der Partner gilt dann wieder als nicht abgerechnet und bekommt eine neue Rechnung. Die Nummer kann eine andere sein als vorher — Nummern werden nicht zurückgesetzt.',
      },
      {
        titel: 'Wofür ist das Feld „Rechnungsjahr"?',
        haeufigkeit: 'selten',
        text: 'Es steuert nur die Rechnungsnummer: Aus dem Jahr 2026 wird 2026/B/0001. Auf der Rechnung selbst steht die Saison, nicht dieses Jahr. Normalerweise lässt du es so, wie es vorgeschlagen wird.',
      },
    ],
  },
  {
    titel: 'Wenn etwas nicht klappt',
    faelle: [
      {
        titel: '„Saison im Format 2025/2026 erforderlich"',
        haeufigkeit: 'fehler',
        text: 'Die Saison muss aus zwei vierstelligen Jahren mit Schrägstrich bestehen. „2025-2026" oder „2026" werden abgelehnt — es wird dann gar keine Rechnung erzeugt.',
      },
      {
        titel: 'Der grüne Knopf lässt sich nicht drücken',
        haeufigkeit: 'fehler',
        text: 'Dann ist kein einziger Partner angehakt. Setz mindestens ein Häkchen in der Liste.',
      },
    ],
  },
]

// Grüner Kernsatz über dem Formular — beantwortet die häufigste Frage ohne Klick.
export function RechnungslaufKernsatz({ onAlleFaelle }: { onAlleFaelle: () => void }) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-sm text-emerald-900">
      Für jeden <strong className="font-semibold">angehakten Partner</strong> wird eine Rechnung der eingetragenen
      Saison erzeugt. Wer für diese Saison schon eine hat, wird{' '}
      <strong className="font-semibold">übersprungen</strong> — der Lauf lässt sich also gefahrlos wiederholen.
      <button
        type="button"
        onClick={onAlleFaelle}
        className="mt-2 flex items-center gap-1.5 text-emerald-700 font-semibold hover:underline"
      >
        <span className="w-4 h-4 rounded-full border-[1.5px] border-current text-[10px] font-bold flex items-center justify-center">i</span>
        Alle Fälle ansehen
      </button>
    </div>
  )
}

// Vollständige Fallliste, nach Häufigkeit sortiert.
export function RechnungslaufFaelle({ onZurueck }: { onZurueck: () => void }) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onZurueck}
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        ← Zurück zur Auswahl
      </button>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-sm text-emerald-900">
        <strong className="font-semibold">Kurz gesagt:</strong> Für jeden angehakten Partner entsteht eine Rechnung
        der eingetragenen Saison. Wer für diese Saison schon eine Rechnung hat, wird übersprungen. Der Lauf lässt
        sich damit beliebig oft wiederholen, ohne dass jemand doppelt abgerechnet wird.
      </div>

      {GRUPPEN.map(gruppe => (
        <div key={gruppe.titel}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">{gruppe.titel}</p>
          <div className="space-y-2">
            {gruppe.faelle.map(fall => (
              <div key={fall.titel} className="border border-gray-200 rounded-lg px-3 py-2.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{fall.titel}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 whitespace-nowrap ${HAEUFIGKEIT[fall.haeufigkeit].klasse}`}>
                    {HAEUFIGKEIT[fall.haeufigkeit].label}
                  </span>
                </div>
                <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">{fall.text}</p>
                {fall.tun && (
                  <p className="text-[13px] text-gray-900 mt-1 leading-relaxed">
                    <strong className="font-semibold">{fall.tun.label}:</strong> {fall.tun.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
