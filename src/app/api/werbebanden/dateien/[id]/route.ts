import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { leseUpload, loescheUpload } from '@/lib/uploads'
import { erfordereRolle } from '@/lib/session'

// Auslieferung bewusst OHNE Dateiendung in der URL: Der Middleware-Matcher
// schließt Pfade mit Punkt aus (statische Assets) — eine Endung in der URL
// würde die Login-Prüfung umgehen. Die cuid-ID enthält nie einen Punkt,
// dadurch läuft jeder Abruf durch die Middleware. Middleware prüft nur
// „eingeloggt" — die Bereichs-Rolle wird hier explizit geprüft.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'werbebanden', 'lesen')
  if (verboten) return verboten

  const datei = await prisma.werbepartnerDatei.findUnique({ where: { id: params.id } })
  if (!datei || !datei.pfad) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }
  let inhalt: Buffer
  try {
    inhalt = await leseUpload(datei.pfad)
  } catch {
    return NextResponse.json({ error: 'Datei fehlt auf dem Server' }, { status: 404 })
  }
  return new NextResponse(new Uint8Array(inhalt), {
    headers: {
      'Content-Type': datei.mimeType,
      'Content-Disposition': `inline; filename="${datei.dateiname.replace(/[^\w.\-äöüÄÖÜß ]/g, '_')}"`,
      'Cache-Control': 'private, max-age=0',
    },
  })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'werbebanden', 'bearbeiten')
  if (verboten) return verboten

  const datei = await prisma.werbepartnerDatei.findUnique({ where: { id: params.id } })
  if (!datei) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  await prisma.werbepartnerDatei.delete({ where: { id: datei.id } })
  if (datei.pfad) await loescheUpload(datei.pfad)
  return NextResponse.json({ ok: true })
}
