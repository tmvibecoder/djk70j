import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exemplarDaten, parseNum } from '@/lib/schluessel-felder'
import { erfordereRolle } from '@/lib/session'

// Exemplare anlegen: entweder `anzahl` gleiche (ABUS-Kopien sind anonym)
// oder mit `nummer` ein einzelnes (Transponder). Jede Anlage landet im
// Bestands-Journal.
export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'schluessel', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const typId = typeof body.typId === 'string' ? body.typId : ''
  if (!typId) {
    return NextResponse.json({ error: 'typId ist erforderlich' }, { status: 400 })
  }
  const typ = await prisma.schluesselTyp.findUnique({ where: { id: typId } })
  if (!typ) {
    return NextResponse.json({ error: 'Typ nicht gefunden' }, { status: 404 })
  }

  const daten = exemplarDaten(body)
  const anzahl = Math.min(Math.max(Math.round(parseNum(body, 'anzahl', 1) ?? 1), 1), 100)

  const exemplare = await prisma.$transaction(async tx => {
    const angelegt: Awaited<ReturnType<typeof tx.schluesselExemplar.create>>[] = []
    for (let i = 0; i < anzahl; i++) {
      angelegt.push(await tx.schluesselExemplar.create({ data: { ...daten, typId } }))
    }
    await tx.schluesselBestandsAenderung.create({
      data: {
        typId,
        art: 'nachlieferung',
        notiz: `${anzahl}× ${typ.code} angelegt (Status ${daten.status})${daten.nummer ? `, Nr. ${daten.nummer}` : ''}`,
      },
    })
    return angelegt
  })
  return NextResponse.json(exemplare, { status: 201 })
}
