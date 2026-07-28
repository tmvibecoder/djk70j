import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  BEREICH_ICONS,
  BEREICH_LABELS,
  STATUS_LABELS,
  getVeranstaltung,
  sichtbareBereiche,
} from '@/data/veranstaltungen'

const STATUS_BADGE: Record<string, string> = {
  geplant: 'bg-blue-100 text-blue-800',
  laeuft: 'bg-emerald-100 text-emerald-800',
  abgeschlossen: 'bg-gray-200 text-gray-700',
}

// Startseite einer Veranstaltung: Eckdaten + eine Kachel je sichtbarem Bereich.
export default function EventStartseite({ params }: { params: { eventId: string } }) {
  const event = getVeranstaltung(params.eventId)
  if (!event) notFound()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{event.titel}</h1>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[event.status]}`}
          >
            {STATUS_LABELS[event.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-600">{event.zeitraum}</p>
        {event.standNote && (
          <p className="mt-2 inline-block rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800">
            Stand: {event.standNote}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sichtbareBereiche(event).map((bereich) => (
          <Link
            key={bereich}
            href={`/${event.id}/${bereich}`}
            className="group bg-white rounded-lg shadow-md border border-gray-200 px-6 py-5 hover:border-gray-400 hover:shadow-lg transition-all"
          >
            <div className="text-2xl mb-2">{BEREICH_ICONS[bereich]}</div>
            <div className="font-semibold text-gray-900 group-hover:text-black">
              {BEREICH_LABELS[bereich]}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
