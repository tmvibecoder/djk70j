import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { typDaten } from '@/lib/schluessel-felder'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}))
  const daten = typDaten(body)
  if (!daten.code) {
    return NextResponse.json({ error: 'Code ist erforderlich' }, { status: 400 })
  }
  const typ = await prisma.schluesselTyp.update({ where: { id: params.id }, data: daten })
  return NextResponse.json(typ)
}

// Löschen nur ohne Exemplare — sonst gingen Ausgabe-Historien mit verloren
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const anzahl = await prisma.schluesselExemplar.count({ where: { typId: params.id } })
  if (anzahl > 0) {
    return NextResponse.json(
      { error: 'Typ hat noch Exemplare — zuerst Exemplare entfernen' },
      { status: 409 },
    )
  }
  await prisma.schluesselTyp.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
