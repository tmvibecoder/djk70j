import { redirect } from 'next/navigation'
import { getSessionUserFromCookies, darf } from '@/lib/session'
import { EinstellungenView } from '@/components/dauerkarten/EinstellungenView'

export const metadata = { title: 'Einstellungen — Dauerkarten' }

export default async function DauerkartenEinstellungenPage() {
  const session = await getSessionUserFromCookies()
  if (!darf(session, 'dauerkarten', 'verwalten')) redirect('/dauerkarten')
  return <EinstellungenView />
}
