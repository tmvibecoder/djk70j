import { INFO_COOKIE } from '@/lib/info-auth'
import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(INFO_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
