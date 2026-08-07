import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import { einstellungenDaten } from '@/lib/dauerkarten-felder'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'lesen')
  if (verboten) return verboten

  const einstellung = await prisma.dkEinstellung.upsert({
    where: { id: 'dauerkarten' },
    create: { id: 'dauerkarten' },
    update: {},
  })
  return NextResponse.json(einstellung)
}

// ACHTUNG Konvention: der PUT ersetzt ALLE Felder — die View schickt immer
// das komplette Formular (siehe CLAUDE.md „Einstellungs-PUTs").
export async function PUT(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten = einstellungenDaten(body)
  const einstellung = await prisma.dkEinstellung.upsert({
    where: { id: 'dauerkarten' },
    create: { id: 'dauerkarten', ...daten },
    update: daten,
  })
  return NextResponse.json(einstellung)
}
