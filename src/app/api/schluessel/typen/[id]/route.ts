import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { typDaten } from '@/lib/schluessel-felder'
import { erfordereRolle } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'schluessel', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = typDaten(body)
  if (!daten.code) {
    return NextResponse.json({ error: 'Code ist erforderlich' }, { status: 400 })
  }
  const typ = await prisma.schluesselTyp.update({ where: { id: params.id }, data: daten })
  return NextResponse.json(typ)
}

// Löschen nur ohne Exemplare — sonst gingen Ausgabe-Historien mit verloren
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'schluessel', 'bearbeiten')
  if (verboten) return verboten

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
