// Manipulationsschutz für Empfangs-/Rückgabebestätigungen.
//
// Beim Signieren wird der kanonische Beleg-Inhalt (payloadJson) als exakter
// String gespeichert und darüber eine Prüfsumme gebildet:
//   hash = SHA256( payloadJson + "\n" + SHA256(unterschriftPngBytes) + "\n" + signiertAmIso )
// Gehasht werden Inhalt + Unterschrift, nicht die PDF-Datei — die PDF ist
// nur die Darstellung und kann jederzeit aus den Artefakten nachgeprüft
// werden (Beleg-Liste rechnet den Hash serverseitig nach).

import { createHash } from 'crypto'

export interface BelegPayload {
  belegId: string
  art: string // "ausgabe" | "rueckgabe"
  person: { name: string; bereich: string; funktion: string }
  positionen: { schluessel: string; nummer: string | null }[]
  pfandBetrag: number
  ausgeberName: string
  erstelltAm: string // ISO
}

export function sha256Hex(data: string | Buffer | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

export function belegHash(payloadJson: string, unterschriftPng: Buffer | Uint8Array, signiertAmIso: string): string {
  return sha256Hex(`${payloadJson}\n${sha256Hex(unterschriftPng)}\n${signiertAmIso}`)
}
