'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, Button, Input, Select, Modal, Badge } from '@/components/ui'
import { EVENT_DAYS, EVENT_DAY_LABELS } from '@/types'

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

export default function TeilnehmerPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>('thursday')

  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false)
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

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

  useEffect(() => {
    loadData()
  }, [selectedDay])

  const loadData = async () => {
    const [participantsRes, teamsRes] = await Promise.all([
      fetch(`/api/participants?eventDay=${selectedDay}`),
      fetch(`/api/teams?eventDay=${selectedDay}`),
    ])

    setParticipants(await participantsRes.json())
    setTeams(await teamsRes.json())
    setLoading(false)
  }

  // Participant CRUD
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
        eventDay: selectedDay,
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
    loadData()
  }

  const deleteParticipant = async (id: string) => {
    if (!confirm('Teilnehmer wirklich löschen?')) return
    await fetch(`/api/participants/${id}`, { method: 'DELETE' })
    loadData()
  }

  const togglePaid = async (participant: Participant) => {
    await fetch(`/api/participants/${participant.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...participant, paid: !participant.paid }),
    })
    loadData()
  }

  // Team CRUD
  const openTeamModal = (team?: Team) => {
    if (team) {
      setEditingTeam(team)
      setTeamForm({ name: team.name, eventDay: team.eventDay })
    } else {
      setEditingTeam(null)
      setTeamForm({ name: '', eventDay: selectedDay })
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
    loadData()
  }

  const deleteTeam = async (id: string) => {
    if (!confirm('Team wirklich löschen? Die Teilnehmer bleiben erhalten.')) return
    await fetch(`/api/teams/${id}`, { method: 'DELETE' })
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Laden...</div>
      </div>
    )
  }

  const paidCount = participants.filter((p) => p.paid).length
  const unpaidCount = participants.filter((p) => !p.paid).length
  const unassignedParticipants = participants.filter((p) => !p.teamId)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teilnehmer-Verwaltung</h1>
          <p className="text-gray-600">Watt-Turnier und Event-Teilnehmer</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openTeamModal()}>+ Team</Button>
          <Button onClick={() => openParticipantModal()}>+ Teilnehmer</Button>
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

      {/* Statistiken */}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Teams</h2>
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

          {/* Nicht zugewiesene Teilnehmer */}
          {unassignedParticipants.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-4">Ohne Team</h2>
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

        {/* Teilnehmerliste */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alle Teilnehmer</h2>
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
                              {participant.paid ? '✓ Bezahlt' : '✗ Offen'}
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
