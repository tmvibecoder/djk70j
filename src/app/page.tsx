import Link from 'next/link'
import {
  BEREICH_ICONS,
  BEREICH_LABELS,
  STATUS_LABELS,
  VERANSTALTUNGEN_SORTIERT,
  Veranstaltung,
  sichtbareBereiche,
} from '@/data/veranstaltungen'

const STATUS_BADGE: Record<string, string> = {
  geplant: 'bg-blue-100 text-blue-800',
  laeuft: 'bg-emerald-100 text-emerald-800',
  abgeschlossen: 'bg-gray-200 text-gray-700',
}

function VeranstaltungsKachel({ event }: { event: Veranstaltung }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <Link
        href={`/${event.id}`}
        className="block px-6 py-4 border-b border-gray-200 hover:bg-gray-50 rounded-t-lg"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="font-bold text-gray-900">{event.titel}</div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[event.status]}`}
          >
            {STATUS_LABELS[event.status]}
          </span>
        </div>
        <div className="mt-0.5 text-sm text-gray-600">{event.zeitraum}</div>
      </Link>
      <div className="px-6 py-3 flex flex-wrap gap-2">
        {sichtbareBereiche(event).map((bereich) => (
          <Link
            key={bereich}
            href={`/${event.id}/${bereich}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 shadow-sm"
          >
            <span>{BEREICH_ICONS[bereich]}</span>
            {BEREICH_LABELS[bereich]}
          </Link>
        ))}
      </div>
    </div>
  )
}

// Übersicht: eine Kachel je Veranstaltung, abgeschlossene weiter unten.
export default function Uebersicht() {
  const aktuelle = VERANSTALTUNGEN_SORTIERT.filter((v) => v.status !== 'abgeschlossen')
  const vergangene = VERANSTALTUNGEN_SORTIERT.filter((v) => v.status === 'abgeschlossen')

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Veranstaltungen</h1>

      {aktuelle.length > 0 && (
        <div className="grid gap-4 mb-8">
          {aktuelle.map((event) => (
            <VeranstaltungsKachel key={event.id} event={event} />
          ))}
        </div>
      )}

      {vergangene.length > 0 && (
        <>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Vergangene Veranstaltungen
          </h2>
          <div className="grid gap-4">
            {vergangene.map((event) => (
              <VeranstaltungsKachel key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
