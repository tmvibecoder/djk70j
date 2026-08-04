import { KundeDetailView } from '@/components/djk-info/KundeDetailView'

export const metadata = { title: 'DJK Info · Kunde' }

export default function InfoKundePage({ params }: { params: { id: string } }) {
  return <KundeDetailView kundeId={params.id} />
}
