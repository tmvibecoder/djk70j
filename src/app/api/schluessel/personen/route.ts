import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { personDaten } from '@/lib/schluessel-felder'
import { erfordereRolle } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Inhaberliste inkl. aktiver Ausgaben (für Badges + Pfandsummen)
export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'schluessel', 'lesen')
  if (verboten) return verboten

  const personen = await prisma.schluesselPerson.findMany({
    orderBy: { name: 'asc' },
    include: {
      ausgaben: {
        where: { status: 'aktiv' },
        include: { exemplar: { include: { typ: true } } },
        orderBy: { ausgabeDatum: 'asc' },
      },
    },
  })
  return NextResponse.json(personen)
}

export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'schluessel', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = personDaten(body)
  if (!daten.name) {
    return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
  }
  const person = await prisma.schluesselPerson.create({ data: daten })
  return NextResponse.json(person, { status: 201 })
}
