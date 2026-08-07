import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { inhaberDaten, karteDaten } from '@/lib/dauerkarten-felder'
import { ladeSaison } from '@/lib/dauerkarten-server'

export const dynamic = 'force-dynamic'

// Kartenliste einer Saison (?saison=<id>, sonst aktive Saison), inkl. Inhaber
export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'lesen')
  if (verboten) return verboten

  const saison = await ladeSaison(req)
  if (!saison) return NextResponse.json({ error: 'Keine Saison vorhanden' }, { status: 404 })

  const karten = await prisma.dkKarte.findMany({
    where: { saisonId: saison.id },
    include: { inhaber: true },
    orderBy: { lfdNr: 'asc' },
  })
  return NextResponse.json({ saison, karten })
}

// Karte anlegen: entweder mit bestehendem Inhaber (inhaberId) oder mit neuem
// Inhaber in einem Rutsch (inhaber: {vorname, nachname, …}). Ohne lfdNr wird
// die nächste freie Nummer der Saison vergeben; ohne Preis gilt der
// Saisonpreis der Kategorie (Nur-Druck = 0).
export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const saisonId = typeof body.saisonId === 'string' ? body.saisonId : ''
  const saison = saisonId
    ? await prisma.dkSaison.findUnique({ where: { id: saisonId } })
    : await prisma.dkSaison.findFirst({ where: { aktiv: true } })
  if (!saison) return NextResponse.json({ error: 'Saison nicht gefunden' }, { status: 404 })

  // Inhaber bestimmen oder neu anlegen
  let inhaberId = typeof body.inhaberId === 'string' ? body.inhaberId : ''
  if (!inhaberId && body.inhaber && typeof body.inhaber === 'object') {
    const neu = inhaberDaten(body.inhaber as Record<string, unknown>)
    if (!neu.vorname || !neu.nachname) {
      return NextResponse.json({ error: 'Vor- und Nachname sind erforderlich' }, { status: 400 })
    }
    const angelegt = await prisma.dkInhaber.create({ data: neu })
    inhaberId = angelegt.id
  }
  if (!inhaberId) {
    return NextResponse.json({ error: 'Inhaber fehlt (inhaberId oder inhaber)' }, { status: 400 })
  }

  const daten = karteDaten(body)
  if (daten.lfdNr <= 0) {
    const max = await prisma.dkKarte.aggregate({
      where: { saisonId: saison.id },
      _max: { lfdNr: true },
    })
    daten.lfdNr = (max._max.lfdNr ?? 0) + 1
    daten.kartennummer =
      typeof body.kartennummer === 'string' && body.kartennummer.trim()
        ? body.kartennummer.trim()
        : String(daten.lfdNr).padStart(4, '0')
  }
  if (body.preis === undefined || body.preis === null || body.preis === '') {
    daten.preis =
      daten.kategorie === 'druck' ? 0
      : daten.kategorie === 'ermaessigt' ? saison.preisErmaessigt
      : saison.preisNormal
  }

  const belegt = await prisma.dkKarte.findUnique({
    where: { saisonId_lfdNr: { saisonId: saison.id, lfdNr: daten.lfdNr } },
  })
  if (belegt) {
    return NextResponse.json({ error: `Lfd. Nummer ${daten.lfdNr} ist bereits vergeben` }, { status: 409 })
  }
  const doppelt = await prisma.dkKarte.findUnique({
    where: { saisonId_inhaberId: { saisonId: saison.id, inhaberId } },
  })
  if (doppelt) {
    return NextResponse.json({ error: 'Dieser Inhaber hat in der Saison bereits eine Karte' }, { status: 409 })
  }

  const karte = await prisma.dkKarte.create({
    data: { ...daten, saisonId: saison.id, inhaberId },
    include: { inhaber: true },
  })
  return NextResponse.json(karte, { status: 201 })
}
