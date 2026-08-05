import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle, getSessionUserFromRequest } from '@/lib/session'

// Versand-Stempel der Rechnung setzen/entfernen (Checkbox „Versendet" im Rechnungs-Tab).
// Wer und wann kommt ausschließlich aus der Session — deshalb eine eigene Route und
// nicht die Feld-Whitelist des normalen PUT, die der Browser vollständig befüllt.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'werbebanden', 'bearbeiten')
  if (verboten) return verboten

  const session = await getSessionUserFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const versendet = body.versendet === true

  const vorher = await prisma.werbebandenRechnung.findUnique({ where: { id: params.id } })
  if (!vorher) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const rechnung = await prisma.werbebandenRechnung.update({
    where: { id: params.id },
    data: versendet
      ? { versendetAm: new Date(), versendetVon: session.name, status: 'versendet' }
      : {
          versendetAm: null,
          versendetVon: null,
          // Eine bereits bezahlte Rechnung bleibt bezahlt.
          status: vorher.status === 'versendet' ? 'erstellt' : vorher.status,
        },
    include: { partner: { select: { id: true, firma: true, rechnungsversand: true } } },
  })
  return NextResponse.json(rechnung)
}
