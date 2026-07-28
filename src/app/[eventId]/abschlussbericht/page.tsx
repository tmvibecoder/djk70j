import { notFound } from 'next/navigation'
import { getVeranstaltung } from '@/data/veranstaltungen'
import AbschlussberichtView from '@/components/veranstaltungen/AbschlussberichtView'

export default function AbschlussberichtPage({ params }: { params: { eventId: string } }) {
  const event = getVeranstaltung(params.eventId)
  if (!event || !event.bereiche.includes('abschlussbericht')) notFound()
  return <AbschlussberichtView eventId={event.id} />
}
