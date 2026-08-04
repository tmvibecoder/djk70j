import { redirect } from 'next/navigation'
import { getSessionUserFromCookies, BEREICH_LABELS, ROLLE_LABELS } from '@/lib/session'
import { PasswortAendernForm } from '@/components/PasswortAendernForm'

export const metadata = { title: 'Mein Konto' }
export const dynamic = 'force-dynamic'

export default async function MeinKontoPage() {
  const session = await getSessionUserFromCookies()
  if (!session) redirect('/login')

  const bereiche = Object.entries(session.rollen) as [keyof typeof BEREICH_LABELS, keyof typeof ROLLE_LABELS][]

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mein Konto</h1>
        <p className="text-sm text-gray-600 mt-1">{session.name} · {session.username}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase mb-3">Meine Bereiche</h2>
        {session.istAdmin ? (
          <p className="text-sm text-gray-600">Systemverwalter — voller Zugriff auf alle Bereiche.</p>
        ) : bereiche.length === 0 ? (
          <p className="text-sm text-gray-500">Noch keinem Bereich zugewiesen.</p>
        ) : (
          <ul className="space-y-1.5">
            {bereiche.map(([bereich, rolle]) => (
              <li key={bereich} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{BEREICH_LABELS[bereich]}</span>
                <span className="text-gray-500">{ROLLE_LABELS[rolle]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase mb-3">Passwort ändern</h2>
        <PasswortAendernForm />
      </div>
    </div>
  )
}
