import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erfordereRolle } from '@/lib/session'
import {
  BILD_TYPEN,
  PDF_TYPEN,
  MAX_UPLOAD_BYTES,
  relativerPfad,
  speichereUpload,
} from '@/lib/uploads'

// Upload-Arten des Info-Bereichs: je Kunde oder je Ausgabe.
// "anzeige" ist bewusst nur als Bild erlaubt (Vorschau im Kundendetail);
// Vertrag/Kündigung/Druckrechnung/Heft auch als PDF.
const KUNDE_ARTEN: Record<string, Record<string, string>> = {
  vertrag: { ...PDF_TYPEN, ...BILD_TYPEN },
  kuendigung: { ...PDF_TYPEN, ...BILD_TYPEN },
  anzeige: BILD_TYPEN,
}
const AUSGABE_ARTEN: Record<string, Record<string, string>> = {
  druckrechnung: { ...PDF_TYPEN, ...BILD_TYPEN },
  heft: PDF_TYPEN,
}

// Multipart-Upload: Felder kundeId ODER ausgabeId, art, file.
// Uploads sind Verwaltungs-Aktionen — mit Ausnahme der Druckrechnung,
// die auch der Redakteur hochladen darf (gehört zur Ausgaben-Pflege).
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })

  const kundeId = String(form.get('kundeId') ?? '')
  const ausgabeId = String(form.get('ausgabeId') ?? '')
  const art = String(form.get('art') ?? '')
  const file = form.get('file')

  const istKundenDatei = kundeId !== ''
  const typen = istKundenDatei ? KUNDE_ARTEN[art] : AUSGABE_ARTEN[art]
  if ((istKundenDatei && ausgabeId) || (!istKundenDatei && !ausgabeId) || !typen) {
    return NextResponse.json({ error: 'Unbekannte Upload-Art' }, { status: 400 })
  }

  const verboten = await erfordereRolle(req, 'djk-info', art === 'druckrechnung' ? 'bearbeiten' : 'verwalten')
  if (verboten) return verboten

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Keine Datei übermittelt' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Die Datei ist leer' }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Die Datei ist zu groß (max. 10 MB)' }, { status: 400 })
  }

  const ext = typen[file.type]
  if (!ext) {
    const hinweis = art === 'anzeige' ? 'Bilddatei (JPG, PNG, WebP, HEIC)' : art === 'heft' ? 'PDF' : 'PDF oder Bilddatei'
    return NextResponse.json({ error: `Dateityp nicht erlaubt — bitte ${hinweis} hochladen` }, { status: 400 })
  }

  if (istKundenDatei) {
    const kunde = await prisma.infoKunde.findUnique({ where: { id: kundeId } })
    if (!kunde) return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
  } else {
    const ausgabe = await prisma.infoAusgabe.findUnique({ where: { id: ausgabeId } })
    if (!ausgabe) return NextResponse.json({ error: 'Ausgabe nicht gefunden' }, { status: 404 })
  }

  const datei = await prisma.infoDatei.create({
    data: {
      kundeId: istKundenDatei ? kundeId : null,
      ausgabeId: istKundenDatei ? null : ausgabeId,
      art,
      dateiname: file.name || `${art}.${ext}`,
      pfad: '', // wird gleich mit der Datei-ID gesetzt
      mimeType: file.type,
      groesse: file.size,
    },
  })
  const pfad = relativerPfad(istKundenDatei ? kundeId : ausgabeId, datei.id, ext)
  await speichereUpload(pfad, Buffer.from(await file.arrayBuffer()), 'djk-info')
  const fertig = await prisma.infoDatei.update({
    where: { id: datei.id },
    data: { pfad },
  })
  return NextResponse.json(fertig, { status: 201 })
}
