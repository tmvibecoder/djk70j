import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_EVENT_ID } from '@/data/veranstaltungen'
import { erfordereRolle } from '@/lib/session'

export async function GET(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'veranstaltungen', 'lesen')
  if (verboten) return verboten

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event') ?? DEFAULT_EVENT_ID
  const anmerkungen = await prisma.berichtAnmerkung.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(anmerkungen)
}

export async function POST(req: NextRequest) {
  const verboten = await erfordereRolle(req, 'veranstaltungen', 'lesen')
  if (verboten) return verboten

  const body = await req.json()
  const name = (body.name ?? '').trim()
  const top = (body.top ?? '').trim()
  const text = (body.text ?? '').trim()
  if (!name || !top || !text) {
    return NextResponse.json({ error: 'name, top und text sind erforderlich' }, { status: 400 })
  }
  const anmerkung = await prisma.berichtAnmerkung.create({
    data: {
      eventId: body.eventId ?? DEFAULT_EVENT_ID,
      name,
      top,
      unterpunkt: body.unterpunkt?.trim() || null,
      text,
    },
  })
  return NextResponse.json(anmerkung, { status: 201 })
}
