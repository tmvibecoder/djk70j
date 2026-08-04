import { cookies } from 'next/headers'
import { verifySession, SESSION_COOKIE } from '@/lib/auth'
import { SchluesselShell } from '@/components/schluessel/SchluesselShell'

// Eigenes Layout des Schlüssel-Bereichs. Die globale Sidebar/AppHeader
// blenden sich auf /schluessel/** selbst aus (siehe Navigation.tsx).
// Der Link „Zur Event-App" erscheint nur, wenn zusätzlich eine App-Session
// vorliegt (reine Schlüssel-Nutzer sehen ihn nicht).
export default async function SchluesselLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const appSession = await verifySession(cookies().get(SESSION_COOKIE)?.value)
  return <SchluesselShell hatAppSession={appSession !== null}>{children}</SchluesselShell>
}
