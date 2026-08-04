import { Suspense } from 'react'
import { AusgabeFlowView } from '@/components/schluessel/AusgabeFlowView'

export const metadata = { title: 'Ausgabe — Schlüsselverwaltung' }

// Suspense wegen useSearchParams (?person=<id>) in der View
export default function SchluesselAusgabePage() {
  return (
    <Suspense fallback={null}>
      <AusgabeFlowView />
    </Suspense>
  )
}
