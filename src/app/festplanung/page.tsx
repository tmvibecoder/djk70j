'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ProtokollAufgabeModal from '@/components/ProtokollAufgabeModal'
import {
  bereichStats,
  globalStats,
  type BereichDTO,
  type PersonDTO,
  type TaskDTO,
} from '@/types/protokolle'

type ViewMode = 'bereich' | 'person'

const STORAGE_VIEW = 'djk-festplanung-view'
const STORAGE_OPEN_BEREICH = 'djk-festplanung-open-bereich'
const STORAGE_OPEN_PERSON = 'djk-festplanung-open-person'

export default function FestplanungPage() {
  const [bereiche, setBereiche] = useState<BereichDTO[]>([])
  const [personen, setPersonen] = useState<PersonDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('bereich')
  const [openBereich, setOpenBereich] = useState<Set<string>>(new Set())
  const [openPerson, setOpenPerson] = useState<Set<string>>(new Set())

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null)
  const [defaultBereichId, setDefaultBereichId] = useState<string | undefined>()

  const loadData = useCallback(async () => {
    const [bRes, pRes] = await Promise.all([
      fetch('/api/bereiche'),
      fetch('/api/personen'),
    ])
    const [bData, pData] = await Promise.all([bRes.json(), pRes.json()])
    setBereiche(bData)
    setPersonen(pData)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Persisted UI state rehydrieren (client-only, nach mount um Hydration-Mismatch zu vermeiden)
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_VIEW)
      if (v === 'bereich' || v === 'person') setView(v)
      const ob = localStorage.getItem(STORAGE_OPEN_BEREICH)
      if (ob) setOpenBereich(new Set(JSON.parse(ob)))
      const op = localStorage.getItem(STORAGE_OPEN_PERSON)
      if (op) setOpenPerson(new Set(JSON.parse(op)))
    } catch {
      // Storage nicht verfügbar — defaults beibehalten
    }
  }, [])

  const switchView = (v: ViewMode) => {
    setView(v)
    try { localStorage.setItem(STORAGE_VIEW, v) } catch {}
  }

  const toggleBereich = (id: string) => {
    setOpenBereich(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      try { localStorage.setItem(STORAGE_OPEN_BEREICH, JSON.stringify(Array.from(next))) } catch {}
      return next
    })
  }

  const togglePerson = (id: string) => {
    setOpenPerson(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      try { localStorage.setItem(STORAGE_OPEN_PERSON, JSON.stringify(Array.from(next))) } catch {}
      return next
    })
  }

  const gStats = useMemo(() => globalStats(bereiche), [bereiche])
  const allTasks: TaskDTO[] = useMemo(() => bereiche.flatMap(b => b.tasks), [bereiche])

  // Nicht-zugewiesen: alle nicht-erledigten Tasks ohne echte Person
  const unassigned = useMemo(() =>
    bereiche.flatMap(b =>
      b.tasks
        .filter(t => t.status !== 'erledigt' && t.assignments.filter(a => !a.person.isCatchAll).length === 0)
        .map(t => ({ bereich: b, task: t }))
    ),
    [bereiche]
  )

  const bereichLookup = useMemo(() => {
    const m = new Map<string, BereichDTO>()
    for (const b of bereiche) m.set(b.id, b)
    return m
  }, [bereiche])

  const sortedPersonen = useMemo(() => {
    return [...personen].sort((a, b) => {
      if (a.isCatchAll && !b.isCatchAll) return 1
      if (!a.isCatchAll && b.isCatchAll) return -1
      return a.ordering - b.ordering
    })
  }, [personen])

  const tasksForPerson = (person: PersonDTO): TaskDTO[] => {
    if (person.isCatchAll) {
      return allTasks.filter(t =>
        t.assignments.length === 0 ||
        t.assignments.some(a => a.personId === person.id)
      )
    }
    return allTasks.filter(t => t.assignments.some(a => a.personId === person.id))
  }

  const personStats = (p: PersonDTO) => {
    const tasks = tasksForPerson(p)
    const offen = tasks.filter(t => t.status === 'offen').length
    const inArbeit = tasks.filter(t => t.status === 'in_arbeit').length
    const erledigt = tasks.filter(t => t.status === 'erledigt').length
    return { offen, inArbeit, erledigt, total: offen + inArbeit + erledigt }
  }

  const openCreate = (bereichId?: string) => {
    setEditingTask(null)
    setDefaultBereichId(bereichId)
    setModalOpen(true)
  }

  const openEdit = (task: TaskDTO) => {
    setEditingTask(task)
    setDefaultBereichId(undefined)
    setModalOpen(true)
  }

  const deleteTask = async (task: TaskDTO) => {
    if (!confirm(`Aufgabe „${task.title}" wirklich löschen?`)) return
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Title + Summary */}
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Festplanung</h1>
          <p className="text-sm text-gray-500">
            {bereiche.length} Bereiche · {gStats.offen} offen · {gStats.inArbeit} in Arbeit · {gStats.erledigt} erledigt
          </p>
        </div>
        <button
          onClick={() => openCreate()}
          className="shrink-0 px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 whitespace-nowrap"
        >
          + Neue Aufgabe
        </button>
      </div>

      {/* Segmented Tabs: Bereich / Person */}
      <div className="bg-gray-200/70 p-1 rounded-xl flex gap-1 mb-4" role="tablist" aria-label="Gruppierung wählen">
        <button
          onClick={() => switchView('bereich')}
          role="tab"
          aria-selected={view === 'bereich'}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            view === 'bereich'
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span aria-hidden>📋</span>
          <span>Nach Bereich</span>
        </button>
        <button
          onClick={() => switchView('person')}
          role="tab"
          aria-selected={view === 'person'}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            view === 'person'
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span aria-hidden>👥</span>
          <span>Nach Person</span>
        </button>
      </div>

      {/* ── Bereich View ── */}
      {view === 'bereich' && (
        <>
          <div className="space-y-2">
            {bereiche.map(b => {
              const stats = bereichStats(b)
              const isOpen = openBereich.has(b.id)
              const offeneT = b.tasks.filter(t => t.status === 'offen')
              const arbeitT = b.tasks.filter(t => t.status === 'in_arbeit')
              const erlT = b.tasks.filter(t => t.status === 'erledigt')
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition">
                  <button
                    onClick={() => toggleBereich(b.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left"
                    aria-expanded={isOpen}
                  >
                    <Chevron open={isOpen} />
                    <span className="text-2xl shrink-0">{b.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{b.name}</div>
                    </div>
                    <StatPills offen={stats.offen} inArbeit={stats.inArbeit} erledigt={stats.erledigt} />
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-200 px-4 py-3 space-y-3">
                      {offeneT.length > 0 && (
                        <TaskGroup title={`Offen (${offeneT.length})`} color="text-red-700" tasks={offeneT} onEdit={openEdit} />
                      )}
                      {arbeitT.length > 0 && (
                        <TaskGroup title={`In Arbeit (${arbeitT.length})`} color="text-amber-700" tasks={arbeitT} onEdit={openEdit} />
                      )}
                      {erlT.length > 0 && (
                        <TaskGroup title={`Erledigt (${erlT.length})`} color="text-gray-500" tasks={erlT} onEdit={openEdit} />
                      )}
                      {b.beschluesse.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <div className="text-[10px] font-bold text-emerald-700 uppercase mb-1.5">Beschlüsse ({b.beschluesse.length})</div>
                          <div className="space-y-1 text-sm text-emerald-800">
                            {b.beschluesse.map(bb => (
                              <div key={bb.id} className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 shrink-0 text-xs">✓</span>
                                {bb.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => openCreate(b.id)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700"
                      >
                        {`+ Neue Aufgabe in „${b.name}“`}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Nicht zugewiesen — ganz unten */}
          {unassigned.length > 0 && (
            <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-300">
              <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                <button
                  onClick={() => toggleBereich('__unassigned')}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50/50 transition text-left"
                  aria-expanded={openBereich.has('__unassigned')}
                >
                  <Chevron open={openBereich.has('__unassigned')} />
                  <span className="text-xl shrink-0">⚠</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">Nicht zugewiesen</div>
                    <div className="text-xs text-gray-500">Bitte Person eintragen</div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold shrink-0">
                    {unassigned.length}
                  </span>
                </button>
                {openBereich.has('__unassigned') && (
                  <div className="border-t border-gray-200 px-4 py-3 space-y-1">
                    {unassigned.map(({ bereich, task }) => (
                      <button
                        key={task.id}
                        onClick={() => openEdit(task)}
                        className="w-full flex items-center gap-3 py-1.5 text-sm hover:bg-gray-50 -mx-2 px-2 rounded text-left"
                      >
                        <span className="text-base shrink-0">{bereich.icon}</span>
                        <div className="flex-1 min-w-0 text-gray-800 truncate">{task.title}</div>
                        <span className="text-xs text-gray-400 hidden sm:block shrink-0">{bereich.name}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded shrink-0">+ Person</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Person View ── */}
      {view === 'person' && (
        <div className="space-y-2">
          {sortedPersonen.map(p => {
            const stats = personStats(p)
            const isOpen = openPerson.has(p.id)
            const tasks = tasksForPerson(p)
            const offeneT = tasks.filter(t => t.status === 'offen')
            const arbeitT = tasks.filter(t => t.status === 'in_arbeit')
            const erlT = tasks.filter(t => t.status === 'erledigt')
            return (
              <div key={p.id} className={`bg-white rounded-xl border ${p.isCatchAll ? 'border-red-200' : 'border-gray-200'} overflow-hidden hover:border-gray-300 transition`}>
                <button
                  onClick={() => togglePerson(p.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left"
                  aria-expanded={isOpen}
                >
                  <Chevron open={isOpen} />
                  {p.isCatchAll ? (
                    <span className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-lg ring-2 ring-red-200 shrink-0">⚠</span>
                  ) : (
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: p.color }}
                    >
                      {p.initials}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {p.isCatchAll ? 'Nicht zugewiesen' : p.name}
                    </div>
                    <div className="text-xs text-gray-500">{stats.total} Aufgaben</div>
                  </div>
                  <StatPills offen={stats.offen} inArbeit={stats.inArbeit} erledigt={stats.erledigt} />
                </button>
                {isOpen && (
                  <div className="border-t border-gray-200 px-4 py-3 space-y-3">
                    {offeneT.length > 0 && (
                      <PersonTaskGroup title={`Offen (${offeneT.length})`} color="text-red-700" tasks={offeneT} bereichLookup={bereichLookup} onEdit={openEdit} />
                    )}
                    {arbeitT.length > 0 && (
                      <PersonTaskGroup title={`In Arbeit (${arbeitT.length})`} color="text-amber-700" tasks={arbeitT} bereichLookup={bereichLookup} onEdit={openEdit} />
                    )}
                    {erlT.length > 0 && (
                      <PersonTaskGroup title={`Erledigt (${erlT.length})`} color="text-gray-500" tasks={erlT} bereichLookup={bereichLookup} onEdit={openEdit} />
                    )}
                    {tasks.length === 0 && (
                      <div className="text-sm text-gray-500 italic">Keine Aufgaben.</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ProtokollAufgabeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        task={editingTask}
        bereiche={bereiche}
        personen={personen}
        defaultBereichId={defaultBereichId}
        onDelete={deleteTask}
      />
    </div>
  )
}

// ─── Sub-Komponenten ─────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform duration-150 shrink-0 ${open ? 'rotate-90' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path d="M7 5l6 5-6 5V5z" />
    </svg>
  )
}

function StatPills({ offen, inArbeit, erledigt }: { offen: number; inArbeit: number; erledigt: number }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
      {offen === 0 ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 whitespace-nowrap">✓</span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 whitespace-nowrap">{offen} offen</span>
      )}
      {inArbeit > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 whitespace-nowrap">{inArbeit} läuft</span>
      )}
      {erledigt > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 whitespace-nowrap">{erledigt} ✓</span>
      )}
    </div>
  )
}

function TaskGroup({
  title,
  color,
  tasks,
  onEdit,
}: {
  title: string
  color: string
  tasks: TaskDTO[]
  onEdit: (t: TaskDTO) => void
}) {
  return (
    <div>
      <div className={`text-[10px] font-bold ${color} uppercase tracking-wider mb-1.5`}>{title}</div>
      <div className="space-y-1">
        {tasks.map(t => (
          <TaskRow key={t.id} task={t} onEdit={onEdit} />
        ))}
      </div>
    </div>
  )
}

function TaskRow({ task, onEdit }: { task: TaskDTO; onEdit: (t: TaskDTO) => void }) {
  const persons = task.assignments.filter(a => !a.person.isCatchAll).map(a => a.person)
  const hasOwner = persons.length > 0
  const isDone = task.status === 'erledigt'

  return (
    <button
      type="button"
      onClick={() => onEdit(task)}
      className="w-full flex items-start gap-2 text-left hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
    >
      <span className={`mt-1 w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
        {isDone && <span className="text-white text-[10px] leading-none">✓</span>}
      </span>
      <div className="min-w-0 flex-1">
        <div className={`text-sm ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
          {task.title}
        </div>
        {task.detail && <div className="text-xs text-gray-400 mt-0.5">{task.detail}</div>}
      </div>
      {hasOwner ? (
        <div className="flex items-center gap-1 shrink-0">
          {persons.map(p => (
            <span
              key={p.id}
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white"
              style={{ background: p.color }}
            >
              {p.initials}
            </span>
          ))}
        </div>
      ) : !isDone ? (
        <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600">— offen</span>
      ) : null}
    </button>
  )
}

function PersonTaskGroup({
  title,
  color,
  tasks,
  bereichLookup,
  onEdit,
}: {
  title: string
  color: string
  tasks: TaskDTO[]
  bereichLookup: Map<string, BereichDTO>
  onEdit: (t: TaskDTO) => void
}) {
  return (
    <div>
      <div className={`text-[10px] font-bold ${color} uppercase tracking-wider mb-1.5`}>{title}</div>
      <div className="space-y-1">
        {tasks.map(t => {
          const bereich = t.bereichId ? bereichLookup.get(t.bereichId) : null
          const isDone = t.status === 'erledigt'
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onEdit(t)}
              className="w-full flex items-start gap-2 text-left hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
            >
              <span className={`mt-1 w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                {isDone && <span className="text-white text-[10px] leading-none">✓</span>}
              </span>
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {t.title}
                </div>
                {t.detail && <div className="text-xs text-gray-400 mt-0.5">{t.detail}</div>}
              </div>
              {bereich && (
                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  <span>{bereich.icon}</span>
                  <span className="hidden sm:inline">{bereich.name}</span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
