'use client'

import { useState } from "react"
import { BEREICHE, getBereichStats, getStatusColor, parseDatum } from '@/data/protokolle'
import type { Bereich } from '@/data/protokolle'

// --- Grid-Übersicht ---

function GridView({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 -mx-4 -mt-16 lg:-mt-6 px-4 pt-16 lg:pt-6 pb-4 mb-6 rounded-b-lg">
        <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
        <h1 className="text-2xl font-bold text-white">Protokolle — Themenübersicht</h1>
        <p className="text-sm text-gray-400 mt-1">{BEREICHE.length} Themenbereiche aus {new Set(BEREICHE.flatMap(b => b.eintraege.map(e => e.sitzungNr))).size} Sitzungen</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BEREICHE.map(bereich => {
          const stats = getBereichStats(bereich)
          const status = getStatusColor(stats.allAufgaben.length)
          return (
            <button
              key={bereich.id}
              onClick={() => onSelect(bereich.id)}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-lg hover:border-gray-300 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{bereich.icon}</span>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${status.bg} ${status.text}`}>
                  <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                  {status.label}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{bereich.name}</h3>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {stats.allBeschluesse.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-500">&#10003;</span>
                    {stats.allBeschluesse.length} Beschlüsse
                  </span>
                )}
                <span>Letzte: {stats.letztesDatum}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                {bereich.eintraege.length} {bereich.eintraege.length === 1 ? "Eintrag" : "Einträge"} aus {new Set(bereich.eintraege.map(e => e.sitzungNr)).size} {new Set(bereich.eintraege.map(e => e.sitzungNr)).size === 1 ? "Sitzung" : "Sitzungen"}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- Detail-Ansicht ---

function DetailView({
  bereich,
  onSelect,
  onBack
}: {
  bereich: Bereich
  onSelect: (id: string) => void
  onBack: () => void
}) {
  const stats = getBereichStats(bereich)
  const eintraegeReversed = [...bereich.eintraege].sort((a, b) => parseDatum(b.datum) - parseDatum(a.datum))

  return (
    <div className="flex gap-0 min-h-[calc(100vh-6rem)]">
      {/* Sidebar — Themen-Navigation */}
      <aside className="hidden lg:block w-56 shrink-0 border-r border-gray-200 bg-white rounded-l-xl -ml-6 -mt-6 -mb-6 mr-6">
        <div className="p-4 border-b border-gray-200">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Übersicht
          </button>
        </div>
        <nav className="py-2">
          {BEREICHE.map(b => (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                b.id === bereich.id
                  ? "bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg shrink-0">{b.icon}</span>
              <span className="truncate">{b.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Hauptinhalt */}
      <main className="flex-1 min-w-0 space-y-6">
        {/* Mobile: Zurück-Button */}
        <button onClick={onBack} className="lg:hidden flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Zurück zur Übersicht
        </button>

        {/* Header */}
        <div className="bg-gray-900 rounded-lg px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{bereich.icon}</span>
            <div>
              <h1 className="text-xl font-bold text-white">{bereich.name}</h1>
              <p className="text-sm text-gray-400">
                {bereich.eintraege.length} {bereich.eintraege.length === 1 ? "Eintrag" : "Einträge"} aus {new Set(bereich.eintraege.map(e => e.sitzungNr)).size} Sitzungen
              </p>
            </div>
          </div>
        </div>

        {/* Aktueller Stand */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Aktueller Stand</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Beschlüsse */}
            {stats.allBeschluesse.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">&#10003;</span>
                  Beschlüsse ({stats.allBeschluesse.length})
                </h3>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {stats.allBeschluesse.map((b, i) => (
                      <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5 shrink-0">&#10003;</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Offene Aufgaben */}
            {stats.allAufgaben.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs">!</span>
                  Offene Punkte ({stats.allAufgaben.length})
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {stats.allAufgaben.map((a, i) => (
                      <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5 shrink-0">&#9679;</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {stats.allBeschluesse.length === 0 && stats.allAufgaben.length === 0 && (
              <p className="text-sm text-gray-500 italic">Noch keine Beschlüsse oder offene Punkte.</p>
            )}
          </div>
        </div>

        {/* Verlauf / Historie */}
        <div>
          <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Verlauf
          </h2>
          <div className="relative">
            {/* Vertikale Timeline-Linie */}
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-6">
              {eintraegeReversed.map((eintrag, idx) => (
                <div key={idx} className="relative flex gap-4">
                  {/* Timeline-Punkt */}
                  <div className="relative z-10 shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      idx === 0 ? "bg-blue-600" : "bg-gray-400"
                    }`}>
                      S{eintrag.sitzungNr}
                    </div>
                  </div>

                  {/* Inhalt */}
                  <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden pb-1">
                    <div className={`px-5 py-3 border-b ${idx === 0 ? "bg-blue-50 border-blue-100" : "bg-gray-50 border-gray-100"}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-gray-500">
                          {eintrag.datum} — Sitzung {eintrag.sitzungNr}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase">Aktuellster</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm mt-0.5">{eintrag.themenTitel}</h3>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      <p className="text-sm text-gray-700 leading-relaxed">{eintrag.inhalt}</p>

                      {eintrag.beschluesse && eintrag.beschluesse.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <div className="text-xs font-bold text-emerald-700 uppercase mb-1">Beschlüsse</div>
                          <ul className="space-y-1">
                            {eintrag.beschluesse.map((b, j) => (
                              <li key={j} className="text-sm text-emerald-800 flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 shrink-0">&#10003;</span>{b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {eintrag.aufgaben && eintrag.aufgaben.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="text-xs font-bold text-amber-700 uppercase mb-1">Aufgaben</div>
                          <ul className="space-y-1">
                            {eintrag.aufgaben.map((a, j) => (
                              <li key={j} className="text-sm text-amber-800 flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5 shrink-0">&#9679;</span>{a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: Schnellnavigation zu anderen Bereichen */}
        <div className="lg:hidden mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Weitere Bereiche</h3>
          <div className="flex flex-wrap gap-2">
            {BEREICHE.filter(b => b.id !== bereich.id).map(b => (
              <button
                key={b.id}
                onClick={() => onSelect(b.id)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <span>{b.icon}</span>
                <span>{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

// --- Hauptkomponente ---

export default function ProtokollePage() {
  const [view, setView] = useState<'grid' | 'detail'>('grid')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setView('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setView('grid')
    setSelectedId(null)
  }

  const selectedBereich = BEREICHE.find(b => b.id === selectedId)

  if (view === 'detail' && selectedBereich) {
    return (
      <DetailView
        bereich={selectedBereich}
        onSelect={handleSelect}
        onBack={handleBack}
      />
    )
  }

  return <GridView onSelect={handleSelect} />
}
