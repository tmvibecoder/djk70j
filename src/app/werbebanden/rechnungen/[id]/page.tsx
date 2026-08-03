import { RechnungEditView } from '@/components/werbebanden/RechnungEditView'

export const metadata = { title: 'Werbebanden · Rechnung bearbeiten' }

export default function WerbebandenRechnungEditPage({ params }: { params: { id: string } }) {
  return <RechnungEditView rechnungId={params.id} />
}
