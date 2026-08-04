import { prisma } from '@/lib/prisma'
import { LoginForm } from '@/components/LoginForm'

// Nutzerliste kommt bei jedem Aufruf frisch aus der DB (neue Nutzer sollen
// sofort im Dropdown erscheinen).
export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const nutzer = await prisma.user.findMany({
    where: { username: { not: null }, passwordHash: { not: null }, aktiv: true },
    select: { username: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <LoginForm
      nutzer={nutzer.map(u => ({ username: u.username as string, name: u.name }))}
    />
  )
}
