import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { einstellungenDaten } from '@/lib/info-felder'
import { erfordereRolle } from '@/lib/info-auth'
import { GROESSEN_REIHENFOLGE } from '@/data/djk-info'
import bcrypt from 'bcryptjs'

// Ohne force-dynamic würde Next die parameterlose GET-Route zur Build-Zeit
// ausführen und die Antwort statisch einfrieren
export const dynamic = 'force-dynamic'

// Die Passwort-Hashes verlassen den Server nie
function ohneHashes<T extends Record<string, unknown>>(e: T): Record<string, unknown> {
  const rest: Record<string, unknown> = { ...e }
  delete rest.passwordHashKassier
  delete rest.passwordHashRedakteur
  delete rest.passwordHashLeser
  return rest
}

export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'verwalten')
  if (verboten) return verboten

  const einstellung = await prisma.infoEinstellung.upsert({
    where: { id: 'djk-info' },
    create: { id: 'djk-info' },
    update: {},
  })
  return NextResponse.json(ohneHashes(einstellung))
}

export async function PUT(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'verwalten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const daten: Record<string, unknown> = einstellungenDaten(body)

  // Neue Rollen-Passwörter (leer = unverändert)
  const passwortFelder: { eingabe: string; feld: string }[] = [
    { eingabe: 'neuesPasswortKassier', feld: 'passwordHashKassier' },
    { eingabe: 'neuesPasswortRedakteur', feld: 'passwordHashRedakteur' },
    { eingabe: 'neuesPasswortLeser', feld: 'passwordHashLeser' },
  ]
  for (const { eingabe, feld } of passwortFelder) {
    const wert = typeof body[eingabe] === 'string' ? (body[eingabe] as string).trim() : ''
    if (!wert) continue
    if (wert.length < 6) {
      return NextResponse.json({ error: 'Passwörter müssen mindestens 6 Zeichen haben' }, { status: 400 })
    }
    daten[feld] = await bcrypt.hash(wert, 10)
  }

  const einstellung = await prisma.infoEinstellung.upsert({
    where: { id: 'djk-info' },
    create: { id: 'djk-info', ...daten },
    update: daten,
  })

  // Preistabelle (Jahrespreise netto je Größe) im selben Speichervorgang
  if (Array.isArray(body.preise)) {
    for (const p of body.preise) {
      if (typeof p?.groesse !== 'string' || !(GROESSEN_REIHENFOLGE as readonly string[]).includes(p.groesse)) continue
      const netto = typeof p.jahresNetto === 'number' ? p.jahresNetto : parseFloat(String(p.jahresNetto ?? '').replace(',', '.'))
      if (!Number.isFinite(netto) || netto < 0) continue
      await prisma.infoPreis.update({
        where: { groesse: p.groesse },
        data: { jahresNetto: Math.round(netto * 100) / 100 },
      })
    }
  }

  return NextResponse.json(ohneHashes(einstellung))
}
