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

// Zähl-Zeitpunkte ("Sessions") für die Inventur – Reihenfolge = chronologisch.
// Der Verbrauch wird aus der ersten vs. der letzten erfassten Session berechnet.
export const COUNT_SESSIONS = [
  { key: 'anlieferung',   label: 'Anlieferung / Start', short: 'Start' },
  { key: 'freitag',       label: 'Freitag',             short: 'Fr' },
  { key: 'samstag_frueh', label: 'Samstag früh',        short: 'Sa früh' },
  { key: 'samstag_spaet', label: 'Samstag spät',        short: 'Sa spät' },
  { key: 'sonntag',       label: 'Sonntag',             short: 'So' },
  { key: 'montag',        label: 'Montag (Abschluss)',  short: 'Mo' },
] as const

export type CountSessionKey = typeof COUNT_SESSIONS[number]['key']
export const COUNT_SESSION_ORDER: string[] = COUNT_SESSIONS.map((s) => s.key)

// ─── Flexible Zählzeitpunkte: Tag + Uhrzeit ───────────────────────────────────
// Statt fester Sessions kann der Zeitpunkt frei aus Tag + Uhrzeit gewählt werden.
// Der Session-Key hat dann das Format "tag@HH:MM", z.B. "friday@17:15".
// Donnerstag = Start des Fests, Mittwoch der Tag davor (Anlieferung),
// Montag der Tag danach (Abschluss).
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

// Start-Tag des Fests (für die "START"-Markierung).
export const INVENTORY_START_DAY: InventoryDay = 'thursday'

// Chronologische Reihenfolge der Tage.
export const INVENTORY_DAY_ORDER: Record<string, number> = {
  wednesday: 1,
  thursday: 2,
  friday: 3,
  saturday: 4,
  sunday: 5,
  monday: 6,
}

// Erzeugt die Uhrzeit-Auswahl im 15- oder 30-Minuten-Takt (08:00 bis 02:00).
export function buildTimeSlots(stepMinutes: 15 | 30, fromHour = 8, toHour = 26): string[] {
  const slots: string[] = []
  for (let m = fromHour * 60; m <= toHour * 60; m += stepMinutes) {
    const hh = Math.floor(m / 60) % 24
    const mm = m % 60
    slots.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
  }
  return slots
}

// Baut/zerlegt den Session-Key "tag@HH:MM".
export function makeSessionKey(day: string, time: string): string {
  return `${day}@${time}`
}
export function parseSessionKey(key: string): { day: string; time: string } | null {
  const at = key.indexOf('@')
  if (at === -1) return null
  return { day: key.slice(0, at), time: key.slice(at + 1) }
}

// Sortier-Rang eines Session-Keys für die Verbrauchs-/Bestandsberechnung.
// Unterstützt sowohl die neuen "tag@HH:MM"-Keys als auch die alten festen Sessions.
const LEGACY_SESSION_RANK: Record<string, number> = {
  anlieferung: 0,
  freitag: 3 * 10000,
  samstag_frueh: 4 * 10000 + 10 * 60,
  samstag_spaet: 4 * 10000 + 22 * 60,
  sonntag: 5 * 10000,
  montag: 6 * 10000,
}
export function inventorySessionRank(key: string | null | undefined): number {
  if (!key) return 9_999_999
  if (key in LEGACY_SESSION_RANK) return LEGACY_SESSION_RANK[key]
  const parsed = parseSessionKey(key)
  if (!parsed) return 9_999_999
  const day = INVENTORY_DAY_ORDER[parsed.day]
  if (day === undefined) return 9_999_999
  let mins = 0
  if (parsed.time) {
    const [h, m] = parsed.time.split(':').map(Number)
    mins = (h || 0) * 60 + (m || 0)
    if (mins < 6 * 60) mins += 24 * 60 // nach Mitternacht zählt zum Vorabend
  }
  return day * 10000 + mins
}

// Lesbares Label für einen beliebigen Session-Key (neu oder legacy).
export function inventorySessionLabel(key: string): string {
  const legacy = COUNT_SESSIONS.find((s) => s.key === key)
  if (legacy) return legacy.label
  const parsed = parseSessionKey(key)
  if (parsed && INVENTORY_DAY_LABELS[parsed.day as InventoryDay]) {
    return `${INVENTORY_DAY_LABELS[parsed.day as InventoryDay]} · ${parsed.time} Uhr`
  }
  return key
}

export const PRIORITY_LEVELS = ['low', 'medium', 'high'] as const
export type Priority = typeof PRIORITY_LEVELS[number]

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
}
