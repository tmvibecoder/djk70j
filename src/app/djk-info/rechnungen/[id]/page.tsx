import { RechnungEditView } from '@/components/djk-info/RechnungEditView'

export const metadata = { title: 'DJK Info · Rechnung' }

export default function InfoRechnungPage({ params }: { params: { id: string } }) {
  return <RechnungEditView rechnungId={params.id} />
}
