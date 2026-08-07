import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const verboten = await erfordereRolle(req, 'dauerkarten', 'verwalten')
  if (verboten) return verboten

  await prisma.dkEinzahlung.delete({ where: { id: params.id } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
