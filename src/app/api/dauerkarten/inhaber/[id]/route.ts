import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { inhaberDaten } from '@/lib/dauerkarten-felder'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = inhaberDaten(body)
  if (!daten.vorname || !daten.nachname) {
    return NextResponse.json({ error: 'Vor- und Nachname sind erforderlich' }, { status: 400 })
  }
  const inhaber = await prisma.dkInhaber
    .update({ where: { id: params.id }, data: daten })
    .catch(() => null)
  if (!inhaber) return NextResponse.json({ error: 'Inhaber nicht gefunden' }, { status: 404 })
  return NextResponse.json(inhaber)
}

// Löschen nur ohne Karten (FK Restrict) — sonst deaktiviert man über den
// „keine Karte mehr"-Haken, damit die Historie erhalten bleibt.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'bearbeiten')
  if (verboten) return verboten

  const anzahl = await prisma.dkKarte.count({ where: { inhaberId: params.id } })
  if (anzahl > 0) {
    return NextResponse.json(
      { error: 'Inhaber hat Karten — stattdessen „keine Karte mehr" setzen' },
      { status: 409 },
    )
  }
  await prisma.dkInhaber.delete({ where: { id: params.id } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
