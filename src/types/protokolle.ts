// Gemeinsame Typen für Protokoll-Daten aus der API
// (Bereich + Person + Task + Beschluss als JSON über /api/bereiche)

export type ProtokollStatus = 'offen' | 'in_arbeit' | 'erledigt'

export interface PersonDTO {
  id: string
  name: string
  initials: string
  color: string
  ordering: number
  isCatchAll: boolean
}

export interface TaskAssignmentDTO {
  id: string
  taskId: string
  personId: string
  person: PersonDTO
}

export interface TaskDTO {
  id: string
  title: string
  description: string | null
  detail: string | null
  status: string
  priority: string
  deadline: string | null
  eventDay: string | null
  category: string | null
  bereichId: string | null
  assigneeId: string | null
  assignments: TaskAssignmentDTO[]
  createdAt: string
  updatedAt: string
}

export interface BeschlussDTO {
  id: string
  text: string
  bereichId: string
  ordering: number
}

export interface BereichDTO {
  id: string
  name: string
  icon: string
  verantwortliche: string
  ordering: number
  beschluesse: BeschlussDTO[]
  tasks: TaskDTO[]
}

export function bereichStats(b: BereichDTO) {
  const offen = b.tasks.filter(t => t.status === 'offen').length
  const inArbeit = b.tasks.filter(t => t.status === 'in_arbeit').length
  const erledigt = b.tasks.filter(t => t.status === 'erledigt').length
  return { offen, inArbeit, erledigt, total: offen + inArbeit + erledigt }
}

export function globalStats(bereiche: BereichDTO[]) {
  let offen = 0, inArbeit = 0, erledigt = 0
  for (const b of bereiche) {
    const s = bereichStats(b)
    offen += s.offen
    inArbeit += s.inArbeit
    erledigt += s.erledigt
  }
  return { offen, inArbeit, erledigt, total: offen + inArbeit + erledigt }
}
