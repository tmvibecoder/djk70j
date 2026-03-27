'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, Button, Input, Select, Modal, Badge } from '@/components/ui'
import { ALL_DAYS, ALL_DAY_LABELS, EVENT_DAYS, EVENT_DAY_LABELS, USER_ROLES, USER_ROLE_LABELS } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

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
  _count?: { shifts: number }
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

interface Team {
  id: string
  name: string
  eventDay: string
  participants: Participant[]
}

interface Participant {
  id: string
  name: string
  phone: string | null
  email: string | null
  eventDay: string
  paid: boolean
  teamId: string | null
  team: Team | null
}

type TabId = 'helfer' | 'teilnehmer' | 'stationen'

const TABS: { id: TabId; label: string }[] = [
  { id: 'helfer', label: 'Helfer & Schichten' },
  { id: 'teilnehmer', label: 'Teilnehmer & Turnier' },
  { id: 'stationen', label: 'Stationen' },
]

const SHORT_DAY_LABELS: Record<string, string> = {
  monday: 'Mo 06.07.',
  tuesday: 'Di 07.07.',
  thursday: 'Do 09.07.',
  friday: 'Fr 10.07.',
  saturday: 'Sa 11.07.',
  sunday: 'So 12.07.',
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<TabId>('helfer')

  // Shared data
  const [users, setUsers] = useState<User[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  // Day selectors
  const [helferDay, setHelferDay] = useState<string>('thursday')
  const [teilnehmerDay, setTeilnehmerDay] = useState<string>('thursday')

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isStationModalOpen, setIsStationModalOpen] = useState(false)
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false)
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false)
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)

  // Editing state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingStation, setEditingStation] = useState<Station | null>(null)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

  // Forms
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'helper' })
  const [stationForm, setStationForm] = useState({ name: '', description: '' })
  const [shiftForm, setShiftForm] = useState({
    stationId: '',
    eventDay: 'thursday',
    startTime: '18:00',
    endTime: '22:00',
    requiredHelpers: '2',
  })
  const [participantForm, setParticipantForm] = useState({
    name: '',
    phone: '',
    email: '',
    eventDay: 'thursday',
    paid: false,
    teamId: '',
  })
  const [teamForm, setTeamForm] = useState({
    name: '',
    eventDay: 'thursday',
  })

  // ─── Data Loading ────────────────────────────────────────────────────────

  const loadHelferData = useCallback(async () => {
    const [usersRes, stationsRes, shiftsRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/stations'),
      fetch(`/api/shifts?eventDay=${helferDay}`),
    ])
    setUsers(await usersRes.json())
    setStations(await stationsRes.json())
    setShifts(await shiftsRes.json())
    setLoading(false)
  }, [helferDay])

  const loadTeilnehmerData = useCallback(async () => {
    const [participantsRes, teamsRes] = await Promise.all([
      fetch(`/api/participants?eventDay=${teilnehmerDay}`),
      fetch(`/api/teams?eventDay=${teilnehmerDay}`),
    ])
    setParticipants(await participantsRes.json())
    setTeams(await teamsRes.json())
  }, [teilnehmerDay])

  const loadStationData = useCallback(async () => {
    const stationsRes = await fetch('/api/stations')
    setStations(await stationsRes.json())
  }, [])

  useEffect(() => {
    loadHelferData()
  }, [loadHelferData])

  useEffect(() => {
    if (activeTab === 'teilnehmer') {
      loadTeilnehmerData()
    }
  }, [activeTab, loadTeilnehmerData])

  useEffect(() => {
    if (activeTab === 'stationen') {
      loadStationData()
    }
  }, [activeTab, loadStationData])

  // ─── User CRUD ───────────────────────────────────────────────────────────

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
    loadHelferData()
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Helfer wirklich löschen?')) return
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    loadHelferData()
  }

  // ─── Station CRUD ────────────────────────────────────────────────────────

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
    loadHelferData()
    loadStationData()
  }

  const deleteStation = async (id: string) => {
    if (!confirm('Station wirklich löschen?')) return
    await fetch(`/api/stations/${id}`, { method: 'DELETE' })
    loadHelferData()
    loadStationData()
  }

  // ─── Shift CRUD ──────────────────────────────────────────────────────────

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
        eventDay: helferDay,
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
    loadHelferData()
  }

  const deleteShift = async (id: string) => {
    if (!confirm('Schicht wirklich löschen?')) return
    await fetch(`/api/shifts/${id}`, { method: 'DELETE' })
    loadHelferData()
  }

  // ─── Assignment ──────────────────────────────────────────────────────────

  const assignHelper = async (shiftId: string, userId: string) => {
    await fetch(`/api/shifts/${shiftId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    loadHelferData()
  }

  const unassignHelper = async (shiftId: string, userId: string) => {
    await fetch(`/api/shifts/${shiftId}/assign`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    loadHelferData()
  }

  // ─── Participant CRUD ────────────────────────────────────────────────────

  const openParticipantModal = (participant?: Participant) => {
    if (participant) {
      setEditingParticipant(participant)
      setParticipantForm({
        name: participant.name,
        phone: participant.phone || '',
        email: participant.email || '',
        eventDay: participant.eventDay,
        paid: participant.paid,
        teamId: participant.teamId || '',
      })
    } else {
      setEditingParticipant(null)
      setParticipantForm({
        name: '',
        phone: '',
        email: '',
        eventDay: teilnehmerDay,
        paid: false,
        teamId: '',
      })
    }
    setIsParticipantModalOpen(true)
  }

  const handleParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingParticipant ? `/api/participants/${editingParticipant.id}` : '/api/participants'
    const method = editingParticipant ? 'PUT' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(participantForm),
    })
    setIsParticipantModalOpen(false)
    loadTeilnehmerData()
  }

  const deleteParticipant = async (id: string) => {
    if (!confirm('Teilnehmer wirklich löschen?')) return
    await fetch(`/api/participants/${id}`, { method: 'DELETE' })
    loadTeilnehmerData()
  }

  const togglePaid = async (participant: Participant) => {
    await fetch(`/api/participants/${participant.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...participant, paid: !participant.paid }),
    })
    loadTeilnehmerData()
  }

  // ─── Team CRUD ───────────────────────────────────────────────────────────

  const openTeamModal = (team?: Team) => {
    if (team) {
      setEditingTeam(team)
      setTeamForm({ name: team.name, eventDay: team.eventDay })
    } else {
      setEditingTeam(null)
      setTeamForm({ name: '', eventDay: teilnehmerDay })
    }
    setIsTeamModalOpen(true)
  }

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingTeam ? `/api/teams/${editingTeam.id}` : '/api/teams'
    const method = editingTeam ? 'PUT' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamForm),
    })
    setIsTeamModalOpen(false)
    loadTeilnehmerData()
  }

  const deleteTeam = async (id: string) => {
    if (!confirm('Team wirklich löschen? Die Teilnehmer bleiben erhalten.')) return
    await fetch(`/api/teams/${id}`, { method: 'DELETE' })
    loadTeilnehmerData()
  }

  // ─── Derived Data ────────────────────────────────────────────────────────

  const shiftsByStation = shifts.reduce((acc, shift) => {
    if (!acc[shift.stationId]) acc[shift.stationId] = []
    acc[shift.stationId].push(shift)
    return acc
  }, {} as Record<string, Shift[]>)

  const paidCount = participants.filter((p) => p.paid).length
  const unpaidCount = participants.filter((p) => !p.paid).length
  const unassignedParticipants = participants.filter((p) => !p.teamId)

  // Count shifts per station (across all days) for stations tab
  const shiftCountByStation = shifts.reduce((acc, shift) => {
    acc[shift.stationId] = (acc[shift.stationId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // ─── Loading State ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Laden...</div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Dark header with tabs */}
      <div className="bg-gray-900 -mx-4 -mt-6 px-4 pt-6 pb-0 mb-6 rounded-b-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
            <h1 className="text-2xl font-bold text-white">Team-Verwaltung</h1>
            <p className="text-gray-400 text-sm">Helfer, Schichten, Teilnehmer & Stationen</p>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'bg-white text-gray-900'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Helfer & Schichten */}
      {activeTab === 'helfer' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Helfer & Schichten</h2>
              <p className="text-gray-600">Schichten planen und Helfer zuweisen</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => openUserModal()}>+ Helfer</Button>
              <Button variant="secondary" onClick={() => openStationModal()}>+ Station</Button>
              <Button onClick={() => openShiftModal()}>+ Schicht</Button>
            </div>
          </div>

          {/* Day selector - ALL days */}
          <Card>
            <CardContent className="py-4">
              <div className="flex gap-2 flex-wrap">
                {ALL_DAYS.map((day) => (
                  <Button
                    key={day}
                    variant={helferDay === day ? 'primary' : 'secondary'}
                    onClick={() => setHelferDay(day)}
                  >
                    {SHORT_DAY_LABELS[day]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shift grid */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Schichten - {ALL_DAY_LABELS[helferDay as keyof typeof ALL_DAY_LABELS]}
              </h3>

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
                            const filled = shift.assignments.length
                            const required = shift.requiredHelpers
                            const isFull = filled >= required
                            const isEmpty = filled === 0
                            const statusColor = isFull
                              ? 'bg-green-50 border-green-200'
                              : isEmpty
                              ? 'bg-red-50 border-red-200'
                              : 'bg-yellow-50 border-yellow-200'
                            const badgeVariant = isFull ? 'success' : isEmpty ? 'danger' : 'warning'
                            const availableUsers = users.filter(
                              (u) => !shift.assignments.find((a) => a.user.id === u.id)
                            )
                            return (
                              <div key={shift.id} className={`border rounded-lg p-3 ${statusColor}`}>
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className="font-medium">
                                      {shift.startTime} - {shift.endTime}
                                    </span>
                                    <Badge variant={badgeVariant} className="ml-2">
                                      {filled}/{required} Helfer
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
                                        className="text-blue-600 hover:text-blue-800 ml-1"
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

            {/* Helper list on the right */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Helfer</h3>
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
                            <p className="text-sm text-gray-500">
                              {USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS]}
                            </p>
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
        </div>
      )}

      {/* Tab 2: Teilnehmer & Turnier */}
      {activeTab === 'teilnehmer' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Teilnehmer-Verwaltung</h2>
              <p className="text-gray-600">Watt-Turnier und Event-Teilnehmer</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => openTeamModal()}>+ Team</Button>
              <Button onClick={() => openParticipantModal()}>+ Teilnehmer</Button>
            </div>
          </div>

          {/* Day selector */}
          <Card>
            <CardContent className="py-4">
              <div className="flex gap-2">
                {EVENT_DAYS.map((day) => (
                  <Button
                    key={day}
                    variant={teilnehmerDay === day ? 'primary' : 'secondary'}
                    onClick={() => setTeilnehmerDay(day)}
                  >
                    {EVENT_DAY_LABELS[day]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{participants.length}</p>
                  <p className="text-sm text-gray-500">Teilnehmer gesamt</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{paidCount}</p>
                  <p className="text-sm text-gray-500">Bezahlt</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{unpaidCount}</p>
                  <p className="text-sm text-gray-500">Offen</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{teams.length}</p>
                  <p className="text-sm text-gray-500">Teams</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Teams */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Teams</h3>
              <div className="space-y-4">
                {teams.map((team) => (
                  <Card key={team.id}>
                    <CardHeader className="flex flex-row justify-between items-center py-3">
                      <h3 className="font-semibold text-gray-900">{team.name}</h3>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openTeamModal(team)}>
                          Bearbeiten
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTeam(team.id)} className="text-red-600">
                          Löschen
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {team.participants.length === 0 ? (
                        <p className="text-gray-500 text-sm">Noch keine Mitglieder</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {team.participants.map((p) => (
                            <Badge key={p.id} variant={p.paid ? 'success' : 'warning'}>
                              {p.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {teams.length === 0 && (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      Noch keine Teams vorhanden
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Unassigned participants */}
              {unassignedParticipants.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">Ohne Team</h3>
                  <Card>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {unassignedParticipants.map((p) => (
                          <Badge key={p.id} variant={p.paid ? 'success' : 'warning'}>
                            {p.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Participant list */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alle Teilnehmer</h3>
              <Card>
                <CardContent className="p-0">
                  {participants.length === 0 ? (
                    <p className="p-4 text-gray-500 text-center">Noch keine Teilnehmer</p>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Bezahlt</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {participants.map((participant) => (
                          <tr key={participant.id}>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900">{participant.name}</p>
                                {participant.phone && (
                                  <p className="text-sm text-gray-500">{participant.phone}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {participant.team?.name || '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => togglePaid(participant)}>
                                <Badge variant={participant.paid ? 'success' : 'danger'}>
                                  {participant.paid ? 'Bezahlt' : 'Offen'}
                                </Badge>
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm" onClick={() => openParticipantModal(participant)}>
                                Bearbeiten
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteParticipant(participant.id)} className="text-red-600">
                                ×
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Stationen */}
      {activeTab === 'stationen' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Stationen</h2>
              <p className="text-gray-600">Alle Stationen und ihre Schichten verwalten</p>
            </div>
            <Button onClick={() => openStationModal()}>+ Station</Button>
          </div>

          {stations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Noch keine Stationen vorhanden. Erstelle die erste Station!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stations.map((station) => {
                const count = station._count?.shifts ?? shiftCountByStation[station.id] ?? 0
                return (
                  <Card key={station.id}>
                    <CardHeader className="flex flex-row justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{station.name}</h3>
                        {station.description && (
                          <p className="text-sm text-gray-500 mt-1">{station.description}</p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">
                            {count} {count === 1 ? 'Schicht' : 'Schichten'}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openStationModal(station)}>
                            Bearbeiten
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteStation(station.id)} className="text-red-600">
                            Löschen
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Modals ──────────────────────────────────────────────────────────── */}

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
            options={ALL_DAYS.map((day) => ({ value: day, label: ALL_DAY_LABELS[day] }))}
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

      {/* Participant Modal */}
      <Modal isOpen={isParticipantModalOpen} onClose={() => setIsParticipantModalOpen(false)} title={editingParticipant ? 'Teilnehmer bearbeiten' : 'Neuer Teilnehmer'}>
        <form onSubmit={handleParticipantSubmit} className="space-y-4">
          <Input
            label="Name"
            value={participantForm.name}
            onChange={(e) => setParticipantForm({ ...participantForm, name: e.target.value })}
            required
          />
          <Input
            label="Telefon (optional)"
            value={participantForm.phone}
            onChange={(e) => setParticipantForm({ ...participantForm, phone: e.target.value })}
          />
          <Input
            label="E-Mail (optional)"
            type="email"
            value={participantForm.email}
            onChange={(e) => setParticipantForm({ ...participantForm, email: e.target.value })}
          />
          <Select
            label="Tag"
            value={participantForm.eventDay}
            onChange={(e) => setParticipantForm({ ...participantForm, eventDay: e.target.value })}
            options={EVENT_DAYS.map((day) => ({ value: day, label: EVENT_DAY_LABELS[day] }))}
          />
          <Select
            label="Team (optional)"
            value={participantForm.teamId}
            onChange={(e) => setParticipantForm({ ...participantForm, teamId: e.target.value })}
            options={[
              { value: '', label: 'Kein Team' },
              ...teams.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="paid"
              checked={participantForm.paid}
              onChange={(e) => setParticipantForm({ ...participantForm, paid: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="paid" className="text-sm text-gray-700">Startgebühr bezahlt</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsParticipantModalOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit">{editingParticipant ? 'Speichern' : 'Erstellen'}</Button>
          </div>
        </form>
      </Modal>

      {/* Team Modal */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title={editingTeam ? 'Team bearbeiten' : 'Neues Team'}>
        <form onSubmit={handleTeamSubmit} className="space-y-4">
          <Input
            label="Teamname"
            value={teamForm.name}
            onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
            placeholder="z.B. Team Müller"
            required
          />
          <Select
            label="Tag"
            value={teamForm.eventDay}
            onChange={(e) => setTeamForm({ ...teamForm, eventDay: e.target.value })}
            options={EVENT_DAYS.map((day) => ({ value: day, label: EVENT_DAY_LABELS[day] }))}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsTeamModalOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit">{editingTeam ? 'Speichern' : 'Erstellen'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
