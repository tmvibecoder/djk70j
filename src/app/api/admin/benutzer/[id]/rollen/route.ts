import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereAdmin, BEREICHE, BEREICHSROLLEN, Bereich, BereichsRolle } from '@/lib/session'

// Ersetzt die komplette Rollen-Zuordnung des Nutzers in einem Rutsch.
// Body: { veranstaltungen: Rolle|null, werbebanden: Rolle|null, schluessel: Rolle|null, "djk-info": Rolle|null }
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereAdmin(req)
  if (verboten) return verboten

  const body: Record<string, unknown> = await req.json().catch(() => ({}))

  const rollen: { bereich: Bereich; rolle: BereichsRolle }[] = []
  for (const bereich of BEREICHE) {
    const wert = body[bereich]
    if (wert === null || wert === undefined) continue
    if (typeof wert !== 'string' || !BEREICHSROLLEN.includes(wert as BereichsRolle)) {
      return NextResponse.json({ error: `Ungültige Rolle für ${bereich}` }, { status: 400 })
    }
    rollen.push({ bereich, rolle: wert as BereichsRolle })
  }

  await prisma.$transaction([
    prisma.userBereichsRolle.deleteMany({ where: { userId: params.id } }),
    prisma.userBereichsRolle.createMany({
      data: rollen.map(r => ({ userId: params.id, bereich: r.bereich, rolle: r.rolle })),
    }),
  ])
  return NextResponse.json({ success: true })
}
