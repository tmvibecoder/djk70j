import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth'

// Die Middleware prüft NUR „eingeloggt ja/nein" (Signatur + Ablauf des
// Session-Cookies, kein DB-Zugriff — Prisma läuft nicht auf der
// Edge-Runtime). Welche Bereiche/Rollen ein Nutzer hat, entscheidet
// ausschließlich die Node-Schicht (src/lib/session.ts, darf()/erfordereRolle)
// in jeder einzelnen Route/jedem Layout — siehe CLAUDE.md „Authentifizierung".
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (isPublic(pathname)) return NextResponse.next()

  const token = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)
  if (token) return NextResponse.next()

  // API-Calls bekommen 401, Browser-Navigation einen Redirect zur Login-Seite
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('next', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  // Alles abdecken außer Next-Internals & statische Files.
  // Achtung: `.*\..*` schließt jede URL mit Punkt aus — Datei-Downloads
  // (z.B. Banden-Uploads) dürfen deshalb NIE eine Dateiendung in der URL
  // tragen, sonst laufen sie an der Auth vorbei (siehe /api/werbebanden/dateien/[id]).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\..*).*)'],
}
