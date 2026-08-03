import { PartnerDetailView } from '@/components/werbebanden/PartnerDetailView'

export const metadata = { title: 'Werbebanden · Partner' }

// id "neu" = Anlage eines neuen Partners
export default function WerbebandenPartnerDetailPage({ params }: { params: { id: string } }) {
  return <PartnerDetailView partnerId={params.id} />
}
