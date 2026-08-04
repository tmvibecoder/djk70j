import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Schließmatrix: Türen + Einträge (Eintrag = Typ sperrt Tür)
export async function GET() {
  const [tueren, eintraege] = await Promise.all([
    prisma.schluesselTuer.findMany({ orderBy: [{ sortier: 'asc' }, { name: 'asc' }] }),
    prisma.schluesselSchliessplanEintrag.findMany(),
  ])
  return NextResponse.json({ tueren, eintraege })
}

// Zelle togglen: Eintrag anlegen, falls nicht vorhanden — sonst löschen
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const tuerId = typeof body.tuerId === 'string' ? body.tuerId : ''
  const typId = typeof body.typId === 'string' ? body.typId : ''
  if (!tuerId || !typId) {
    return NextResponse.json({ error: 'tuerId und typId erforderlich' }, { status: 400 })
  }
  const vorhanden = await prisma.schluesselSchliessplanEintrag.findUnique({
    where: { tuerId_typId: { tuerId, typId } },
  })
  if (vorhanden) {
    await prisma.schluesselSchliessplanEintrag.delete({ where: { id: vorhanden.id } })
    return NextResponse.json({ aktiv: false })
  }
  await prisma.schluesselSchliessplanEintrag.create({ data: { tuerId, typId } })
  return NextResponse.json({ aktiv: true })
}
