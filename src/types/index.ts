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

export const PRIORITY_LEVELS = ['low', 'medium', 'high'] as const
export type Priority = typeof PRIORITY_LEVELS[number]

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
}
