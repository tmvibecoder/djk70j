import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { leseDatei } from '@/lib/dauerkarten-dateien'

// Gespeicherte Quittungs-PDF streamen (URL ohne Dateiendung — Middleware-
// Matcher-Falle, siehe CLAUDE.md)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'lesen')
  if (verboten) return verboten

  const karte = await prisma.dkKarte.findUnique({
    where: { id: params.id },
    include: { inhaber: true },
  })
  if (!karte?.pdfPfad) {
    return NextResponse.json({ error: 'Keine Quittung vorhanden' }, { status: 404 })
  }
  const pdf = await leseDatei(karte.pdfPfad).catch(() => null)
  if (!pdf) return NextResponse.json({ error: 'Datei fehlt auf dem Server' }, { status: 404 })

  const name = `Quittung-Dauerkarte-${karte.kartennummer || karte.lfdNr}-${karte.inhaber.nachname}.pdf`
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${name.replace(/[^\w.\-]/g, '_')}"`,
      'Cache-Control': 'no-store',
    },
  })
}
