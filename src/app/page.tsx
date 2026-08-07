import Link from 'next/link'
import {
  BEREICH_ICONS,
  BEREICH_LABELS,
  STATUS_LABELS,
  VERANSTALTUNGEN_SORTIERT,
  Veranstaltung,
  sichtbareBereiche,
} from '@/data/veranstaltungen'
import { getSessionUserFromCookies, darf } from '@/lib/session'

export const dynamic = 'force-dynamic'

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

const BEREICH_KACHELN = [
  { bereich: 'werbebanden' as const, href: '/werbebanden', icon: '🏟️', titel: 'Werbebanner', text: 'Bandenwerbung: Partner, Rechnungen, Platzübersicht' },
  { bereich: 'schluessel' as const, href: '/schluessel', icon: '🔑', titel: 'Schlüssel', text: 'Bestand, Ausgabe/Rückgabe, Schließplan, Belege' },
  { bereich: 'djk-info' as const, href: '/djk-info', icon: '📰', titel: 'Info-Broschüre', text: 'Anzeigenkunden, Rechnungen, Verteilung' },
  { bereich: 'dauerkarten' as const, href: '/dauerkarten', icon: '🎫', titel: 'Dauerkarten', text: 'Karten ausgeben, Zahlungen, Kartendruck, Abrechnung' },
]

// Übersicht: Kacheln je Veranstaltung + dauerhafte Bereiche, jeweils nur
// sichtbar mit mindestens Lese-Recht (darf(...,'lesen')). Zugriffsschutz
// selbst liegt in den einzelnen Routen/Layouts, hier geht es nur um die
// Sichtbarkeit der Navigation.
export default async function Uebersicht() {
  const session = await getSessionUserFromCookies()

  const darfVeranstaltungen = darf(session, 'veranstaltungen', 'lesen')
  const sichtbareBereichsKacheln = BEREICH_KACHELN.filter(k => darf(session, k.bereich, 'lesen'))

  const aktuelle = VERANSTALTUNGEN_SORTIERT.filter((v) => v.status !== 'abgeschlossen')
  const vergangene = VERANSTALTUNGEN_SORTIERT.filter((v) => v.status === 'abgeschlossen')

  const nichtsSichtbar = !darfVeranstaltungen && sichtbareBereichsKacheln.length === 0

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {nichtsSichtbar && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 px-6 py-8 text-center">
          <p className="text-gray-600">
            Ihrem Konto ist noch kein Bereich zugewiesen. Bitte an einen Systemverwalter wenden.
          </p>
        </div>
      )}

      {darfVeranstaltungen && (
        <div>
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
      )}

      {sichtbareBereichsKacheln.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Weitere Bereiche
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {sichtbareBereichsKacheln.map(k => (
              <Link
                key={k.bereich}
                href={k.href}
                className="bg-white rounded-lg shadow-md border border-gray-200 px-5 py-4 hover:bg-gray-50"
              >
                <div className="text-2xl mb-1">{k.icon}</div>
                <div className="font-bold text-gray-900">{k.titel}</div>
                <div className="text-xs text-gray-500 mt-0.5">{k.text}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {session?.istAdmin && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Verwaltung
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link
              href="/admin/benutzer"
              className="bg-white rounded-lg shadow-md border border-gray-200 px-5 py-4 hover:bg-gray-50"
            >
              <div className="text-2xl mb-1">🛠️</div>
              <div className="font-bold text-gray-900">Adminbereich</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Benutzer anlegen, Passwörter vergeben, Rollen und Zugriffe steuern
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
