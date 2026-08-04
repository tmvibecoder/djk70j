import { rolleAusRequest } from '@/lib/info-auth'
import { NextRequest, NextResponse } from 'next/server'

// Liefert die Rolle des eingeloggten Aufrufers — die Client-Views blenden
// damit Bedienelemente aus. Die eigentliche Durchsetzung passiert
// serverseitig in jeder schreibenden Route (darf()-Matrix).
export async function GET(request: NextRequest) {
  const rolle = await rolleAusRequest(request)
  if (!rolle) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ rolle })
}
