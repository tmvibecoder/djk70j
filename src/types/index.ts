export const ALL_DAYS = ['monday', 'tuesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
export type AllDay = typeof ALL_DAYS[number]

export const EVENT_DAYS = ['thursday', 'friday', 'saturday', 'sunday'] as const
export type EventDay = typeof EVENT_DAYS[number]

export const SETUP_DAYS = ['monday', 'tuesday'] as const
export type SetupDay = typeof SETUP_DAYS[number]

export const ALL_DAY_LABELS: Record<AllDay, string> = {
  monday: 'Montag (6. Juli)',
  tuesday: 'Dienstag (7. Juli)',
  thursday: 'Donnerstag (9. Juli)',
  friday: 'Freitag (10. Juli)',
  saturday: 'Samstag (11. Juli)',
  sunday: 'Sonntag (12. Juli)',
}

export const EVENT_DAY_LABELS: Record<EventDay, string> = {
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag',
  sunday: 'Sonntag',
}

export const EVENT_DAY_EVENTS: Record<string, string> = {
  monday: 'Aufbau Innenzelt',
  tuesday: 'Aufbau Zelt',
  thursday: 'Watt-Turnier',
  friday: 'Disco-Party mit DJ Josch',
  saturday: 'Festzeltparty mit Drunter & Drüber',
  sunday: 'Bayrischer Festsonntag',
}

export const PRODUCT_CATEGORIES = [
  'Bier & Radler',
  'Softdrinks',
  'Schnaps & Shots',
  'Longdrinks',
  'Wein & Sekt',
  'Warme Speisen',
  'Snacks',
] as const

export const TASK_STATUSES = ['offen', 'in_arbeit', 'erledigt'] as const
export type TaskStatus = typeof TASK_STATUSES[number]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  offen: 'Offen',
  in_arbeit: 'In Arbeit',
  erledigt: 'Erledigt',
}

export const USER_ROLES = ['admin', 'orga', 'shiftleader', 'helper'] as const
export type UserRole = typeof USER_ROLES[number]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  orga: 'Orga-Team',
  shiftleader: 'Schichtleiter',
  helper: 'Helfer',
}

export const INVENTORY_TYPES = ['start', 'end', 'delivery'] as const
export type InventoryType = typeof INVENTORY_TYPES[number]

export const INVENTORY_TYPE_LABELS: Record<InventoryType, string> = {
  start: 'Anfangsbestand',
  end: 'Endbestand',
  delivery: 'Lieferung',
}

// ─── Flexible Inventur (Bestandsaufnahme nach Tag + Uhrzeit) ──────────────────

// Erfassungs-Arten der neuen, flexiblen Inventur.
// "count"    = aktueller Bestand (eine Zählung zu einem Zeitpunkt)
// "delivery" = Lieferung/Nachschub (wird dem Bestand hinzugerechnet)
export const STOCK_ENTRY_TYPES = ['count', 'delivery'] as const
export type StockEntryType = typeof STOCK_ENTRY_TYPES[number]

export const STOCK_ENTRY_TYPE_LABELS: Record<StockEntryType, string> = {
  count: 'Bestand zählen',
  delivery: 'Lieferung',
}

// Tage, an denen Inventur gemacht werden kann — chronologisch.
// Donnerstag ist der Start des Fests, Mittwoch der Tag davor (Anlieferung),
// Montag der Tag danach (Endabrechnung).
export const INVENTORY_DAYS = ['wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'monday'] as const
export type InventoryDay = typeof INVENTORY_DAYS[number]

export const INVENTORY_DAY_SHORT: Record<InventoryDay, string> = {
  wednesday: 'Mi',
  thursday: 'Do',
  friday: 'Fr',
  saturday: 'Sa',
  sunday: 'So',
  monday: 'Mo',
}

export const INVENTORY_DAY_LABELS: Record<InventoryDay, string> = {
  wednesday: 'Mittwoch (8. Juli)',
  thursday: 'Donnerstag (9. Juli)',
  friday: 'Freitag (10. Juli)',
  saturday: 'Samstag (11. Juli)',
  sunday: 'Sonntag (12. Juli)',
  monday: 'Montag (13. Juli)',
}

// Der Start-Tag des Fests (für die "Start"-Markierung am Button).
export const INVENTORY_START_DAY: InventoryDay = 'thursday'

// Chronologische Reihenfolge der Tage für Verbrauchs-/Bestands-Berechnung.
export const INVENTORY_DAY_ORDER: Record<string, number> = {
  wednesday: 0,
  thursday: 1,
  friday: 2,
  saturday: 3,
  sunday: 4,
  monday: 5,
  // Legacy-/Aufbau-Tage werden hinten einsortiert
  tuesday: -1,
}

// Erzeugt die Uhrzeit-Auswahl im 15- oder 30-Minuten-Takt.
// Standardbereich 08:00 bis 02:00 (nach Mitternacht zählt zum Fest-Abend).
export function buildTimeSlots(stepMinutes: 15 | 30, fromHour = 8, toHour = 26): string[] {
  const slots: string[] = []
  for (let m = fromHour * 60; m <= toHour * 60; m += stepMinutes) {
    const hh = Math.floor(m / 60) % 24
    const mm = m % 60
    slots.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
  }
  return slots
}

// Wandelt "HH:MM" in eine sortierbare Minutenzahl um.
// Zeiten vor 06:00 gehören zum vorherigen Fest-Abend → +24h, damit die
// Reihenfolge (erste Zählung … letzte Zählung) je Tag korrekt bleibt.
export function inventoryTimeRank(time?: string | null): number {
  if (!time) return 12 * 60 // ohne Uhrzeit: Mittag als neutraler Wert
  const [h, m] = time.split(':').map(Number)
  let mins = (h || 0) * 60 + (m || 0)
  if (mins < 6 * 60) mins += 24 * 60
  return mins
}

export const PRIORITY_LEVELS = ['low', 'medium', 'high'] as const
export type Priority = typeof PRIORITY_LEVELS[number]

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
}
