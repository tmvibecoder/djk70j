import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereAdmin } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereAdmin(req)
  if (verboten) return verboten

  const body = await req.json().catch(() => ({}))
  const data: { name?: string; istAdmin?: boolean; aktiv?: boolean } = {}
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
  if (typeof body.istAdmin === 'boolean') data.istAdmin = body.istAdmin
  if (typeof body.aktiv === 'boolean') {
    data.aktiv = body.aktiv
    if (!body.aktiv) {
      // Deaktivieren loggt den Nutzer auf allen Geräten aus
      await prisma.user.update({ where: { id: params.id }, data: { tokenVersion: { increment: 1 } } })
    }
  }

  const user = await prisma.user.update({ where: { id: params.id }, data })
  return NextResponse.json({ id: user.id })
}
