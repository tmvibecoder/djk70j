import { NextRequest, NextResponse } from 'next/server'
import { verifySession, SESSION_COOKIE } from '@/lib/auth'
import { verifyBandenSession, BANDEN_COOKIE } from '@/lib/banden-auth'
import { verifyInfoSession, INFO_COOKIE } from '@/lib/info-auth'

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

// DJK-Info-Bereich: eigene Login-Seite + Auth-APIs sind öffentlich
const INFO_PUBLIC_PATHS = [
  '/djk-info/login',
  '/api/djk-info/auth/login',
  '/api/djk-info/auth/logout',
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

function isInfoPublic(pathname: string): boolean {
  return INFO_PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isInfoPath(pathname: string): boolean {
  return pathname === '/djk-info' || pathname.startsWith('/djk-info/')
    || pathname === '/api/djk-info' || pathname.startsWith('/api/djk-info/')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (isBandenPublic(pathname) || isInfoPublic(pathname)) return NextResponse.next()

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

  // DJK-Info-Bereich: Info-Cookie ODER App-Cookie öffnet ihn (Banden-Cookie
  // nicht). Die Middleware prüft nur „eingeloggt" — die Rollen-Gates liegen
  // serverseitig in jeder Route (src/lib/info-auth.ts, darf()).
  if (isInfoPath(pathname)) {
    const infoRolle = await verifyInfoSession(req.cookies.get(INFO_COOKIE)?.value)
    const appOk = !infoRolle && (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) !== null
    if (infoRolle || appOk) return NextResponse.next()

    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/djk-info/login'
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
