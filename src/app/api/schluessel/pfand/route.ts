import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseNum, parseStr } from '@/lib/schluessel-felder'

export const dynamic = 'force-dynamic'

// Pfandkasse: Bestand = Summe aller Buchungen
export async function GET() {
  const buchungen = await prisma.schluesselPfandBuchung.findMany({
    orderBy: { createdAt: 'desc' },
  })
  const bestand = buchungen.reduce((s, b) => s + b.betrag, 0)
  return NextResponse.json({ bestand, buchungen })
}

// Manuelle Buchung (Korrektur, Einlage, Entnahme)
export async function POST(req: Request) {
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
