// Startzustand für das DJK Sommerfest 2027: Standard-Bereiche (Struktur wie
// beim Jubiläum, ohne Aufgaben/Beschlüsse) + Catch-All-Person „Nicht zugewiesen".
// Ohne diesen Grundstock wäre die Festplanung unbenutzbar (die UI kennt keine
// Anlege-Funktion für Bereiche, und Aufgaben ohne Bereich sind unsichtbar).
//
// Idempotent: Existiert bereits ein Bereich mit dieser eventId, passiert nichts —
// dadurch kann das Skript gefahrlos bei jedem Deploy laufen.
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import { BEREICHE } from '../src/data/protokolle'

const prisma = new PrismaClient()
const EVENT_ID = 'sommerfest-2027'

async function main() {
  const vorhanden = await prisma.bereich.count({ where: { eventId: EVENT_ID } })
  if (vorhanden > 0) {
    console.log(`Sommerfest-2027-Seed: ${vorhanden} Bereiche vorhanden — nichts zu tun.`)
    return
  }

  await prisma.person.create({
    data: {
      eventId: EVENT_ID,
      name: 'Nicht zugewiesen',
      initials: 'NZ',
      color: '#6b7280',
      ordering: 0,
      isCatchAll: true,
    },
  })

  for (let i = 0; i < BEREICHE.length; i++) {
    const b = BEREICHE[i]
    await prisma.bereich.create({
      data: {
        eventId: EVENT_ID,
        name: b.name,
        icon: b.icon,
        verantwortliche: '',
        ordering: i,
      },
    })
  }
  console.log(`Sommerfest-2027-Seed: ${BEREICHE.length} Bereiche + Catch-All-Person angelegt.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
