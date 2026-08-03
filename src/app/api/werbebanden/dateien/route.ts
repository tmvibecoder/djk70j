import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_ARTEN,
  UploadArt,
  erlaubteTypen,
  relativerPfad,
  speichereUpload,
} from '@/lib/uploads'

// Multipart-Upload: Felder partnerId, art ("foto" | "vertrag" | "kuendigung"), file
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })

  const partnerId = String(form.get('partnerId') ?? '')
  const art = String(form.get('art') ?? '') as UploadArt
  const file = form.get('file')

  if (!UPLOAD_ARTEN.includes(art)) {
    return NextResponse.json({ error: 'Unbekannte Upload-Art' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Keine Datei übermittelt' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Die Datei ist leer' }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Die Datei ist zu groß (max. 10 MB)' }, { status: 400 })
  }

  const typen = erlaubteTypen(art)
  const ext = typen[file.type]
  if (!ext) {
    const hinweis = art === 'foto' ? 'Bilddatei (JPG, PNG, WebP, HEIC)' : 'PDF oder Bilddatei'
    return NextResponse.json({ error: `Dateityp nicht erlaubt — bitte ${hinweis} hochladen` }, { status: 400 })
  }

  const partner = await prisma.werbepartner.findUnique({ where: { id: partnerId } })
  if (!partner) return NextResponse.json({ error: 'Partner nicht gefunden' }, { status: 404 })

  const datei = await prisma.werbepartnerDatei.create({
    data: {
      partnerId,
      art,
      dateiname: file.name || `${art}.${ext}`,
      pfad: '', // wird gleich mit der Datei-ID gesetzt
      mimeType: file.type,
      groesse: file.size,
    },
  })
  const pfad = relativerPfad(partnerId, datei.id, ext)
  await speichereUpload(pfad, Buffer.from(await file.arrayBuffer()))
  const fertig = await prisma.werbepartnerDatei.update({
    where: { id: datei.id },
    data: { pfad },
  })
  return NextResponse.json(fertig, { status: 201 })
}
