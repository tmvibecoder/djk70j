import { cookies } from 'next/headers'
import { verifySession, SESSION_COOKIE } from '@/lib/auth'
import { InfoShell } from '@/components/djk-info/InfoShell'

// Eigenes Layout des DJK-Info-Bereichs. Die globale Sidebar/AppHeader
// blenden sich auf /djk-info/** selbst aus (siehe Navigation.tsx).
// Der Link „Zur Event-App" erscheint nur, wenn zusätzlich eine App-Session
// vorliegt (reine Info-Nutzer sehen ihn nicht).
export default async function InfoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const appSession = await verifySession(cookies().get(SESSION_COOKIE)?.value)
  return <InfoShell hatAppSession={appSession !== null}>{children}</InfoShell>
}
