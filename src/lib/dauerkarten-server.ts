// Server-Helfer des Dauerkarten-Bereichs (Prisma — NICHT aus Client-Code
// importieren).

import { NextRequest } from 'next/server'
import { prisma } from './prisma'

// Saison aus ?saison=<id> laden, ohne Parameter die aktive Saison.
export async function ladeSaison(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('saison')
  if (id) return prisma.dkSaison.findUnique({ where: { id } })
  return prisma.dkSaison.findFirst({ where: { aktiv: true }, orderBy: { bezeichnung: 'desc' } })
}
