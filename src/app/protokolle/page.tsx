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

type StatusFilter = 'alle' | 'offen' | 'in_arbeit' | 'erledigt'
type ViewMode = 'bereiche' | 'personen'

export default function ProtokollePage() {
  const [bereiche, setBereiche] = useState<BereichDTO[]>([])
  const [personen, setPersonen] = useState<PersonDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('bereiche')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle')
  const [bereichFilter, setBereichFilter] = useState<string>('alle')
  const [activePerson, setActivePerson] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Modal-State
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
    if (!activePerson && pData.length > 0) {
      setActivePerson(pData[0].id)
    }
    setLoading(false)
  }, [activePerson])

  useEffect(() => {
    loadData()
  }, [loadData])

  const allTasks: TaskDTO[] = useMemo(
    () => bereiche.flatMap(b => b.tasks),
    [bereiche]
  )

  const dringend = useMemo(
    () =>
      bereiche.flatMap(b =>
        b.tasks
          .filter(t => t.status === 'offen' && t.assignments.filter(a => !a.person.isCatchAll).length === 0)
          .map(t => ({ bereich: b, task: t }))
      ),
    [bereiche]
  )

  const gStats = useMemo(() => globalStats(bereiche), [bereiche])

  const toggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
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

  const filteredBereiche = useMemo(() => {
    return bereiche.filter(b => {
      if (bereichFilter !== 'alle' && b.id !== bereichFilter) return false
      if (statusFilter === 'alle') return true
      const stats = bereichStats(b)
      if (statusFilter === 'offen') return stats.offen > 0
      if (statusFilter === 'in_arbeit') return stats.inArbeit > 0
      if (statusFilter === 'erledigt') return stats.erledigt > 0
      return true
    })
  }, [bereiche, statusFilter, bereichFilter])

  const statusChips: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'alle', label: 'Alle', count: gStats.total },
    { key: 'offen', label: 'Offen', count: gStats.offen },
    { key: 'in_arbeit', label: 'In Arbeit', count: gStats.inArbeit },
    { key: 'erledigt', label: 'Erledigt', count: gStats.erledigt },
  ]

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
    <div>
      {/* Header */}
      <div className="bg-gray-900 -mx-4 -mt-16 lg:-mt-6 px-4 pt-16 lg:pt-6 pb-4 mb-0">
        <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
        <h1 className="text-2xl font-bold text-white">Festplanung</h1>
        <p className="text-gray-400 text-sm mt-1">{gStats.total} Aufgaben · {gStats.offen} offen · {gStats.inArbeit} in Arbeit</p>
      </div>

      {/* View Tabs */}
      <div className="bg-white border-b -mx-4 px-4">
        <div className="flex gap-1">
          <button
            onClick={() => setView('bereiche')}
            className={`px-4 py-3 text-sm font-semibold transition-colors ${
              view === 'bereiche'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bereiche
          </button>
          <button
            onClick={() => setView('personen')}
            className={`px-4 py-3 text-sm font-semibold transition-colors ${
              view === 'personen'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Personen
          </button>
        </div>
      </div>

      {view === 'bereiche' && (
        <>
          {/* Sticky Filter Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b shadow-sm -mx-4 px-4 py-3 mb-4">
            <div className="space-y-2">
              {/* Status Chips */}
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {statusChips.map(chip => (
                  <button
                    key={chip.key}
                    onClick={() => setStatusFilter(chip.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      statusFilter === chip.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {chip.label} ({chip.count})
                  </button>
                ))}
              </div>
              {/* Bereich Dropdown */}
              <div className="flex gap-2">
                <select
                  value={bereichFilter}
                  onChange={e => setBereichFilter(e.target.value)}
                  className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white"
                >
                  <option value="alle">Alle Bereiche</option>
                  {bereiche.map(b => (
                    <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => openCreate()}
                  className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 whitespace-nowrap"
                >
                  + Neue Aufgabe
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Dringend-Banner */}
            {(statusFilter === 'alle' || statusFilter === 'offen') && bereichFilter === 'alle' && dringend.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Dringend</span>
                  <span className="text-xs text-red-700 font-semibold">Kein Verantwortlicher zugewiesen</span>
                </div>
                <div className="space-y-2">
                  {dringend.map(d => (
                    <button
                      key={d.task.id}
                      onClick={() => openEdit(d.task)}
                      className="w-full flex items-center justify-between text-sm hover:bg-red-100 -mx-1 px-1 py-1 rounded"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span>{d.bereich.icon}</span>
                        <span className="text-red-800 font-medium truncate text-left">{d.task.title}</span>
                      </div>
                      <span className="text-red-500 text-xs font-medium shrink-0">Zuweisen →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fortschritt Gesamt */}
            {bereichFilter === 'alle' && statusFilter === 'alle' && gStats.total > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-600">{gStats.offen}</div>
                    <div className="text-[10px] text-gray-500 font-medium">Offen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-600">{gStats.inArbeit}</div>
                    <div className="text-[10px] text-gray-500 font-medium">In Arbeit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{gStats.erledigt}</div>
                    <div className="text-[10px] text-gray-500 font-medium">Erledigt</div>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500" style={{ width: `${(gStats.erledigt / gStats.total) * 100}%` }} />
                  <div className="h-full bg-amber-400" style={{ width: `${(gStats.inArbeit / gStats.total) * 100}%` }} />
                  <div className="h-full bg-red-300" style={{ width: `${(gStats.offen / gStats.total) * 100}%` }} />
                </div>
              </div>
            )}

            {/* Bereichs-Karten */}
            {filteredBereiche.map(bereich => {
              const stats = bereichStats(bereich)
              const isExpanded = expandedId === bereich.id
              const badgeText = stats.offen > 0
                ? `${stats.offen} offen`
                : stats.inArbeit > 0
                  ? `${stats.inArbeit} in Arbeit`
                  : 'Erledigt'
              const badgeColor = stats.offen > 2
                ? 'bg-red-100 text-red-700'
                : stats.offen > 0
                  ? 'bg-amber-100 text-amber-700'
                  : stats.inArbeit > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'

              const showOffen = statusFilter === 'alle' || statusFilter === 'offen'
              const showArbeit = statusFilter === 'alle' || statusFilter === 'in_arbeit'
              const showErledigt = statusFilter === 'alle' || statusFilter === 'erledigt'

              const offeneAufgaben = bereich.tasks.filter(a => a.status === 'offen')
              const arbeitAufgaben = bereich.tasks.filter(a => a.status === 'in_arbeit')
              const erledigteAufgaben = bereich.tasks.filter(a => a.status === 'erledigt')

              return (
                <div key={bereich.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <button
                    onClick={() => toggle(bereich.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{bereich.icon}</span>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 text-sm">{bereich.name}</div>
                        <div className="text-xs text-gray-500">{bereich.verantwortliche}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badgeText}</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-4 py-3 space-y-3">
                      {/* + Neue Aufgabe */}
                      <button
                        onClick={() => openCreate(bereich.id)}
                        className="w-full text-xs font-semibold text-indigo-600 border border-dashed border-indigo-300 rounded-lg py-1.5 hover:bg-indigo-50"
                      >
                        + Neue Aufgabe in {bereich.name}
                      </button>

                      {/* Erledigt */}
                      {showErledigt && erledigteAufgaben.length > 0 && (
                        <TaskGroup
                          title={`Erledigt (${erledigteAufgaben.length})`}
                          color="text-green-700"
                          tasks={erledigteAufgaben}
                          onEdit={openEdit}
                        />
                      )}

                      {/* In Arbeit */}
                      {showArbeit && arbeitAufgaben.length > 0 && (
                        <TaskGroup
                          title={`In Arbeit (${arbeitAufgaben.length})`}
                          color="text-amber-700"
                          tasks={arbeitAufgaben}
                          onEdit={openEdit}
                        />
                      )}

                      {/* Offen */}
                      {showOffen && offeneAufgaben.length > 0 && (
                        <TaskGroup
                          title={`Offen (${offeneAufgaben.length})`}
                          color="text-red-600"
                          tasks={offeneAufgaben}
                          onEdit={openEdit}
                        />
                      )}

                      {/* Beschlüsse */}
                      {statusFilter === 'alle' && bereich.beschluesse.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <div className="text-[10px] font-bold text-emerald-700 uppercase mb-1.5">Beschlüsse ({bereich.beschluesse.length})</div>
                          <div className="space-y-1 text-sm text-emerald-800">
                            {bereich.beschluesse.map(b => (
                              <div key={b.id} className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 shrink-0 text-xs">✓</span>
                                {b.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {filteredBereiche.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <p className="text-gray-500 text-sm">Keine Bereiche mit diesem Filter gefunden.</p>
              </div>
            )}
          </div>
        </>
      )}

      {view === 'personen' && (
        <PersonenView
          personen={personen}
          allTasks={allTasks}
          bereiche={bereiche}
          activePerson={activePerson}
          setActivePerson={setActivePerson}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onEdit={openEdit}
        />
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

// ─── Sub-Komponenten ────────────────────────────────────────────────────────

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
    <div className="space-y-1.5">
      <div className={`text-[10px] font-bold ${color} uppercase tracking-wider`}>{title}</div>
      {tasks.map(t => (
        <TaskRow key={t.id} task={t} onEdit={onEdit} />
      ))}
    </div>
  )
}

function TaskRow({
  task,
  onEdit,
}: {
  task: TaskDTO
  onEdit: (t: TaskDTO) => void
}) {
  const persons = task.assignments.filter(a => !a.person.isCatchAll).map(a => a.person)
  const hasOwner = persons.length > 0
  const isDone = task.status === 'erledigt'

  const icon = task.status === 'offen' ? '⬤' : task.status === 'in_arbeit' ? '→' : '✓'
  const iconColor =
    task.status === 'offen' ? 'text-red-400' : task.status === 'in_arbeit' ? 'text-amber-500' : 'text-green-500'

  return (
    <button
      type="button"
      onClick={() => onEdit(task)}
      className="w-full flex items-start gap-2 text-left hover:bg-gray-50 -mx-1 px-1 py-1 rounded"
    >
      <span className={`${iconColor} text-xs mt-1 shrink-0`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className={`text-sm ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'} ${!hasOwner && !isDone ? 'font-medium' : ''}`}>
          {task.title}
        </div>
        <div className="text-xs">
          {hasOwner ? (
            <span className="inline-flex items-center gap-1 flex-wrap">
              {persons.map(p => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white"
                  style={{ background: p.color }}
                >
                  {p.name}
                </span>
              ))}
              {task.detail && <span className="text-gray-400">· {task.detail}</span>}
            </span>
          ) : (
            <span className="text-red-500">
              {task.detail ? `Kein Verantwortlicher · ${task.detail}` : task.status === 'erledigt' ? '' : 'Kein Verantwortlicher'}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Personen-Ansicht ───────────────────────────────────────────────────────

function PersonenView({
  personen,
  allTasks,
  bereiche,
  activePerson,
  setActivePerson,
  statusFilter,
  setStatusFilter,
  onEdit,
}: {
  personen: PersonDTO[]
  allTasks: TaskDTO[]
  bereiche: BereichDTO[]
  activePerson: string
  setActivePerson: (id: string) => void
  statusFilter: StatusFilter
  setStatusFilter: (s: StatusFilter) => void
  onEdit: (t: TaskDTO) => void
}) {
  const bereichLookup = useMemo(() => {
    const m = new Map<string, BereichDTO>()
    for (const b of bereiche) m.set(b.id, b)
    return m
  }, [bereiche])

  // Fuer "Nicht zugewiesen" (Catchall) zaehlen sowohl explizit zugewiesene
  // Tasks als auch Tasks komplett ohne Personen-Zuweisung (z.B. neu angelegte
  // ohne Pflicht-Auswahl). So sind sie sofort findbar.
  const tasksForPerson = (personId: string) => {
    const person = personen.find(p => p.id === personId)
    if (person?.isCatchAll) {
      return allTasks.filter(t =>
        t.assignments.length === 0 ||
        t.assignments.some(a => a.personId === personId)
      )
    }
    return allTasks.filter(t => t.assignments.some(a => a.personId === personId))
  }

  const personStats = (personId: string) => {
    const tasks = tasksForPerson(personId)
    const offen = tasks.filter(t => t.status === 'offen').length
    const inArbeit = tasks.filter(t => t.status === 'in_arbeit').length
    const erledigt = tasks.filter(t => t.status === 'erledigt').length
    return { offen, inArbeit, erledigt, total: offen + inArbeit + erledigt }
  }

  const person = personen.find(p => p.id === activePerson) || personen[0]
  if (!person) return null

  const aufgaben = tasksForPerson(person.id)
  const stats = personStats(person.id)

  const offen = aufgaben.filter(a => a.status === 'offen')
  const inArbeit = aufgaben.filter(a => a.status === 'in_arbeit')
  const erledigt = aufgaben.filter(a => a.status === 'erledigt')

  const showOffen = statusFilter === 'alle' || statusFilter === 'offen'
  const showArbeit = statusFilter === 'alle' || statusFilter === 'in_arbeit'
  const showErledigt = statusFilter === 'alle' || statusFilter === 'erledigt'

  const statusChips: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'alle', label: 'Alle', count: stats.total },
    { key: 'offen', label: 'Offen', count: stats.offen },
    { key: 'in_arbeit', label: 'In Arbeit', count: stats.inArbeit },
    { key: 'erledigt', label: 'Erledigt', count: stats.erledigt },
  ]

  return (
    <>
      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm -mx-4 px-4 py-3 mb-4">
        <div className="space-y-2">
          {/* Personen Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {personen.map(p => {
              const pStats = personStats(p.id)
              const isActive = activePerson === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePerson(p.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="inline-flex items-center justify-center rounded-full font-bold text-[10px] text-white shrink-0"
                    style={{
                      width: 22,
                      height: 22,
                      background: isActive ? 'rgba(255,255,255,0.25)' : p.color,
                    }}
                  >
                    {p.initials}
                  </span>
                  {p.name}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {pStats.total}
                  </span>
                </button>
              )
            })}
          </div>
          {/* Status Chips */}
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {statusChips.map(chip => (
              <button
                key={chip.key}
                onClick={() => setStatusFilter(chip.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === chip.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {chip.label} ({chip.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Aktive Person Header */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: person.color }}
            >
              {person.initials}
            </div>
            <div>
              <div className="font-bold text-gray-900">{person.name}</div>
              <div className="text-xs text-gray-500">Verantwortlich für {stats.total} Aufgaben</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center bg-red-50 rounded-lg py-2">
              <div className="text-lg font-bold text-red-600">{stats.offen}</div>
              <div className="text-[10px] text-red-700 font-semibold uppercase">Offen</div>
            </div>
            <div className="text-center bg-amber-50 rounded-lg py-2">
              <div className="text-lg font-bold text-amber-600">{stats.inArbeit}</div>
              <div className="text-[10px] text-amber-700 font-semibold uppercase">In Arbeit</div>
            </div>
            <div className="text-center bg-green-50 rounded-lg py-2">
              <div className="text-lg font-bold text-green-600">{stats.erledigt}</div>
              <div className="text-[10px] text-green-700 font-semibold uppercase">Erledigt</div>
            </div>
          </div>
        </div>

        {showOffen && offen.length > 0 && (
          <PersonTaskSection title="Offen" tone="red" tasks={offen} bereichLookup={bereichLookup} onEdit={onEdit} />
        )}
        {showArbeit && inArbeit.length > 0 && (
          <PersonTaskSection title="In Arbeit" tone="amber" tasks={inArbeit} bereichLookup={bereichLookup} onEdit={onEdit} />
        )}
        {showErledigt && erledigt.length > 0 && (
          <PersonTaskSection title="Erledigt" tone="green" tasks={erledigt} bereichLookup={bereichLookup} onEdit={onEdit} />
        )}

        {aufgaben.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <p className="text-gray-500 text-sm">Keine Aufgaben für {person.name}.</p>
          </div>
        )}
      </div>
    </>
  )
}

function PersonTaskSection({
  title,
  tone,
  tasks,
  bereichLookup,
  onEdit,
}: {
  title: string
  tone: 'red' | 'amber' | 'green'
  tasks: TaskDTO[]
  bereichLookup: Map<string, BereichDTO>
  onEdit: (t: TaskDTO) => void
}) {
  const tones = {
    red: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
    green: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700' },
  }[tone]

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className={`${tones.bg} border-b ${tones.border} px-4 py-2`}>
        <div className={`text-[10px] font-bold ${tones.text} uppercase tracking-wider`}>
          {title} ({tasks.length})
        </div>
      </div>
      <div className="px-4 py-3 space-y-2">
        {tasks.map(t => {
          const bereich = t.bereichId ? bereichLookup.get(t.bereichId) : null
          const isDone = t.status === 'erledigt'
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onEdit(t)}
              className="w-full flex items-start gap-2 text-left hover:bg-gray-50 -mx-1 px-1 py-1 rounded"
            >
              <span className="text-base shrink-0">{bereich?.icon ?? '·'}</span>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {t.title}
                </div>
                <div className="text-[11px] text-gray-500">
                  {bereich?.name ?? 'Ohne Bereich'}
                  {t.detail ? ` · ${t.detail}` : ''}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
