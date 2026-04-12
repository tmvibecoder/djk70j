'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, Button, Input, Select, Modal, Badge } from '@/components/ui'
import { EVENT_DAYS, EVENT_DAY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS, PRIORITY_LEVELS, PRIORITY_LABELS } from '@/types'

interface User {
  id: string
  name: string
}

interface Task {
  id: string
  title: string
  description: string | null
  assigneeId: string | null
  assignee: User | null
  deadline: string | null
  status: string
  eventDay: string | null
  category: string | null
  priority: string
  createdAt: string
}

const TASK_CATEGORIES = ['Einkauf', 'Aufbau', 'Deko', 'Technik', 'Organisation', 'Sonstiges']

export default function AufgabenPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterDay, setFilterDay] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    deadline: '',
    status: 'offen',
    eventDay: '',
    category: '',
    priority: 'medium',
  })

  useEffect(() => {
    loadData()
  }, [filterStatus, filterDay, filterCategory])

  const loadData = async () => {
    const params = new URLSearchParams()
    if (filterStatus) params.append('status', filterStatus)
    if (filterDay) params.append('eventDay', filterDay)
    if (filterCategory) params.append('category', filterCategory)

    const [tasksRes, usersRes] = await Promise.all([
      fetch(`/api/tasks?${params}`),
      fetch('/api/users'),
    ])

    setTasks(await tasksRes.json())
    setUsers(await usersRes.json())
    setLoading(false)
  }

  const openModal = (task?: Task) => {
    if (task) {
      setEditingTask(task)
      setForm({
        title: task.title,
        description: task.description || '',
        assigneeId: task.assigneeId || '',
        deadline: task.deadline ? task.deadline.split('T')[0] : '',
        status: task.status,
        eventDay: task.eventDay || '',
        category: task.category || '',
        priority: task.priority,
      })
    } else {
      setEditingTask(null)
      setForm({
        title: '',
        description: '',
        assigneeId: '',
        deadline: '',
        status: 'offen',
        eventDay: '',
        category: '',
        priority: 'medium',
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks'
    const method = editingTask ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setIsModalOpen(false)
    loadData()
  }

  const deleteTask = async (id: string) => {
    if (!confirm('Aufgabe wirklich löschen?')) return
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    loadData()
  }

  const updateStatus = async (task: Task, newStatus: string) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status: newStatus }),
    })
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Laden...</div>
      </div>
    )
  }

  const statusVariants: Record<string, 'default' | 'info' | 'success'> = {
    offen: 'default',
    in_arbeit: 'info',
    erledigt: 'success',
  }

  const priorityVariants: Record<string, 'default' | 'warning' | 'danger'> = {
    low: 'default',
    medium: 'warning',
    high: 'danger',
  }

  const groupedTasks = {
    offen: tasks.filter((t) => t.status === 'offen'),
    in_arbeit: tasks.filter((t) => t.status === 'in_arbeit'),
    erledigt: tasks.filter((t) => t.status === 'erledigt'),
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aufgaben</h1>
          <p className="text-gray-600">To-Do-Liste für das Fest</p>
        </div>
        <Button onClick={() => openModal()}>+ Neue Aufgabe</Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4 items-center flex-wrap">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: '', label: 'Alle Status' },
                ...TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] })),
              ]}
              className="w-40"
            />
            <Select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              options={[
                { value: '', label: 'Alle Tage' },
                ...EVENT_DAYS.map((day) => ({ value: day, label: EVENT_DAY_LABELS[day] })),
              ]}
              className="w-40"
            />
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={[
                { value: '', label: 'Alle Kategorien' },
                ...TASK_CATEGORIES.map((c) => ({ value: c, label: c })),
              ]}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Kanban-Style Übersicht */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(['offen', 'in_arbeit', 'erledigt'] as const).map((status) => (
          <div key={status}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{TASK_STATUS_LABELS[status]}</h2>
              <Badge variant={statusVariants[status]}>{groupedTasks[status].length}</Badge>
            </div>
            <div className="space-y-3">
              {groupedTasks[status].map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <Badge variant={priorityVariants[task.priority]} className="text-xs">
                        {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
                      </Badge>
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3 text-xs">
                      {task.eventDay && (
                        <Badge variant="default">
                          {EVENT_DAY_LABELS[task.eventDay as keyof typeof EVENT_DAY_LABELS]}
                        </Badge>
                      )}
                      {task.category && <Badge variant="default">{task.category}</Badge>}
                      {task.deadline && (
                        <Badge variant={new Date(task.deadline) < new Date() && task.status !== 'erledigt' ? 'danger' : 'default'}>
                          Fällig: {new Date(task.deadline).toLocaleDateString('de-DE')}
                        </Badge>
                      )}
                    </div>

                    {task.assignee && (
                      <p className="text-sm text-gray-500 mb-3">
                        Zugewiesen: {task.assignee.name}
                      </p>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <div className="flex gap-1">
                        {status !== 'offen' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(task, status === 'erledigt' ? 'in_arbeit' : 'offen')}
                          >
                            ←
                          </Button>
                        )}
                        {status !== 'erledigt' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(task, status === 'offen' ? 'in_arbeit' : 'erledigt')}
                          >
                            →
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openModal(task)}>
                          Bearbeiten
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)} className="text-red-600">
                          ×
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {groupedTasks[status].length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500 text-sm">
                    Keine Aufgaben
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Titel"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Zugewiesen an"
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              options={[
                { value: '', label: 'Niemand' },
                ...users.map((u) => ({ value: u.id, label: u.name })),
              ]}
            />
            <Input
              label="Deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tag"
              value={form.eventDay}
              onChange={(e) => setForm({ ...form, eventDay: e.target.value })}
              options={[
                { value: '', label: 'Kein Tag' },
                ...EVENT_DAYS.map((day) => ({ value: day, label: EVENT_DAY_LABELS[day] })),
              ]}
            />
            <Select
              label="Kategorie"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={[
                { value: '', label: 'Keine Kategorie' },
                ...TASK_CATEGORIES.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
            />
            <Select
              label="Priorität"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              options={PRIORITY_LEVELS.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit">{editingTask ? 'Speichern' : 'Erstellen'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
