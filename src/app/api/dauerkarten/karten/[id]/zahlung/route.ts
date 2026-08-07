import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { zahlungDaten } from '@/lib/dauerkarten-felder'

// Zahlung erfassen oder zurücksetzen.
// - zahlart gesetzt → Karte gilt als bezahlt (Geschenk ebenso), bezahltAm = jetzt
// - zahlart leer + zahlungSpaeterUeber → offen, Weg steht auf der Quittung
// - alles leer → Zahlung zurückgesetzt (offen)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const karte = await prisma.dkKarte.findUnique({ where: { id: params.id } })
  if (!karte) return NextResponse.json({ error: 'Karte nicht gefunden' }, { status: 404 })
  if (karte.kategorie === 'druck') {
    return NextResponse.json({ error: 'Nur-Druck-Karten haben keine Zahlung' }, { status: 400 })
  }

  const daten = zahlungDaten(body)
  const bezahlt = daten.zahlart !== ''
  const gespeichert = await prisma.dkKarte.update({
    where: { id: karte.id },
    data: {
      ...daten,
      // „Zahlung später" nur solange offen sinnvoll
      zahlungSpaeterUeber: bezahlt ? '' : daten.zahlungSpaeterUeber,
      bezahlt,
      bezahltAm: bezahlt ? (karte.bezahlt ? karte.bezahltAm : new Date()) : null,
    },
    include: { inhaber: true },
  })
  return NextResponse.json(gespeichert)
}
