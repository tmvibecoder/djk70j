import { notFound, redirect } from 'next/navigation'
import { getVeranstaltung } from '@/data/veranstaltungen'
import { getSessionUserFromCookies, darf } from '@/lib/session'

// Gemeinsames Gate für alle Veranstaltungs-Seiten: unbekannte IDs → 404,
// fehlende Rolle → zurück zur Übersicht. Nur UX (schnelles Redirect) — der
// eigentliche Schutz liegt in jeder einzelnen API-Route (erfordereRolle).
export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { eventId: string }
}) {
  if (!getVeranstaltung(params.eventId)) notFound()

  const session = await getSessionUserFromCookies()
  if (!darf(session, 'veranstaltungen', 'lesen')) redirect('/')

  return <>{children}</>
}
