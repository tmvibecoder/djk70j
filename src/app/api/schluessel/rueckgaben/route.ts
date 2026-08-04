import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseNum } from '@/lib/schluessel-felder'

// Schlüssel-Rückgabe: schließt die gewählten aktiven Ausgaben ab (Exemplar →
// Archiv, Journal-Eintrag), bucht ggf. Pfand aus der Pfandkasse aus und legt
// einen Rückgabe-Beleg (offen) zum Signieren an. ABUS-Kopien sind anonym —
// zurückgebucht wird das konkrete Ausgabe-Exemplar, fachlich also
// „irgendeine" Kopie des Typs.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const personId = typeof body.personId === 'string' ? body.personId : ''
  const ausgabeIds: string[] = Array.isArray(body.ausgabeIds)
    ? body.ausgabeIds.filter((x: unknown) => typeof x === 'string')
    : []
  const pfandZurueck = parseNum(body, 'pfandZurueck', 0) ?? 0

  if (!personId || ausgabeIds.length === 0) {
    return NextResponse.json({ error: 'Person und mindestens eine Rückgabe erforderlich' }, { status: 400 })
  }
  const person = await prisma.schluesselPerson.findUnique({ where: { id: personId } })
  if (!person) {
    return NextResponse.json({ error: 'Person nicht gefunden' }, { status: 404 })
  }

  try {
    const beleg = await prisma.$transaction(async tx => {
      const ausgaben = await tx.schluesselAusgabe.findMany({
        where: { id: { in: ausgabeIds }, personId, status: 'aktiv' },
        include: { exemplar: { include: { typ: true } } },
      })
      if (ausgaben.length !== ausgabeIds.length) {
        throw new Error('Eine gewählte Ausgabe ist nicht (mehr) aktiv')
      }

      const neu = await tx.schluesselBeleg.create({
        data: { art: 'rueckgabe', personId },
      })

      let erste = true
      for (const ausgabe of ausgaben) {
        await tx.schluesselAusgabe.update({
          where: { id: ausgabe.id },
          data: {
            status: 'zurueck',
            rueckgabeDatum: new Date(),
            rueckgabeBelegId: neu.id,
            pfandZurueck: erste ? pfandZurueck : 0,
          },
        })
        erste = false
        await tx.schluesselExemplar.update({
          where: { id: ausgabe.exemplarId },
          data: { status: 'archiv' },
        })
        await tx.schluesselBestandsAenderung.create({
          data: {
            typId: ausgabe.exemplar.typId,
            exemplarId: ausgabe.exemplarId,
            art: 'statuswechsel',
            notiz: `${ausgabe.exemplar.typ.code}${ausgabe.exemplar.nummer ? ` Nr. ${ausgabe.exemplar.nummer}` : ''} zurück von ${person.name}`,
          },
        })
      }

      if (pfandZurueck > 0) {
        await tx.schluesselPfandBuchung.create({
          data: {
            betrag: -pfandZurueck,
            notiz: `Pfand zurückgezahlt: ${person.name}`,
            belegId: neu.id,
          },
        })
      }

      return neu
    })
    return NextResponse.json(beleg, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Rückgabe fehlgeschlagen'
    return NextResponse.json({ error: msg }, { status: 409 })
  }
}
