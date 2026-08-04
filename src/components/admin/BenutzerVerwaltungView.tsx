'use client'

import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardContent, Input, Modal, Select } from '@/components/ui'
import { BEREICHE, BEREICH_LABELS, BEREICHSROLLEN, ROLLE_LABELS, Bereich, BereichsRolle } from '@/lib/bereiche'

interface BenutzerDto {
  id: string
  name: string
  username: string
  istAdmin: boolean
  aktiv: boolean
  rollen: Partial<Record<Bereich, BereichsRolle>>
}

const ROLLE_OPTIONEN = [
  { value: '', label: 'Kein Zugriff' },
  ...BEREICHSROLLEN.map(r => ({ value: r, label: ROLLE_LABELS[r] })),
]

export function BenutzerVerwaltungView() {
  const [nutzer, setNutzer] = useState<BenutzerDto[] | null>(null)
  const [neuOffen, setNeuOffen] = useState(false)
  const [bearbeiten, setBearbeiten] = useState<BenutzerDto | null>(null)

  const laden = () => {
    fetch('/api/admin/benutzer')
      .then(r => r.json())
      .then(setNutzer)
      .catch(() => setNutzer([]))
  }

  useEffect(laden, [])

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Adminbereich</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Benutzer anlegen, Passwörter vergeben, Rollen und Zugriffe steuern
          </p>
        </div>
        <Button onClick={() => setNeuOffen(true)}>+ Neuer Benutzer</Button>
      </div>

      {nutzer === null ? (
        <p className="text-sm text-gray-500">Lädt …</p>
      ) : nutzer.length === 0 ? (
        <p className="text-sm text-gray-500">Noch keine Benutzer angelegt.</p>
      ) : (
        <div className="space-y-2">
          {nutzer.map(u => (
            <Card key={u.id}>
              <CardContent className="!py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{u.name}</span>
                    <span className="text-xs text-gray-500">{u.username}</span>
                    {u.istAdmin && <Badge variant="info">Systemverwalter</Badge>}
                    {!u.aktiv && <Badge variant="danger">Deaktiviert</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {BEREICHE.map(bereich => {
                      const rolle = u.rollen[bereich]
                      if (!rolle) return null
                      return (
                        <Badge key={bereich} variant="default">
                          {BEREICH_LABELS[bereich]}: {ROLLE_LABELS[rolle]}
                        </Badge>
                      )
                    })}
                    {Object.keys(u.rollen).length === 0 && !u.istAdmin && (
                      <span className="text-xs text-gray-400">Keinem Bereich zugewiesen</span>
                    )}
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setBearbeiten(u)}>
                  Bearbeiten
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {neuOffen && (
        <NeuerBenutzerModal
          onClose={() => setNeuOffen(false)}
          onCreated={() => { setNeuOffen(false); laden() }}
        />
      )}
      {bearbeiten && (
        <BenutzerBearbeitenModal
          benutzer={bearbeiten}
          onClose={() => setBearbeiten(null)}
          onSaved={() => { setBearbeiten(null); laden() }}
        />
      )}
    </div>
  )
}

function NeuerBenutzerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [istAdmin, setIstAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const res = await fetch('/api/admin/benutzer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password, istAdmin }),
    })
    setSaving(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'Anlegen fehlgeschlagen')
      return
    }
    onCreated()
  }

  return (
    <Modal isOpen onClose={onClose} title="Neuer Benutzer">
      <form onSubmit={submit} className="space-y-3">
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} required autoFocus />
        <Input label="Benutzername" value={username} onChange={e => setUsername(e.target.value)} required />
        <Input
          label="Start-Passwort"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={istAdmin} onChange={e => setIstAdmin(e.target.checked)} />
          Systemverwalter (voller Zugriff auf alle Bereiche + Benutzerverwaltung)
        </label>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Anlegen…' : 'Anlegen'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function BenutzerBearbeitenModal({
  benutzer,
  onClose,
  onSaved,
}: {
  benutzer: BenutzerDto
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(benutzer.name)
  const [istAdmin, setIstAdmin] = useState(benutzer.istAdmin)
  const [aktiv, setAktiv] = useState(benutzer.aktiv)
  const [rollen, setRollen] = useState<Partial<Record<Bereich, BereichsRolle | ''>>>(() => {
    const init: Partial<Record<Bereich, BereichsRolle | ''>> = {}
    for (const b of BEREICHE) init[b] = benutzer.rollen[b] ?? ''
    return init
  })
  const [neuesPasswort, setNeuesPasswort] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [resetMsg, setResetMsg] = useState<string | null>(null)

  const speichern = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const [r1, r2] = await Promise.all([
      fetch(`/api/admin/benutzer/${benutzer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, istAdmin, aktiv }),
      }),
      fetch(`/api/admin/benutzer/${benutzer.id}/rollen`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          Object.fromEntries(BEREICHE.map(b => [b, rollen[b] || null])),
        ),
      }),
    ])
    setSaving(false)
    if (!r1.ok || !r2.ok) {
      setError('Speichern fehlgeschlagen')
      return
    }
    onSaved()
  }

  const passwortZuruecksetzen = async () => {
    if (neuesPasswort.length < 6) {
      setError('Neues Passwort muss mindestens 6 Zeichen haben')
      return
    }
    setError(null)
    setResetMsg(null)
    const res = await fetch(`/api/admin/benutzer/${benutzer.id}/passwort-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ neuesPasswort }),
    })
    if (!res.ok) {
      setError('Passwort-Reset fehlgeschlagen')
      return
    }
    setNeuesPasswort('')
    setResetMsg('Passwort wurde zurückgesetzt, der Nutzer ist auf allen Geräten abgemeldet.')
  }

  return (
    <Modal isOpen onClose={onClose} title={`Benutzer: ${benutzer.name}`}>
      <form onSubmit={speichern} className="space-y-4">
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} required />
        <p className="text-xs text-gray-500">Benutzername {benutzer.username} kann nicht geändert werden.</p>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {BEREICHE.map(bereich => (
            <Select
              key={bereich}
              label={BEREICH_LABELS[bereich]}
              value={rollen[bereich] || ''}
              onChange={e => setRollen(prev => ({ ...prev, [bereich]: e.target.value as BereichsRolle | '' }))}
              options={ROLLE_OPTIONEN}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={istAdmin} onChange={e => setIstAdmin(e.target.checked)} />
            Systemverwalter (voller Zugriff auf alle Bereiche + Benutzerverwaltung)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={aktiv} onChange={e => setAktiv(e.target.checked)} />
            Konto aktiv (deaktivierte Benutzer können sich nicht mehr anmelden)
          </label>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{error}</div>}

        <div className="flex justify-end gap-2 pt-1 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Speichern…' : 'Speichern'}</Button>
        </div>
      </form>

      <div className="mt-5 pt-4 border-t border-gray-200 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 uppercase">Passwort zurücksetzen</h3>
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Neues Passwort"
            value={neuesPasswort}
            onChange={e => setNeuesPasswort(e.target.value)}
            minLength={6}
            className="flex-1"
          />
          <Button type="button" variant="secondary" onClick={passwortZuruecksetzen}>Zurücksetzen</Button>
        </div>
        {resetMsg && <p className="text-xs text-emerald-700">{resetMsg}</p>}
      </div>
    </Modal>
  )
}
