import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erzeugeRechnungPdf } from '@/lib/rechnung-pdf'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const rechnung = await prisma.werbebandenRechnung.findUnique({ where: { id: params.id } })
  if (!rechnung) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const einstellung = await prisma.werbebandenEinstellung.upsert({
    where: { id: 'werbebanden' },
    create: { id: 'werbebanden' },
    update: {},
  })

  const pdf = await erzeugeRechnungPdf(rechnung, einstellung)
  // Dateiname ohne Slash (aus "2026/B/0001" wird "Rechnung-2026-B-0001.pdf")
  const dateiname = `Rechnung-${rechnung.nummer.replace(/\//g, '-')}.pdf`
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${dateiname}"`,
      'Cache-Control': 'private, max-age=0',
    },
  })
}
