// Reine Bereichs-/Rollen-Konstanten ohne Server-Abhängigkeiten (kein
// next/headers, kein Prisma) — daher auch aus Client-Components importierbar.
// src/lib/session.ts re-exportiert diese Konstanten für Server-Code.

export type Bereich = 'veranstaltungen' | 'werbebanden' | 'schluessel' | 'djk-info'
export const BEREICHE: Bereich[] = ['veranstaltungen', 'werbebanden', 'schluessel', 'djk-info']
export const BEREICH_LABELS: Record<Bereich, string> = {
  veranstaltungen: 'Veranstaltungen',
  werbebanden: 'Werbebanner',
  schluessel: 'Schlüssel',
  'djk-info': 'Info-Broschüre',
}

export type BereichsRolle = 'lesen' | 'bearbeiten' | 'verwalten'
export const BEREICHSROLLEN: BereichsRolle[] = ['lesen', 'bearbeiten', 'verwalten']
export const ROLLE_LABELS: Record<BereichsRolle, string> = {
  lesen: 'Lesen',
  bearbeiten: 'Bearbeiten',
  verwalten: 'Verwalten',
}
