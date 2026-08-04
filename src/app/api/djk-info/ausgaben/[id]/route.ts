import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ausgabeDaten } from '@/lib/info-felder'
import { erfordereRolle, rolleAusRequest } from '@/lib/info-auth'
import { loescheUpload } from '@/lib/uploads'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'schaltungen')
  if (verboten) return verboten
  const rolle = await rolleAusRequest(req)

  const alt = await prisma.infoAusgabe.findUnique({ where: { id: params.id } })
  if (!alt) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const daten = ausgabeDaten(body)
  // Druckkosten darf nur der Kassier ändern
  if (rolle !== 'kassier') daten.druckKosten = alt.druckKosten

  const konflikt = await prisma.infoAusgabe.findUnique({
    where: { jahr_nummer: { jahr: daten.jahr, nummer: daten.nummer } },
  })
  if (konflikt && konflikt.id !== params.id) {
    return NextResponse.json({ error: `Ausgabe ${daten.bezeichnung} existiert bereits` }, { status: 409 })
  }

  const ausgabe = await prisma.infoAusgabe.update({ where: { id: params.id }, data: daten })
  return NextResponse.json(ausgabe)
}

// Löschen ist destruktiv (Schaltungen fallen per Cascade) — nur Kassier
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'verwalten')
  if (verboten) return verboten

  const dateien = await prisma.infoDatei.findMany({ where: { ausgabeId: params.id } })
  await prisma.infoAusgabe.delete({ where: { id: params.id } })
  for (const d of dateien) {
    await loescheUpload(d.pfad, 'djk-info')
  }
  return NextResponse.json({ ok: true })
}
