'use client'

import { useState } from "react"

interface Sitzung {
  id: string
  titel: string
  datum: string
  zusammenfassung: string
  teilnehmer: string[]
  inhalt: string[]
}

const SITZUNGEN: Sitzung[] = [
  // Hier werden die Sitzungen eingefügt, sobald du mir die Transkripte gibst.
  // Beispiel-Struktur:
  // {
  //   id: "1",
  //   titel: "Planungssitzung Festzelt",
  //   datum: "15.03.2026",
  //   zusammenfassung: "Besprechung der Zeltaufstellung, Tischordnung und Dekoration.",
  //   teilnehmer: ["Max Mustermann", "Maria Muster"],
  //   inhalt: [
  //     "Max: Wir brauchen 20 Tische...",
  //     "Maria: Die Dekoration sollte...",
  //   ],
  // },
]

export default function ProtokollePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = SITZUNGEN.find(s => s.id === selectedId)

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 -mx-4 -mt-16 lg:-mt-6 px-4 pt-16 lg:pt-6 pb-4 mb-6 rounded-b-lg">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
            <h1 className="text-2xl font-bold text-white">📝 Transkripte & Sitzungen</h1>
          </div>
          <div className="text-sm text-gray-400">
            {SITZUNGEN.length} Sitzung{SITZUNGEN.length !== 1 ? "en" : ""}
          </div>
        </div>
      </div>

      {SITZUNGEN.length === 0 ? (
        <div className="bg-white rounded-lg shadow border p-12 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Noch keine Sitzungen vorhanden</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Hier werden die Gesprächsprotokolle und Transkripte der Planungssitzungen angezeigt – jeweils mit einer Zusammenfassung und den Details.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sitzungsliste */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Alle Sitzungen</h2>
            {SITZUNGEN.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`w-full text-left rounded-lg border p-4 transition-colors ${
                  selectedId === s.id
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-900 text-sm">{s.titel}</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{s.datum}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{s.zusammenfassung}</p>
                {s.teilnehmer.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.teilnehmer.map(t => (
                      <span key={t} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Detail-Ansicht */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-white rounded-lg shadow border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selected.titel}</h2>
                    <p className="text-sm text-gray-500">{selected.datum}</p>
                  </div>
                  {selected.teilnehmer.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selected.teilnehmer.map(t => (
                        <span key={t} className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Zusammenfassung</h3>
                  <p className="text-sm text-blue-900">{selected.zusammenfassung}</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Gesprächsverlauf</h3>
                  <div className="space-y-2">
                    {selected.inhalt.map((zeile, i) => {
                      const colonIdx = zeile.indexOf(":")
                      const hasSpeaker = colonIdx > 0 && colonIdx < 30
                      return (
                        <div key={i} className="border-l-2 border-gray-200 pl-3 py-1">
                          {hasSpeaker ? (
                            <>
                              <span className="font-semibold text-gray-900 text-sm">{zeile.substring(0, colonIdx)}:</span>
                              <span className="text-sm text-gray-700">{zeile.substring(colonIdx + 1)}</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-700">{zeile}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow border p-12 text-center text-gray-400">
                <div className="text-4xl mb-3">👈</div>
                <p className="text-sm">Wähle eine Sitzung aus der Liste aus</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
