import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { belegHash } from '@/lib/beleg-hash'
import { leseDatei } from '@/lib/schluessel-dateien'
import { erfordereRolle } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Beleg-Liste inkl. serverseitiger Hash-Nachprüfung: für jeden signierten
// Beleg wird die Prüfsumme aus den gespeicherten Artefakten (payloadJson +
// Unterschrift-PNG + Zeitstempel) neu berechnet und mit der abgelegten
// verglichen. Vereinsgroße Datenmenge — die Datei-Reads sind unkritisch.
export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'schluessel', 'lesen')
  if (verboten) return verboten

  const belege = await prisma.schluesselBeleg.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      person: { select: { id: true, name: true } },
      ausgaben: { include: { exemplar: { include: { typ: true } } } },
      rueckgaben: { include: { exemplar: { include: { typ: true } } } },
    },
  })

  const mitPruefung = await Promise.all(
    belege.map(async beleg => {
      let hashOk: boolean | null = null
      if (beleg.status === 'signiert' && beleg.hash && beleg.unterschriftPfad && beleg.signiertAm) {
        try {
          const png = await leseDatei(beleg.unterschriftPfad)
          hashOk = belegHash(beleg.payloadJson, png, beleg.signiertAm.toISOString()) === beleg.hash
        } catch {
          hashOk = false
        }
      }
      return { ...beleg, hashOk }
    }),
  )
  return NextResponse.json(mitPruefung)
}
