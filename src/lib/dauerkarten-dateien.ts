// Datei-Ablage für den Dauerkarten-Bereich (Unterschrift-PNGs, Quittungs-PDFs,
// Kartenmuster-JPGs). Dateien liegen unter uploads/dauerkarten/ im Projekt-Root
// (gitignored, überlebt Deploys — gleiches Prinzip wie uploads/schluessel/).
// Ausgeliefert wird ausschließlich über authentifizierte API-Routen ohne
// Dateiendung in der URL (Middleware-Matcher-Falle, siehe CLAUDE.md).

import { mkdir, writeFile, readFile, unlink } from 'fs/promises'
import path from 'path'

const ROOT = path.join(process.cwd(), 'uploads', 'dauerkarten')

// Traversal-Schutz: Pfade entstehen nur aus cuid-IDs, die diese Datei
// selbst zu Pfaden zusammensetzt
function absolutPfad(relativPfad: string): string {
  const abs = path.resolve(ROOT, relativPfad)
  if (!abs.startsWith(ROOT + path.sep)) {
    throw new Error('Ungültiger Dateipfad')
  }
  return abs
}

export function unterschriftPfad(karteId: string): string {
  return path.join('quittungen', `${karteId}-unterschrift.png`)
}

export function quittungPdfPfad(karteId: string): string {
  return path.join('quittungen', `${karteId}.pdf`)
}

export function musterPfad(saisonId: string, ext: string): string {
  return path.join('muster', `${saisonId}.${ext}`)
}

export async function speichereDatei(relativPfad: string, daten: Buffer | Uint8Array): Promise<void> {
  const abs = absolutPfad(relativPfad)
  await mkdir(path.dirname(abs), { recursive: true })
  await writeFile(abs, daten)
}

export async function leseDatei(relativPfad: string): Promise<Buffer> {
  return readFile(absolutPfad(relativPfad))
}

export async function loescheDatei(relativPfad: string): Promise<void> {
  try {
    await unlink(absolutPfad(relativPfad))
  } catch {
    // Datei fehlt bereits auf der Platte — DB-Eintrag trotzdem bereinigen
  }
}
