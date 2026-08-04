// Datei-Ablage für den Schlüssel-Bereich (Unterschrift-PNGs + Beleg-PDFs).
//
// Die Dateien liegen unter uploads/schluessel/ im Projekt-Root. Der Ordner
// ist gitignored und überlebt dadurch die Deploys (git checkout -f überschreibt
// nur getrackte Dateien — gleiches Prinzip wie uploads/werbebanden/ und dev.db).
// Ausgeliefert wird ausschließlich über authentifizierte API-Routen ohne
// Dateiendung in der URL (Middleware-Matcher-Falle, siehe CLAUDE.md).

import { mkdir, writeFile, readFile } from 'fs/promises'
import path from 'path'

const ROOT = path.join(process.cwd(), 'uploads', 'schluessel')

// Traversal-Schutz: Pfade entstehen nur aus cuid-IDs, die diese Datei
// selbst zu Pfaden zusammensetzt
function absolutPfad(relativPfad: string): string {
  const abs = path.resolve(ROOT, relativPfad)
  if (!abs.startsWith(ROOT + path.sep)) {
    throw new Error('Ungültiger Dateipfad')
  }
  return abs
}

export function unterschriftPfad(belegId: string): string {
  return path.join('belege', `${belegId}-unterschrift.png`)
}

export function pdfPfad(belegId: string): string {
  return path.join('belege', `${belegId}.pdf`)
}

export async function speichereDatei(relativPfad: string, daten: Buffer | Uint8Array): Promise<void> {
  const abs = absolutPfad(relativPfad)
  await mkdir(path.dirname(abs), { recursive: true })
  await writeFile(abs, daten)
}

export async function leseDatei(relativPfad: string): Promise<Buffer> {
  return readFile(absolutPfad(relativPfad))
}
