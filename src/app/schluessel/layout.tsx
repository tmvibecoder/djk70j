import { redirect } from 'next/navigation'
import { getSessionUserFromCookies, darf } from '@/lib/session'
import { SchluesselShell } from '@/components/schluessel/SchluesselShell'

// Eigenes Layout des Schlüssel-Bereichs. Die globale Sidebar/AppHeader
// blenden sich auf /schluessel/** selbst aus (siehe Navigation.tsx). Dieses
// Gate ist nur UX (schnelles Redirect) — der eigentliche Schutz liegt in
// jeder einzelnen Route (erfordereRolle in src/lib/session.ts).
export default async function SchluesselLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSessionUserFromCookies()
  if (!darf(session, 'schluessel', 'lesen')) redirect('/')

  const rolle = session!.istAdmin ? 'verwalten' : session!.rollen.schluessel!
  return <SchluesselShell rolle={rolle}>{children}</SchluesselShell>
}
