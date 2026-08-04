import { InhaberDetailView } from '@/components/schluessel/InhaberDetailView'

export const metadata = { title: 'Inhaber — Schlüsselverwaltung' }

export default function SchluesselInhaberDetailPage({ params }: { params: { id: string } }) {
  return <InhaberDetailView personId={params.id} />
}
