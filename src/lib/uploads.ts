// Datei-Ablage für Upload-Bereiche (Werbebanden, DJK-Info).
//
// Die Dateien liegen unter uploads/<bereich>/ im Projekt-Root. Der Ordner
// ist gitignored und überlebt dadurch die Deploys (git checkout -f überschreibt
// nur getrackte Dateien — gleiches Prinzip wie prisma/dev.db).
// Ausgeliefert werden die Dateien ausschließlich über die authentifizierten
// Routen /api/<bereich>/dateien/[id] — nie direkt aus dem Dateisystem und
// nie mit Dateiendung in der URL (Middleware-Punkt-Matcher!).
//
// Der Bereichs-Parameter hat den Default 'werbebanden', damit die bestehenden
// Banden-Aufrufer unverändert bleiben; die in der DB gespeicherten Pfade sind
// weiterhin relativ zum jeweiligen Bereichs-Ordner.

import { mkdir, writeFile, unlink, readFile } from 'fs/promises'
import path from 'path'

const UPLOAD_BASIS = path.join(process.cwd(), 'uploads')

export type UploadBereich = 'werbebanden' | 'djk-info'

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB

// Erlaubte Typen je Upload-Art. Vertrag/Kündigung dürfen auch als Foto
// (z.B. Handy-Aufnahme) hochgeladen werden.
export const BILD_TYPEN: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}
export const PDF_TYPEN: Record<string, string> = {
  'application/pdf': 'pdf',
}

export const UPLOAD_ARTEN = ['foto', 'vertrag', 'kuendigung'] as const
export type UploadArt = (typeof UPLOAD_ARTEN)[number]

export function erlaubteTypen(art: UploadArt): Record<string, string> {
  return art === 'foto' ? BILD_TYPEN : { ...PDF_TYPEN, ...BILD_TYPEN }
}

// Traversal-Schutz: Pfade werden nur aus DB-Werten gebaut, die diese Funktion
// selbst erzeugt hat (partnerId/dateiId sind cuids, ext aus der Whitelist).
function absolutPfad(relativPfad: string, bereich: UploadBereich): string {
  const root = path.join(UPLOAD_BASIS, bereich)
  const abs = path.resolve(root, relativPfad)
  if (!abs.startsWith(root + path.sep)) {
    throw new Error('Ungültiger Dateipfad')
  }
  return abs
}

export function relativerPfad(partnerId: string, dateiId: string, ext: string): string {
  return path.join(partnerId, `${dateiId}.${ext}`)
}

export async function speichereUpload(
  relativPfad: string,
  daten: Buffer,
  bereich: UploadBereich = 'werbebanden',
): Promise<void> {
  const abs = absolutPfad(relativPfad, bereich)
  await mkdir(path.dirname(abs), { recursive: true })
  await writeFile(abs, daten)
}

export async function leseUpload(
  relativPfad: string,
  bereich: UploadBereich = 'werbebanden',
): Promise<Buffer> {
  return readFile(absolutPfad(relativPfad, bereich))
}

export async function loescheUpload(
  relativPfad: string,
  bereich: UploadBereich = 'werbebanden',
): Promise<void> {
  try {
    await unlink(absolutPfad(relativPfad, bereich))
  } catch {
    // Datei fehlt bereits auf der Platte — DB-Eintrag trotzdem löschen lassen
  }
}
