import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'

export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'djk-info', 'lesen')
  if (verboten) return verboten

  const jahrParam = req.nextUrl.searchParams.get('jahr')
  const jahr = jahrParam ? parseInt(jahrParam, 10) : null
  const schaltungen = await prisma.infoSchaltung.findMany({
    where: jahr ? { ausgabe: { jahr } } : undefined,
    include: { ausgabe: { select: { id: true, bezeichnung: true, jahr: true, nummer: true } } },
  })
  return NextResponse.json(schaltungen)
}

// Checkbox der Schaltungs-Matrix: {kundeId, ausgabeId, geschaltet} —
// legt die Schaltung an bzw. entfernt sie. Kassier + Redakteur.
export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'djk-info', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const kundeId: string = body.kundeId ?? ''
  const ausgabeId: string = body.ausgabeId ?? ''
  const geschaltet: boolean = body.geschaltet === true
  if (!kundeId || !ausgabeId) {
    return NextResponse.json({ error: 'kundeId und ausgabeId erforderlich' }, { status: 400 })
  }

  if (geschaltet) {
    const kunde = await prisma.infoKunde.findUnique({ where: { id: kundeId } })
    const ausgabe = await prisma.infoAusgabe.findUnique({ where: { id: ausgabeId } })
    if (!kunde || !ausgabe) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    await prisma.infoSchaltung.upsert({
      where: { kundeId_ausgabeId: { kundeId, ausgabeId } },
      create: { kundeId, ausgabeId },
      update: {},
    })
  } else {
    await prisma.infoSchaltung.deleteMany({ where: { kundeId, ausgabeId } })
  }
  return NextResponse.json({ ok: true })
}
