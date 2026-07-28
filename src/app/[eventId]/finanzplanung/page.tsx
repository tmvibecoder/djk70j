import { notFound } from 'next/navigation'
import { getVeranstaltung } from '@/data/veranstaltungen'
import FinanzplanungView from '@/components/veranstaltungen/FinanzplanungView'

export default function FinanzplanungPage({ params }: { params: { eventId: string } }) {
  const event = getVeranstaltung(params.eventId)
  if (!event || !event.bereiche.includes('finanzplanung')) notFound()
  return <FinanzplanungView event={event} />
}
