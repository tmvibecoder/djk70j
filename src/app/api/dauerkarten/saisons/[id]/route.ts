import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { saisonDaten } from '@/lib/dauerkarten-felder'

// Saison bearbeiten (Bezeichnung, Preise, aktiv-Schalter). Beim Aktivieren
// werden alle anderen Saisons inaktiv — es gibt immer genau eine aktive.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = saisonDaten(body)
  if (!daten.bezeichnung) {
    return NextResponse.json({ error: 'Bezeichnung ist erforderlich' }, { status: 400 })
  }
  const aktivSetzen = body.aktiv === true

  const saison = await prisma.$transaction(async tx => {
    if (aktivSetzen) {
      await tx.dkSaison.updateMany({ where: { id: { not: params.id } }, data: { aktiv: false } })
    }
    return tx.dkSaison.update({
      where: { id: params.id },
      data: aktivSetzen ? { ...daten, aktiv: true } : daten,
    })
  }).catch(() => null)

  if (!saison) return NextResponse.json({ error: 'Saison nicht gefunden' }, { status: 404 })
  return NextResponse.json(saison)
}

// Saison löschen — nur solange sie keine Karten hat (Fehlanlage korrigieren)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'verwalten')
  if (verboten) return verboten

  const anzahl = await prisma.dkKarte.count({ where: { saisonId: params.id } })
  if (anzahl > 0) {
    return NextResponse.json(
      { error: `Saison hat ${anzahl} Karten und kann nicht gelöscht werden` },
      { status: 409 },
    )
  }
  await prisma.dkSaison.delete({ where: { id: params.id } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
