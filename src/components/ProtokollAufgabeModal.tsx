'use client'

import { useEffect, useState } from 'react'
import type { BereichDTO, PersonDTO, TaskDTO } from '@/types/protokolle'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  task: TaskDTO | null      // null = neu anlegen
  bereiche: BereichDTO[]
  personen: PersonDTO[]
  defaultBereichId?: string // für „+ Neue Aufgabe" pro Bereich
  onDelete?: (task: TaskDTO) => void
}

export default function ProtokollAufgabeModal({
  open,
  onClose,
  onSaved,
  task,
  bereiche,
  personen,
  defaultBereichId,
  onDelete,
}: Props) {
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [status, setStatus] = useState('offen')
  const [bereichId, setBereichId] = useState('')
  const [personIds, setPersonIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (task) {
      setTitle(task.title)
      setDetail(task.detail || '')
      setStatus(task.status)
      setBereichId(task.bereichId || '')
      // Catchall ("Nicht zugewiesen") nicht ins Form uebernehmen — sonst wird
      // sie beim Speichern wieder gesetzt und die Aufgabe gilt als zugewiesen.
      setPersonIds(task.assignments.filter(a => !a.person.isCatchAll).map(a => a.personId))
    } else {
      setTitle('')
      setDetail('')
      setStatus('offen')
      setBereichId(defaultBereichId || bereiche[0]?.id || '')
      setPersonIds([])
    }
  }, [open, task, defaultBereichId, bereiche])

  if (!open) return null

  const togglePerson = (id: string) => {
    setPersonIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    const url = task ? `/api/tasks/${task.id}` : '/api/tasks'
    const method = task ? 'PUT' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        detail: detail.trim() || null,
        status,
        bereichId: bereichId || null,
        personIds,
        priority: task?.priority || 'medium',
      }),
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">
            {task ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Titel */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Was ist zu tun?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {/* Bereich */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Bereich</label>
            <select
              value={bereichId}
              onChange={e => setBereichId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">— Kein Bereich —</option>
              {bereiche.map(b => (
                <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Status</label>
            <div className="flex gap-2">
              {(['offen', 'in_arbeit', 'erledigt'] as const).map(s => {
                const labels = { offen: 'Offen', in_arbeit: 'In Arbeit', erledigt: 'Erledigt' }
                const colors = {
                  offen: 'bg-red-100 text-red-700 border-red-200',
                  in_arbeit: 'bg-amber-100 text-amber-700 border-amber-200',
                  erledigt: 'bg-green-100 text-green-700 border-green-200',
                }
                const isActive = status === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      isActive ? colors[s] + ' ring-2 ring-offset-1 ring-indigo-500' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {labels[s]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Personen */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Verantwortliche Personen
            </label>
            <div className="flex flex-wrap gap-2">
              {personen.filter(p => !p.isCatchAll).map(p => {
                const active = personIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePerson(p.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className="inline-flex items-center justify-center rounded-full font-bold text-[10px] text-white"
                      style={{
                        width: 20,
                        height: 20,
                        background: active ? 'rgba(255,255,255,0.25)' : p.color,
                      }}
                    >
                      {p.initials}
                    </span>
                    {p.name}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Mehrfach-Auswahl möglich. Wenn niemand ausgewählt ist, landet die Aufgabe automatisch unter {'„Nicht zugewiesen"'}.
            </p>
          </div>

          {/* Detail */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Detail / Notiz</label>
            <textarea
              value={detail}
              onChange={e => setDetail(e.target.value)}
              rows={3}
              placeholder="Optionale Beschreibung, Stand, offene Fragen…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex gap-2 items-center">
          {task && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(task)
                onClose()
              }}
              className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg"
            >
              Löschen
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Speichern…' : task ? 'Speichern' : 'Anlegen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
