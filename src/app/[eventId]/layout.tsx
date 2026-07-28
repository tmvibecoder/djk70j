import { notFound } from 'next/navigation'
import { getVeranstaltung } from '@/data/veranstaltungen'

// Gemeinsames Gate für alle Veranstaltungs-Seiten: unbekannte IDs → 404.
export default function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { eventId: string }
}) {
  if (!getVeranstaltung(params.eventId)) notFound()
  return <>{children}</>
}
