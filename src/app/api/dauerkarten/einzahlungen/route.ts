import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { parseNum, parseStr } from '@/lib/dauerkarten-felder'
import { ladeSaison } from '@/lib/dauerkarten-server'

export const dynamic = 'force-dynamic'

// Bareinzahlungen aufs Vereinskonto (?saison=<id>, sonst aktive Saison)
export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'lesen')
  if (verboten) return verboten

  const saison = await ladeSaison(req)
  if (!saison) return NextResponse.json({ error: 'Keine Saison vorhanden' }, { status: 404 })
  const einzahlungen = await prisma.dkEinzahlung.findMany({
    where: { saisonId: saison.id },
    orderBy: { datum: 'asc' },
  })
  return NextResponse.json(einzahlungen)
}

// Einzahlung buchen — Geldverwaltung ist Kassier-Sache: "verwalten"
export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const saisonId = parseStr(body, 'saisonId')
  const saison = saisonId
    ? await prisma.dkSaison.findUnique({ where: { id: saisonId } })
    : await prisma.dkSaison.findFirst({ where: { aktiv: true } })
  if (!saison) return NextResponse.json({ error: 'Saison nicht gefunden' }, { status: 404 })

  const betrag = parseNum(body, 'betrag')
  if (!betrag || betrag <= 0) {
    return NextResponse.json({ error: 'Betrag muss größer 0 sein' }, { status: 400 })
  }
  const datumWert = parseStr(body, 'datum')
  const datum = datumWert ? new Date(datumWert) : new Date()
  if (Number.isNaN(datum.getTime())) {
    return NextResponse.json({ error: 'Ungültiges Datum' }, { status: 400 })
  }

  const einzahlung = await prisma.dkEinzahlung.create({
    data: { saisonId: saison.id, betrag, datum, notiz: parseStr(body, 'notiz') ?? '' },
  })
  return NextResponse.json(einzahlung, { status: 201 })
}
