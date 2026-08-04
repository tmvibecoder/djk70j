import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erzeugeInfoRechnungPdf } from '@/lib/info-rechnung-pdf'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const rechnung = await prisma.infoRechnung.findUnique({ where: { id: params.id } })
  if (!rechnung) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const einstellung = await prisma.infoEinstellung.upsert({
    where: { id: 'djk-info' },
    create: { id: 'djk-info' },
    update: {},
  })

  const pdf = await erzeugeInfoRechnungPdf(rechnung, einstellung)
  // Dateiname ohne Slash (aus "2026/I/0001" wird "Rechnung-2026-I-0001.pdf")
  const dateiname = `Rechnung-${rechnung.nummer.replace(/\//g, '-')}.pdf`
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${dateiname}"`,
      'Cache-Control': 'private, max-age=0',
    },
  })
}
