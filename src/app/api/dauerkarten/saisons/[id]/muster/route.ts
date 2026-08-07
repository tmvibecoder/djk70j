import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { leseDatei, loescheDatei, musterPfad, speichereDatei } from '@/lib/dauerkarten-dateien'

// Kartenmuster (JPG/PNG) der Saison — Upload/Anzeige/Löschen.
// Auslieferung ohne Dateiendung in der URL (Middleware-Matcher, CLAUDE.md).

const BILD_TYPEN: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const MAX_BYTES = 10 * 1024 * 1024

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'lesen')
  if (verboten) return verboten

  const saison = await prisma.dkSaison.findUnique({ where: { id: params.id } })
  if (!saison?.musterPfad) {
    return NextResponse.json({ error: 'Kein Kartenmuster hinterlegt' }, { status: 404 })
  }
  const daten = await leseDatei(saison.musterPfad).catch(() => null)
  if (!daten) return NextResponse.json({ error: 'Datei fehlt auf dem Server' }, { status: 404 })

  const ext = saison.musterPfad.split('.').pop() ?? 'jpg'
  const mime = Object.entries(BILD_TYPEN).find(([, e]) => e === ext)?.[0] ?? 'image/jpeg'
  return new NextResponse(new Uint8Array(daten), {
    headers: { 'Content-Type': mime, 'Cache-Control': 'no-store' },
  })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'verwalten')
  if (verboten) return verboten

  const saison = await prisma.dkSaison.findUnique({ where: { id: params.id } })
  if (!saison) return NextResponse.json({ error: 'Saison nicht gefunden' }, { status: 404 })

  const form = await req.formData().catch(() => null)
  const datei = form?.get('datei')
  if (!(datei instanceof File)) {
    return NextResponse.json({ error: 'Datei fehlt (Feld "datei")' }, { status: 400 })
  }
  const ext = BILD_TYPEN[datei.type]
  if (!ext) return NextResponse.json({ error: 'Nur JPG, PNG oder WebP erlaubt' }, { status: 400 })
  if (datei.size > MAX_BYTES) return NextResponse.json({ error: 'Datei größer als 10 MB' }, { status: 400 })

  // Altes Muster (ggf. andere Endung) entfernen, dann speichern
  if (saison.musterPfad) await loescheDatei(saison.musterPfad)
  const pfad = musterPfad(saison.id, ext)
  await speichereDatei(pfad, Buffer.from(await datei.arrayBuffer()))
  const gespeichert = await prisma.dkSaison.update({
    where: { id: saison.id },
    data: { musterPfad: pfad },
  })
  return NextResponse.json({ id: gespeichert.id, musterPfad: gespeichert.musterPfad })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'verwalten')
  if (verboten) return verboten

  const saison = await prisma.dkSaison.findUnique({ where: { id: params.id } })
  if (!saison) return NextResponse.json({ error: 'Saison nicht gefunden' }, { status: 404 })
  if (saison.musterPfad) await loescheDatei(saison.musterPfad)
  await prisma.dkSaison.update({ where: { id: saison.id }, data: { musterPfad: null } })
  return NextResponse.json({ ok: true })
}
