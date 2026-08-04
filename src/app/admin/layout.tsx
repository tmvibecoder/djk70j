import { redirect } from 'next/navigation'
import { getSessionUserFromCookies } from '@/lib/session'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUserFromCookies()
  if (!session?.istAdmin) redirect('/')
  return <>{children}</>
}
