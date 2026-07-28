import { notFound } from 'next/navigation'
import { getVeranstaltung } from '@/data/veranstaltungen'
import FestplanungView from '@/components/veranstaltungen/FestplanungView'

export default function FestplanungPage({ params }: { params: { eventId: string } }) {
  const event = getVeranstaltung(params.eventId)
  if (!event || !event.bereiche.includes('festplanung')) notFound()
  return <FestplanungView event={event} />
}
