// Fortlaufende Rechnungsnummern je Kalenderjahr: "2026/B/0001", "2026/B/0002", …
// Vergabe innerhalb einer Prisma-Transaktion; die Unique-Constraints
// (@@unique([jahr, laufnummer]) und @unique nummer) sichern doppelt ab.

import { Prisma } from '@prisma/client'

export function formatRechnungsnummer(jahr: number, laufnummer: number): string {
  return `${jahr}/B/${String(laufnummer).padStart(4, '0')}`
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
