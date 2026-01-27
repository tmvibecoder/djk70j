'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, Button, Input, Select, Modal, Badge } from '@/components/ui'
import { EVENT_DAYS, EVENT_DAY_LABELS, USER_ROLES, USER_ROLE_LABELS } from '@/types'

interface User {
  id: string
  name: string
  email: string | null
  role: string
}

interface Station {
  id: string
  name: string
  description: string | null
}

interface Shift {
  id: string
  stationId: string
  station: Station
  eventDay: string
  startTime: string
  endTime: string
  requiredHelpers: number
  assignments: { id: string; user: User }[]
}

export default function HelferPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>('thursday')

  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isStationModalOpen, setIsStationModalOpen] = useState(false)
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingStation, setEditingStation] = useState<Station | null>(null)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)

  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'helper' })
  const [stationForm, setStationForm] = useState({ name: '', description: '' })
  const [shiftForm, setShiftForm] = useState({
    stationId: '',
    eventDay: 'thursday',
    startTime: '18:00',
    endTime: '22:00',
    requiredHelpers: '2',
  })

  useEffect(() => {
    loadData()
  }, [selectedDay])

  const loadData = async () => {
    const [usersRes, stationsRes, shiftsRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/stations'),
      fetch(`/api/shifts?eventDay=${selectedDay}`),
    ])

    setUsers(await usersRes.json())
    setStations(await stationsRes.json())
    setShifts(await shiftsRes.json())
    setLoading(false)
  }

  // User CRUD
  const openUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setUserForm({ name: user.name, email: user.email || '', role: user.role })
    } else {
      setEditingUser(null)
      setUserForm({ name: '', email: '', role: 'helper' })
    }
    setIsUserModalOpen(true)
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
    const method = editingUser ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userForm),
    })

    setIsUserModalOpen(false)
    loadData()
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Helfer wirklich löschen?')) return
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    loadData()
  }

  // Station CRUD
  const openStationModal = (station?: Station) => {
    if (station) {
      setEditingStation(station)
      setStationForm({ name: station.name, description: station.description || '' })
    } else {
      setEditingStation(null)
      setStationForm({ name: '', description: '' })
    }
    setIsStationModalOpen(true)
  }

  const handleStationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingStation ? `/api/stations/${editingStation.id}` : '/api/stations'
    const method = editingStation ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stationForm),
    })

    setIsStationModalOpen(false)
    loadData()
  }

  const deleteStation = async (id: string) => {
    if (!confirm('Station wirklich löschen?')) return
    await fetch(`/api/stations/${id}`, { method: 'DELETE' })
    loadData()
  }

  // Shift CRUD
  const openShiftModal = (shift?: Shift) => {
    if (shift) {
      setEditingShift(shift)
      setShiftForm({
        stationId: shift.stationId,
        eventDay: shift.eventDay,
        startTime: shift.startTime,
        endTime: shift.endTime,
        requiredHelpers: shift.requiredHelpers.toString(),
      })
    } else {
      setEditingShift(null)
      setShiftForm({
        stationId: stations[0]?.id || '',
        eventDay: selectedDay,
        startTime: '18:00',
        endTime: '22:00',
        requiredHelpers: '2',
      })
    }
    setIsShiftModalOpen(true)
  }

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts'
    const method = editingShift ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shiftForm),
    })

    setIsShiftModalOpen(false)
    loadData()
  }

  const deleteShift = async (id: string) => {
    if (!confirm('Schicht wirklich löschen?')) return
    await fetch(`/api/shifts/${id}`, { method: 'DELETE' })
    loadData()
  }

  // Zuweisung
  const assignHelper = async (shiftId: string, userId: string) => {
    await fetch(`/api/shifts/${shiftId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    loadData()
  }

  const unassignHelper = async (shiftId: string, userId: string) => {
    await fetch(`/api/shifts/${shiftId}/assign`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
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

  const shiftsByStation = shifts.reduce((acc, shift) => {
    if (!acc[shift.stationId]) acc[shift.stationId] = []
    acc[shift.stationId].push(shift)
    return acc
  }, {} as Record<string, Shift[]>)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Helfer-Planung</h1>
          <p className="text-gray-600">Schichten und Helfer verwalten</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openUserModal()}>+ Helfer</Button>
          <Button variant="secondary" onClick={() => openStationModal()}>+ Station</Button>
          <Button onClick={() => openShiftModal()}>+ Schicht</Button>
        </div>
      </div>

      {/* Tages-Auswahl */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-2">
            {EVENT_DAYS.map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? 'primary' : 'secondary'}
                onClick={() => setSelectedDay(day)}
              >
                {EVENT_DAY_LABELS[day]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schichten */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Schichten - {EVENT_DAY_LABELS[selectedDay as keyof typeof EVENT_DAY_LABELS]}</h2>

          {stations.map((station) => {
            const stationShifts = shiftsByStation[station.id] || []
            return (
              <Card key={station.id}>
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">{station.name}</h3>
                    {station.description && (
                      <p className="text-sm text-gray-500">{station.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openStationModal(station)}>
                      Bearbeiten
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteStation(station.id)} className="text-red-600">
                      Löschen
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {stationShifts.length === 0 ? (
                    <p className="text-gray-500 text-sm">Keine Schichten für diesen Tag</p>
                  ) : (
                    <div className="space-y-3">
                      {stationShifts.map((shift) => {
                        const isFull = shift.assignments.length >= shift.requiredHelpers
                        const availableUsers = users.filter(
                          (u) => !shift.assignments.find((a) => a.user.id === u.id)
                        )
                        return (
                          <div key={shift.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-medium">{shift.startTime} - {shift.endTime}</span>
                                <Badge variant={isFull ? 'success' : 'warning'} className="ml-2">
                                  {shift.assignments.length}/{shift.requiredHelpers} Helfer
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openShiftModal(shift)}>
                                  Bearbeiten
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteShift(shift.id)} className="text-red-600">
                                  Löschen
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {shift.assignments.map((assignment) => (
                                <span
                                  key={assignment.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                                >
                                  {assignment.user.name}
                                  <button
                                    onClick={() => unassignHelper(shift.id, assignment.user.id)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            {!isFull && availableUsers.length > 0 && (
                              <Select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) assignHelper(shift.id, e.target.value)
                                }}
                                options={[
                                  { value: '', label: 'Helfer hinzufügen...' },
                                  ...availableUsers.map((u) => ({ value: u.id, label: u.name })),
                                ]}
                                className="w-48"
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {stations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Noch keine Stationen vorhanden. Erstelle zuerst eine Station!
              </CardContent>
            </Card>
          )}
        </div>

        {/* Helfer-Liste */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Helfer</h2>
          <Card>
            <CardContent className="p-0">
              {users.length === 0 ? (
                <p className="p-4 text-gray-500 text-sm">Noch keine Helfer vorhanden</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <li key={user.id} className="px-4 py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS]}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openUserModal(user)}>
                          Bearbeiten
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteUser(user.id)} className="text-red-600">
                          ×
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Modal */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingUser ? 'Helfer bearbeiten' : 'Neuer Helfer'}>
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <Input
            label="Name"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            required
          />
          <Input
            label="E-Mail (optional)"
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
          />
          <Select
            label="Rolle"
            value={userForm.role}
            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            options={USER_ROLES.map((role) => ({ value: role, label: USER_ROLE_LABELS[role] }))}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsUserModalOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit">{editingUser ? 'Speichern' : 'Erstellen'}</Button>
          </div>
        </form>
      </Modal>

      {/* Station Modal */}
      <Modal isOpen={isStationModalOpen} onClose={() => setIsStationModalOpen(false)} title={editingStation ? 'Station bearbeiten' : 'Neue Station'}>
        <form onSubmit={handleStationSubmit} className="space-y-4">
          <Input
            label="Name"
            value={stationForm.name}
            onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
            placeholder="z.B. Bar, Kasse, Eingang"
            required
          />
          <Input
            label="Beschreibung (optional)"
            value={stationForm.description}
            onChange={(e) => setStationForm({ ...stationForm, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsStationModalOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit">{editingStation ? 'Speichern' : 'Erstellen'}</Button>
          </div>
        </form>
      </Modal>

      {/* Shift Modal */}
      <Modal isOpen={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} title={editingShift ? 'Schicht bearbeiten' : 'Neue Schicht'}>
        <form onSubmit={handleShiftSubmit} className="space-y-4">
          <Select
            label="Station"
            value={shiftForm.stationId}
            onChange={(e) => setShiftForm({ ...shiftForm, stationId: e.target.value })}
            options={stations.map((s) => ({ value: s.id, label: s.name }))}
            required
          />
          <Select
            label="Tag"
            value={shiftForm.eventDay}
            onChange={(e) => setShiftForm({ ...shiftForm, eventDay: e.target.value })}
            options={EVENT_DAYS.map((day) => ({ value: day, label: EVENT_DAY_LABELS[day] }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Beginn"
              type="time"
              value={shiftForm.startTime}
              onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
              required
            />
            <Input
              label="Ende"
              type="time"
              value={shiftForm.endTime}
              onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
              required
            />
          </div>
          <Input
            label="Benötigte Helfer"
            type="number"
            min="1"
            value={shiftForm.requiredHelpers}
            onChange={(e) => setShiftForm({ ...shiftForm, requiredHelpers: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsShiftModalOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit">{editingShift ? 'Speichern' : 'Erstellen'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
