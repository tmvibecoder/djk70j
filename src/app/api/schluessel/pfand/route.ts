import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseNum, parseStr } from '@/lib/schluessel-felder'
import { erfordereRolle } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Pfandkasse: Bestand = Summe aller Buchungen. Nur über die
// Einstellungen-Seite erreichbar, daher wie diese 'verwalten'-gated.
export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'schluessel', 'verwalten')
  if (verboten) return verboten

  const buchungen = await prisma.schluesselPfandBuchung.findMany({
    orderBy: { createdAt: 'desc' },
  })
  const bestand = buchungen.reduce((s, b) => s + b.betrag, 0)
  return NextResponse.json({ bestand, buchungen })
}

// Manuelle Buchung (Korrektur, Einlage, Entnahme)
export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'schluessel', 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const betrag = parseNum(body, 'betrag', null)
  if (betrag === null || betrag === 0) {
    return NextResponse.json({ error: 'Betrag erforderlich (+ Einzahlung, − Auszahlung)' }, { status: 400 })
  }
  const buchung = await prisma.schluesselPfandBuchung.create({
    data: { betrag, notiz: parseStr(body, 'notiz') ?? 'Manuelle Buchung' },
  })
  return NextResponse.json(buchung, { status: 201 })
}
