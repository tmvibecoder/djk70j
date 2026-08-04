import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { personDaten } from '@/lib/schluessel-felder'
import { erfordereRolle } from '@/lib/session'

// Voll-Detail: Stammdaten + gesamte Ausgabe-Historie + Belege
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'schluessel', 'lesen')
  if (verboten) return verboten

  const person = await prisma.schluesselPerson.findUnique({
    where: { id: params.id },
    include: {
      ausgaben: {
        include: { exemplar: { include: { typ: true } } },
        orderBy: { ausgabeDatum: 'desc' },
      },
      belege: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!person) {
    return NextResponse.json({ error: 'Person nicht gefunden' }, { status: 404 })
  }
  return NextResponse.json(person)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'schluessel', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = personDaten(body)
  if (!daten.name) {
    return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
  }
  const person = await prisma.schluesselPerson.update({ where: { id: params.id }, data: daten })
  return NextResponse.json(person)
}

// Löschen nur ohne Ausgabe-Historie
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'schluessel', 'bearbeiten')
  if (verboten) return verboten

  const anzahl = await prisma.schluesselAusgabe.count({ where: { personId: params.id } })
  if (anzahl > 0) {
    return NextResponse.json(
      { error: 'Person hat Schlüssel-Historie und kann nicht gelöscht werden' },
      { status: 409 },
    )
  }
  await prisma.schluesselPerson.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
