// Fortlaufende Rechnungsnummern je Kalenderjahr und Nummernkreis:
// Werbebanden "2026/B/0001", DJK-Info "2026/I/0001", … — getrennte Kreise.
// Vergabe innerhalb einer Prisma-Transaktion; die Unique-Constraints
// (@@unique([jahr, laufnummer]) und @unique nummer) sichern doppelt ab.

import { Prisma } from '@prisma/client'

export type Rechnungskreis = 'B' | 'I' // B = Bandenwerbung, I = DJK Info

export function formatRechnungsnummer(
  jahr: number,
  laufnummer: number,
  kreis: Rechnungskreis = 'B',
): string {
  return `${jahr}/${kreis}/${String(laufnummer).padStart(4, '0')}`
}

export async function naechsteLaufnummer(
  tx: Prisma.TransactionClient,
  jahr: number,
): Promise<number> {
  const max = await tx.werbebandenRechnung.aggregate({
    where: { jahr },
    _max: { laufnummer: true },
  })
  return (max._max.laufnummer ?? 0) + 1
}

export async function naechsteInfoLaufnummer(
  tx: Prisma.TransactionClient,
  jahr: number,
): Promise<number> {
  const max = await tx.infoRechnung.aggregate({
    where: { jahr },
    _max: { laufnummer: true },
  })
  return (max._max.laufnummer ?? 0) + 1
}
