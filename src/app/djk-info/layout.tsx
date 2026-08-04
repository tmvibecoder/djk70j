import { redirect } from 'next/navigation'
import { getSessionUserFromCookies, darf } from '@/lib/session'
import { InfoShell } from '@/components/djk-info/InfoShell'

// Eigenes Layout des DJK-Info-Bereichs. Die globale Sidebar/AppHeader
// blenden sich auf /djk-info/** selbst aus (siehe Navigation.tsx). Dieses
// Gate ist nur UX (schnelles Redirect) — der eigentliche Schutz liegt in
// jeder einzelnen Route (erfordereRolle in src/lib/session.ts).
export default async function InfoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSessionUserFromCookies()
  if (!darf(session, 'djk-info', 'lesen')) redirect('/')

  const rolle = session!.istAdmin ? 'verwalten' : session!.rollen['djk-info']!
  return <InfoShell rolle={rolle}>{children}</InfoShell>
}
