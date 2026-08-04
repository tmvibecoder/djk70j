import { NextRequest, NextResponse } from 'next/server'
import { verifySession, SESSION_COOKIE } from '@/lib/auth'
import { verifyBandenSession, BANDEN_COOKIE } from '@/lib/banden-auth'
import { verifySchluesselSession, SCHLUESSEL_COOKIE } from '@/lib/schluessel-auth'

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

// Schlüssel-Bereich: eigene Login-Seite + Auth-APIs sind öffentlich
const SCHLUESSEL_PUBLIC_PATHS = [
  '/schluessel/login',
  '/api/schluessel/auth/login',
  '/api/schluessel/auth/logout',
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

function isSchluesselPublic(pathname: string): boolean {
  return SCHLUESSEL_PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isSchluesselPath(pathname: string): boolean {
  return pathname === '/schluessel' || pathname.startsWith('/schluessel/')
    || pathname === '/api/schluessel' || pathname.startsWith('/api/schluessel/')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (isBandenPublic(pathname)) return NextResponse.next()
  if (isSchluesselPublic(pathname)) return NextResponse.next()

  // Schlüssel-Bereich: Schlüssel-Cookie ODER App-Cookie öffnet ihn.
  // Das Schlüssel-Cookie öffnet umgekehrt NIE die restliche App
  // (eigenes Payload-Format, siehe src/lib/schluessel-auth.ts).
  if (isSchluesselPath(pathname)) {
    const schluesselOk = await verifySchluesselSession(req.cookies.get(SCHLUESSEL_COOKIE)?.value)
    const appOk = !schluesselOk && (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) !== null
    if (schluesselOk || appOk) return NextResponse.next()

    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/schluessel/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Werbebanden-Bereich: Banden-Cookie ODER App-Cookie öffnet ihn.
  // Wichtig: Das Banden-Cookie öffnet umgekehrt NIE die restliche App
  // (eigenes Payload-Format, siehe src/lib/banden-auth.ts).
  if (isBandenPath(pathname)) {
    const bandenOk = await verifyBandenSession(req.cookies.get(BANDEN_COOKIE)?.value)
    const appOk = !bandenOk && (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) !== null
    if (bandenOk || appOk) return NextResponse.next()

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
