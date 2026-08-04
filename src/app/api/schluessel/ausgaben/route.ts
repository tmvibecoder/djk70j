import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseNum } from '@/lib/schluessel-felder'
import { erfordereRolle } from '@/lib/session'

// Schlüssel-Ausgabe: legt in einer Transaktion einen Beleg (offen) plus je
// Position eine Ausgabe an und bucht das Pfand in die Pfandkasse. Die
// fachliche Buchung passiert sofort — die Unterschrift (signieren-Route)
// bestätigt sie nur; ein Beleg kann darum auch später nachsigniert werden.
//
// Positionen: [{ typId, exemplarId? }] — ohne exemplarId wird ein freies
// Exemplar gewählt (ABUS-Kopien sind anonym), Transponder kommen mit
// konkreter exemplarId.
export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'schluessel', 'bearbeiten')
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const personId = typeof body.personId === 'string' ? body.personId : ''
  const positionen: { typId?: string; exemplarId?: string }[] = Array.isArray(body.positionen)
    ? body.positionen
    : []
  const pfandBetrag = parseNum(body, 'pfandBetrag', 0) ?? 0

  if (!personId || positionen.length === 0) {
    return NextResponse.json({ error: 'Person und mindestens ein Schlüssel erforderlich' }, { status: 400 })
  }
  const person = await prisma.schluesselPerson.findUnique({ where: { id: personId } })
  if (!person) {
    return NextResponse.json({ error: 'Person nicht gefunden' }, { status: 404 })
  }

  try {
    const beleg = await prisma.$transaction(async tx => {
      const neu = await tx.schluesselBeleg.create({
        data: { art: 'ausgabe', personId },
      })

      for (const pos of positionen) {
        if (!pos.exemplarId && !pos.typId) {
          throw new Error('Position ohne Typ/Exemplar')
        }
        const exemplar = pos.exemplarId
          ? await tx.schluesselExemplar.findUnique({
              where: { id: pos.exemplarId },
              include: { typ: true },
            })
          : // freies Exemplar: bevorzugt aus dem Archiv, sonst Keygarage
            await tx.schluesselExemplar.findFirst({
              where: { typId: pos.typId, status: { in: ['archiv', 'keygarage'] } },
              orderBy: { status: 'asc' }, // "archiv" < "keygarage"
              include: { typ: true },
            })
        if (!exemplar || exemplar.status === 'ausgegeben') {
          if (pos.exemplarId) {
            throw new Error('Ein gewählter Schlüssel ist nicht mehr verfügbar')
          }
          const typ = await tx.schluesselTyp.findUnique({ where: { id: pos.typId } })
          throw new Error(`Kein freies Exemplar für ${typ?.code ?? 'Typ'} vorhanden`)
        }

        await tx.schluesselExemplar.update({
          where: { id: exemplar.id },
          data: { status: 'ausgegeben' },
        })
        await tx.schluesselAusgabe.create({
          data: {
            exemplarId: exemplar.id,
            personId,
            // Pfand am ersten Posten verbuchen (ein Betrag je Beleg)
            pfandBetrag: 0,
            ausgabeBelegId: neu.id,
          },
        })
      }

      // Pfand einmal je Beleg: am Beleg über die erste Ausgabe abgelegt
      if (pfandBetrag > 0) {
        const erste = await tx.schluesselAusgabe.findFirst({
          where: { ausgabeBelegId: neu.id },
          orderBy: { ausgabeDatum: 'asc' },
        })
        if (erste) {
          await tx.schluesselAusgabe.update({
            where: { id: erste.id },
            data: { pfandBetrag },
          })
        }
        await tx.schluesselPfandBuchung.create({
          data: {
            betrag: pfandBetrag,
            notiz: `Pfand erhalten: ${person.name}`,
            belegId: neu.id,
          },
        })
      }

      return neu
    })
    return NextResponse.json(beleg, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ausgabe fehlgeschlagen'
    return NextResponse.json({ error: msg }, { status: 409 })
  }
}
