// Datei-Ablage für Werbebanden-Uploads (Bandenfotos, Verträge, Kündigungen).
//
// Die Dateien liegen unter uploads/werbebanden/ im Projekt-Root. Der Ordner
// ist gitignored und überlebt dadurch die Deploys (git checkout -f überschreibt
// nur getrackte Dateien — gleiches Prinzip wie prisma/dev.db).
// Ausgeliefert werden die Dateien ausschließlich über die authentifizierte
// Route /api/werbebanden/dateien/[id] — nie direkt aus dem Dateisystem.

import { mkdir, writeFile, unlink, readFile } from 'fs/promises'
import path from 'path'

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'werbebanden')

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB

// Erlaubte Typen je Upload-Art. Vertrag/Kündigung dürfen auch als Foto
// (z.B. Handy-Aufnahme) hochgeladen werden.
const BILD_TYPEN: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}
const PDF_TYPEN: Record<string, string> = {
  'application/pdf': 'pdf',
}

export const UPLOAD_ARTEN = ['foto', 'vertrag', 'kuendigung'] as const
export type UploadArt = (typeof UPLOAD_ARTEN)[number]

export function erlaubteTypen(art: UploadArt): Record<string, string> {
  return art === 'foto' ? BILD_TYPEN : { ...PDF_TYPEN, ...BILD_TYPEN }
}

// Traversal-Schutz: Pfade werden nur aus DB-Werten gebaut, die diese Funktion
// selbst erzeugt hat (partnerId/dateiId sind cuids, ext aus der Whitelist).
function absolutPfad(relativPfad: string): string {
  const abs = path.resolve(UPLOAD_ROOT, relativPfad)
  if (!abs.startsWith(UPLOAD_ROOT + path.sep)) {
    throw new Error('Ungültiger Dateipfad')
  }
  return abs
}

export function relativerPfad(partnerId: string, dateiId: string, ext: string): string {
  return path.join(partnerId, `${dateiId}.${ext}`)
}

export async function speichereUpload(relativPfad: string, daten: Buffer): Promise<void> {
  const abs = absolutPfad(relativPfad)
  await mkdir(path.dirname(abs), { recursive: true })
  await writeFile(abs, daten)
}

export async function leseUpload(relativPfad: string): Promise<Buffer> {
  return readFile(absolutPfad(relativPfad))
}

export async function loescheUpload(relativPfad: string): Promise<void> {
  try {
    await unlink(absolutPfad(relativPfad))
  } catch {
    // Datei fehlt bereits auf der Platte — DB-Eintrag trotzdem löschen lassen
  }
}
