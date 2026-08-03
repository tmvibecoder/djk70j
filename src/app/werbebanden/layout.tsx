import { cookies } from 'next/headers'
import { verifySession, SESSION_COOKIE } from '@/lib/auth'
import { WerbebandenShell } from '@/components/werbebanden/WerbebandenShell'

// Eigenes Layout des Werbebanden-Bereichs. Die globale Sidebar/AppHeader
// blenden sich auf /werbebanden/** selbst aus (siehe Navigation.tsx).
// Der Link „Zur Event-App" erscheint nur, wenn zusätzlich eine App-Session
// vorliegt (Banden-Nutzer sehen ihn nicht).
export default async function WerbebandenLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const appSession = await verifySession(cookies().get(SESSION_COOKIE)?.value)
  return <WerbebandenShell hatAppSession={appSession !== null}>{children}</WerbebandenShell>
}
