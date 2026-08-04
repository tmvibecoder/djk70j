import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { leseDatei } from '@/lib/schluessel-dateien'

// Streamt die Beleg-PDF über die cuid-ID — bewusst OHNE Dateiendung in der
// URL: der Middleware-Matcher lässt URLs mit Punkt ungeprüft durch
// (siehe CLAUDE.md, gleiche Falle wie bei den Werbebanden-Uploads).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const beleg = await prisma.schluesselBeleg.findUnique({
    where: { id: params.id },
    include: { person: { select: { name: true } } },
  })
  if (!beleg?.pdfPfad) {
    return NextResponse.json({ error: 'Keine PDF vorhanden (Beleg noch nicht signiert?)' }, { status: 404 })
  }
  let pdf: Buffer
  try {
    pdf = await leseDatei(beleg.pdfPfad)
  } catch {
    return NextResponse.json({ error: 'PDF-Datei fehlt auf dem Server' }, { status: 404 })
  }
  const art = beleg.art === 'ausgabe' ? 'Empfangsbestaetigung' : 'Rueckgabebestaetigung'
  const name = beleg.person.name.replace(/[^\wäöüÄÖÜß -]/g, '').replace(/ /g, '-')
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${art}-${name}.pdf"`,
    },
  })
}
