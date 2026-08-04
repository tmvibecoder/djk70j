import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exemplarDaten } from '@/lib/schluessel-felder'
import { erfordereRolle } from '@/lib/session'

// Statuswechsel/Änderung eines Exemplars — landet im Bestands-Journal.
// „ausgegeben" wird nur über den Ausgabe-Flow gesetzt, nicht hier.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'schluessel', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const alt = await prisma.schluesselExemplar.findUnique({
    where: { id: params.id },
    include: { typ: true },
  })
  if (!alt) {
    return NextResponse.json({ error: 'Exemplar nicht gefunden' }, { status: 404 })
  }
  const daten = exemplarDaten(body)
  if (alt.status === 'ausgegeben' || daten.status === 'ausgegeben') {
    if (alt.status !== daten.status) {
      return NextResponse.json(
        { error: 'Ausgegebene Exemplare werden über Ausgabe/Rückgabe verwaltet' },
        { status: 409 },
      )
    }
  }

  const exemplar = await prisma.$transaction(async tx => {
    const neu = await tx.schluesselExemplar.update({ where: { id: params.id }, data: daten })
    if (neu.status !== alt.status) {
      await tx.schluesselBestandsAenderung.create({
        data: {
          typId: alt.typId,
          exemplarId: alt.id,
          art: neu.status === 'verloren' ? 'verlust' : 'statuswechsel',
          notiz: `${alt.typ.code}${alt.nummer ? ` Nr. ${alt.nummer}` : ''}: ${alt.status} → ${neu.status}`,
        },
      })
    }
    return neu
  })
  return NextResponse.json(exemplar)
}

// Löschen nur ohne Ausgabe-Historie (sonst Journal-Korrektur statt Löschung)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'schluessel', 'bearbeiten')
  if (verboten) return verboten

  const anzahl = await prisma.schluesselAusgabe.count({ where: { exemplarId: params.id } })
  if (anzahl > 0) {
    return NextResponse.json(
      { error: 'Exemplar hat Ausgabe-Historie und kann nicht gelöscht werden' },
      { status: 409 },
    )
  }
  const exemplar = await prisma.schluesselExemplar.findUnique({
    where: { id: params.id },
    include: { typ: true },
  })
  if (!exemplar) {
    return NextResponse.json({ error: 'Exemplar nicht gefunden' }, { status: 404 })
  }
  await prisma.$transaction([
    prisma.schluesselExemplar.delete({ where: { id: params.id } }),
    prisma.schluesselBestandsAenderung.create({
      data: {
        typId: exemplar.typId,
        art: 'korrektur',
        notiz: `${exemplar.typ.code}${exemplar.nummer ? ` Nr. ${exemplar.nummer}` : ''} entfernt (war ${exemplar.status})`,
      },
    }),
  ])
  return NextResponse.json({ ok: true })
}
