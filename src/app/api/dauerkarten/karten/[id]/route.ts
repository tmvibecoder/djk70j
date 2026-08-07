import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { karteDaten } from '@/lib/dauerkarten-felder'
import { loescheDatei } from '@/lib/dauerkarten-dateien'

// Kartenfelder bearbeiten (lfd. Nr, Kartennummer, Kategorie, Preis,
// Abweichung, Verteiler, Bemerkung, Gedruckt-Haken). Zahlung und Ausgabe
// haben eigene Routen. Die View schickt immer das komplette Formular
// (Einstellungs-PUT-Konvention, CLAUDE.md).
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const karte = await prisma.dkKarte.findUnique({ where: { id: params.id } })
  if (!karte) return NextResponse.json({ error: 'Karte nicht gefunden' }, { status: 404 })

  const daten = karteDaten(body)
  if (daten.lfdNr <= 0) {
    return NextResponse.json({ error: 'Lfd. Nummer muss größer 0 sein' }, { status: 400 })
  }
  if (daten.lfdNr !== karte.lfdNr) {
    const belegt = await prisma.dkKarte.findUnique({
      where: { saisonId_lfdNr: { saisonId: karte.saisonId, lfdNr: daten.lfdNr } },
    })
    if (belegt) {
      return NextResponse.json({ error: `Lfd. Nummer ${daten.lfdNr} ist bereits vergeben` }, { status: 409 })
    }
  }

  const gespeichert = await prisma.dkKarte.update({
    where: { id: karte.id },
    data: daten,
    include: { inhaber: true },
  })
  return NextResponse.json(gespeichert)
}

// Karte löschen (Fehlanlage). Signierte Quittungen bleiben als Dateien
// bewusst NICHT erhalten — wer eine quittierte Karte löscht, entscheidet das
// ausdrücklich in der UI (Warnhinweis).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'bearbeiten')
  if (verboten) return verboten

  const karte = await prisma.dkKarte.findUnique({ where: { id: params.id } })
  if (!karte) return NextResponse.json({ error: 'Karte nicht gefunden' }, { status: 404 })

  if (karte.unterschriftPfad) await loescheDatei(karte.unterschriftPfad)
  if (karte.pdfPfad) await loescheDatei(karte.pdfPfad)
  await prisma.dkKarte.delete({ where: { id: karte.id } })
  return NextResponse.json({ ok: true })
}
