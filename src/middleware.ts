import { NextRequest, NextResponse } from 'next/server'
import { verifySession, SESSION_COOKIE } from '@/lib/auth'
import { verifyBandenSession, BANDEN_COOKIE } from '@/lib/banden-auth'

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
]

// Werbebanden-Bereich: eigene Login-Seite + Auth-APIs sind öffentlich
const BANDEN_PUBLIC_PATHS = [
  '/werbebanden/login',
  '/api/werbebanden/auth/login',
  '/api/werbebanden/auth/logout',
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isBandenPublic(pathname: string): boolean {
  return BANDEN_PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isBandenPath(pathname: string): boolean {
  return pathname === '/werbebanden' || pathname.startsWith('/werbebanden/')
    || pathname === '/api/werbebanden' || pathname.startsWith('/api/werbebanden/')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (isBandenPublic(pathname)) return NextResponse.next()

  // Werbebanden-Bereich: NUR das eigene Banden-Cookie öffnet ihn — auch
  // App-Angemeldete müssen das Bereichs-Passwort eingeben (zweite Hürde).
  // Das Banden-Cookie öffnet umgekehrt NIE die restliche App
  // (eigenes Payload-Format, siehe src/lib/banden-auth.ts).
  if (isBandenPath(pathname)) {
    const bandenOk = await verifyBandenSession(req.cookies.get(BANDEN_COOKIE)?.value)
    if (bandenOk) return NextResponse.next()

    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/werbebanden/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isPublic(pathname)) return NextResponse.next()

  const cookie = req.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySession(cookie)
  if (session) return NextResponse.next()

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
