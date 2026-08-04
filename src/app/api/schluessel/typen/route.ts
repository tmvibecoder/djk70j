import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { typDaten } from '@/lib/schluessel-felder'
import { erfordereRolle } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Alle Typen inkl. Exemplaren und deren aktiver Ausgabe (Person) — die
// Bestands-Ansicht leitet daraus Zähler und Inhaber ab. Datenmenge ist
// vereinsgroß (wenige hundert Exemplare), ein Rundruf genügt.
export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'schluessel', 'lesen')
  if (verboten) return verboten

  const typen = await prisma.schluesselTyp.findMany({
    orderBy: [{ system: 'asc' }, { sortier: 'asc' }, { code: 'asc' }],
    include: {
      exemplare: {
        orderBy: { nummer: 'asc' },
        include: {
          ausgaben: {
            where: { status: 'aktiv' },
            include: { person: { select: { id: true, name: true, funktion: true, bereich: true } } },
          },
        },
      },
    },
  })
  return NextResponse.json(typen)
}

export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'schluessel', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = typDaten(body)
  if (!daten.code) {
    return NextResponse.json({ error: 'Code ist erforderlich' }, { status: 400 })
  }
  const vorhanden = await prisma.schluesselTyp.findUnique({
    where: { system_code: { system: daten.system, code: daten.code } },
  })
  if (vorhanden) {
    return NextResponse.json({ error: 'Diesen Code gibt es in dem System schon' }, { status: 409 })
  }
  const typ = await prisma.schluesselTyp.create({ data: daten })
  return NextResponse.json(typ, { status: 201 })
}
