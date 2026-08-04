import { redirect } from 'next/navigation'
import { getSessionUserFromCookies, darf } from '@/lib/session'
import { WerbebandenShell } from '@/components/werbebanden/WerbebandenShell'

// Eigenes Layout des Werbebanden-Bereichs. Die globale Sidebar/AppHeader
// blenden sich auf /werbebanden/** selbst aus (siehe Navigation.tsx). Dieses
// Gate ist nur UX (schnelles Redirect) — der eigentliche Schutz liegt in
// jeder einzelnen Route (erfordereRolle in src/lib/session.ts).
export default async function WerbebandenLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSessionUserFromCookies()
  if (!darf(session, 'werbebanden', 'lesen')) redirect('/')

  const rolle = session!.istAdmin ? 'verwalten' : session!.rollen.werbebanden!
  return <WerbebandenShell rolle={rolle}>{children}</WerbebandenShell>
}
