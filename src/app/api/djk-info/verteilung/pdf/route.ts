import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erzeugeVerteilungsPdf } from '@/lib/verteilung-pdf'

// DIN-A4-Verteilungs-PDFs. URL bewusst OHNE Dateiendung (Middleware-Matcher).
// ?ziel=gesamt | alle | ottenhofen | auslagen | postversand | <gebietId>
export async function GET(req: NextRequest) {
  const ziel = req.nextUrl.searchParams.get('ziel') ?? 'gesamt'

  const [gebiete, verteiler, einstellung] = await Promise.all([
    prisma.infoVerteilgebiet.findMany({
      orderBy: { sortierung: 'asc' },
      include: { strassen: { orderBy: { sortierung: 'asc' } } },
    }),
    prisma.infoVerteiler.findMany({ orderBy: { sortierung: 'asc' } }),
    prisma.infoEinstellung.upsert({ where: { id: 'djk-info' }, create: { id: 'djk-info' }, update: {} }),
  ])

  try {
    const { pdf, dateiname } = await erzeugeVerteilungsPdf(ziel, {
      gebiete,
      verteiler,
      vereinsname: einstellung.vereinsname,
    })
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${dateiname}"`,
        'Cache-Control': 'private, max-age=0',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unbekanntes PDF-Ziel' }, { status: 404 })
  }
}
