import { redirect } from 'next/navigation'
import { getSessionUserFromCookies, darf } from '@/lib/session'
import { DauerkartenShell } from '@/components/dauerkarten/DauerkartenShell'

// Eigenes Layout des Dauerkarten-Bereichs. Die globale Sidebar blendet sich
// auf /dauerkarten/** selbst aus (siehe Navigation.tsx). Dieses Gate ist nur
// UX (schnelles Redirect) — der eigentliche Schutz liegt in jeder einzelnen
// Route (erfordereRolle in src/lib/session.ts).
export default async function DauerkartenLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSessionUserFromCookies()
  if (!darf(session, 'dauerkarten', 'lesen')) redirect('/')

  const rolle = session!.istAdmin ? 'verwalten' : session!.rollen.dauerkarten!
  return <DauerkartenShell rolle={rolle}>{children}</DauerkartenShell>
}
