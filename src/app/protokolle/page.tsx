'use client'

import { useState, useMemo } from "react"
import {
  BEREICHE,
  PERSONEN,
  getBereichStats,
  getGlobalStats,
  getDringendeAufgaben,
  getAufgabenForPerson,
  getPersonStats,
  type AufgabeMitBereich,
} from '@/data/protokolle'

type StatusFilter = 'alle' | 'offen' | 'in_arbeit' | 'erledigt'
type ViewMode = 'bereiche' | 'personen'

export default function ProtokollePage() {
  const [view, setView] = useState<ViewMode>('bereiche')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle')
  const [bereichFilter, setBereichFilter] = useState<string>('alle')
  const [activePerson, setActivePerson] = useState<string>('hundi')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const globalStats = useMemo(() => getGlobalStats(), [])
  const dringend = useMemo(() => getDringendeAufgaben(), [])

  const toggle = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  // Filter Bereiche
  const filteredBereiche = useMemo(() => {
    return BEREICHE.filter(b => {
      if (bereichFilter !== 'alle' && b.id !== bereichFilter) return false
      if (statusFilter === 'alle') return true
      const stats = getBereichStats(b)
      if (statusFilter === 'offen') return stats.offen > 0
      if (statusFilter === 'in_arbeit') return stats.inArbeit > 0
      if (statusFilter === 'erledigt') return stats.erledigt > 0
      return true
    })
  }, [statusFilter, bereichFilter])

  const statusChips: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'alle', label: 'Alle', count: globalStats.total },
    { key: 'offen', label: 'Offen', count: globalStats.offen },
    { key: 'in_arbeit', label: 'In Arbeit', count: globalStats.inArbeit },
    { key: 'erledigt', label: 'Erledigt', count: globalStats.erledigt },
  ]

  return (
    <div>
      {/* Header */}
      <div className="bg-gray-900 -mx-4 -mt-16 lg:-mt-6 px-4 pt-16 lg:pt-6 pb-4 mb-0">
        <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
        <h1 className="text-2xl font-bold text-white">Protokolle & Aufgaben</h1>
        <p className="text-gray-400 text-sm mt-1">Stand 11.04.2026</p>
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
              <select
                value={bereichFilter}
                onChange={(e) => setBereichFilter(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white"
              >
                <option value="alle">Alle Bereiche</option>
                {BEREICHE.map(b => (
                  <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                ))}
              </select>
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
                  {dringend.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{d.bereich.icon}</span>
                        <span className="text-red-800 font-medium">{d.aufgabe.titel}</span>
                      </div>
                      <span className="text-red-500 text-xs font-medium shrink-0">Kein Owner</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fortschritt Gesamt */}
            {bereichFilter === 'alle' && statusFilter === 'alle' && (
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-600">{globalStats.offen}</div>
                    <div className="text-[10px] text-gray-500 font-medium">Offen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-600">{globalStats.inArbeit}</div>
                    <div className="text-[10px] text-gray-500 font-medium">In Arbeit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{globalStats.erledigt}</div>
                    <div className="text-[10px] text-gray-500 font-medium">Erledigt</div>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500" style={{ width: `${(globalStats.erledigt / globalStats.total) * 100}%` }} />
                  <div className="h-full bg-amber-400" style={{ width: `${(globalStats.inArbeit / globalStats.total) * 100}%` }} />
                  <div className="h-full bg-red-300" style={{ width: `${(globalStats.offen / globalStats.total) * 100}%` }} />
                </div>
              </div>
            )}

            {/* Bereichs-Karten */}
            {filteredBereiche.map(bereich => {
              const stats = getBereichStats(bereich)
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

              const offeneAufgaben = bereich.aufgaben.filter(a => a.status === 'offen')
              const arbeitAufgaben = bereich.aufgaben.filter(a => a.status === 'in_arbeit')
              const erledigteAufgaben = bereich.aufgaben.filter(a => a.status === 'erledigt')

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
                      {/* Erledigt */}
                      {showErledigt && erledigteAufgaben.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Erledigt ({erledigteAufgaben.length})</div>
                          {erledigteAufgaben.map((a, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                              <span className="text-green-500 text-xs mt-0.5 shrink-0">✓</span>
                              <div>
                                <span className="line-through">{a.titel}</span>
                                {a.verantwortlich && <span className="text-xs ml-1">· {a.verantwortlich}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* In Arbeit */}
                      {showArbeit && arbeitAufgaben.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">In Arbeit ({arbeitAufgaben.length})</div>
                          {arbeitAufgaben.map((a, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-amber-500 text-xs mt-0.5 shrink-0">→</span>
                              <div>
                                <span className="text-gray-900">{a.titel}</span>
                                {(a.verantwortlich || a.detail) && (
                                  <div className="text-xs text-gray-400">
                                    {a.verantwortlich && <span>{a.verantwortlich}</span>}
                                    {a.verantwortlich && a.detail && <span> · </span>}
                                    {a.detail && <span>{a.detail}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Offen */}
                      {showOffen && offeneAufgaben.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Offen ({offeneAufgaben.length})</div>
                          {offeneAufgaben.map((a, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-red-400 text-xs mt-0.5 shrink-0">⬤</span>
                              <div>
                                <span className={`text-gray-900 ${!a.verantwortlich ? 'font-medium' : ''}`}>{a.titel}</span>
                                <div className="text-xs">
                                  {a.verantwortlich ? (
                                    <span className="text-gray-400">{a.verantwortlich}{a.detail ? ` · ${a.detail}` : ''}</span>
                                  ) : (
                                    <span className="text-red-500">{a.detail ? `Kein Verantwortlicher · ${a.detail}` : 'Kein Verantwortlicher'}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Beschlüsse */}
                      {statusFilter === 'alle' && bereich.beschluesse.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <div className="text-[10px] font-bold text-emerald-700 uppercase mb-1.5">Beschlüsse ({bereich.beschluesse.length})</div>
                          <div className="space-y-1 text-sm text-emerald-800">
                            {bereich.beschluesse.map((b, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 shrink-0 text-xs">✓</span>
                                {b}
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
          activePerson={activePerson}
          setActivePerson={setActivePerson}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      )}
    </div>
  )
}

// ─── Personen-Ansicht (Variante 1: Tab-Switcher) ────────────────────────────

function PersonenView({
  activePerson,
  setActivePerson,
  statusFilter,
  setStatusFilter,
}: {
  activePerson: string
  setActivePerson: (id: string) => void
  statusFilter: StatusFilter
  setStatusFilter: (s: StatusFilter) => void
}) {
  const aufgaben = useMemo(() => getAufgabenForPerson(activePerson), [activePerson])
  const stats = useMemo(() => getPersonStats(activePerson), [activePerson])
  const person = PERSONEN.find(p => p.id === activePerson)!

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
            {PERSONEN.map(p => {
              const pStats = getPersonStats(p.id)
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

        {/* Offen */}
        {showOffen && offen.length > 0 && (
          <TaskSection title="Offen" tone="red" tasks={offen} />
        )}

        {/* In Arbeit */}
        {showArbeit && inArbeit.length > 0 && (
          <TaskSection title="In Arbeit" tone="amber" tasks={inArbeit} />
        )}

        {/* Erledigt */}
        {showErledigt && erledigt.length > 0 && (
          <TaskSection title="Erledigt" tone="green" tasks={erledigt} />
        )}

        {aufgaben.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <p className="text-gray-500 text-sm">Keine Aufgaben für {person.name}.</p>
          </div>
        )}

        {/* Hinweis: Lese-Ansicht */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-2">
          <div className="text-[11px] text-blue-700 leading-relaxed">
            💡 Lese-Ansicht. Bearbeiten und Personen-Zuweisen folgt nach DB-Migration.
          </div>
        </div>
      </div>
    </>
  )
}

function TaskSection({
  title,
  tone,
  tasks,
}: {
  title: string
  tone: 'red' | 'amber' | 'green'
  tasks: AufgabeMitBereich[]
}) {
  const tones = {
    red:   { bg: 'bg-red-50',   border: 'border-red-100',   text: 'text-red-700',   icon: '⬤', iconColor: 'text-red-400' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: '→', iconColor: 'text-amber-500' },
    green: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700', icon: '✓', iconColor: 'text-green-500' },
  }[tone]

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className={`${tones.bg} border-b ${tones.border} px-4 py-2`}>
        <div className={`text-[10px] font-bold ${tones.text} uppercase tracking-wider`}>
          {title} ({tasks.length})
        </div>
      </div>
      <div className="px-4 py-3 space-y-3">
        {tasks.map((a, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-base shrink-0">{a.bereich.icon}</span>
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-medium ${tone === 'green' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {a.titel}
              </div>
              <div className="text-[11px] text-gray-500">
                {a.bereich.name}
                {a.verantwortlich ? ` · ${a.verantwortlich}` : ''}
                {a.detail ? ` · ${a.detail}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
