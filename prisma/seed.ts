import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import { BEREICHE, PERSONEN } from '../src/data/protokolle'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Reihenfolge: erst FK-Kinder, dann Eltern.
  // NICHT angefasst werden: User, Product, Inventory, SalesEntry, SalesEstimate.
  // Damit bleibt der Warenwirtschafts-Katalog (Getränkepreise etc.) und der
  // Login-User bei jedem Re-Seed erhalten.
  await prisma.taskAssignment.deleteMany()
  await prisma.beschluss.deleteMany()
  await prisma.task.deleteMany()
  await prisma.bereich.deleteMany()
  await prisma.person.deleteMany()
  await prisma.participant.deleteMany()
  await prisma.team.deleteMany()
  console.log('Cleared Festplanung + Watt-Turnier (User/Warenwirtschaft unverändert)')

  // ─── PERSONEN (Festausschuss) ───────────────────────────────────────────────

  const personMap = new Map<string, { id: string; keywords: string[]; isCatchAll: boolean }>()
  for (let i = 0; i < PERSONEN.length; i++) {
    const p = PERSONEN[i]
    const isCatchAll = p.id === 'helferx'
    const created = await prisma.person.create({
      data: {
        name: p.name,
        initials: p.initials,
        color: p.color,
        ordering: i,
        isCatchAll,
      },
    })
    personMap.set(p.id, { id: created.id, keywords: p.keywords, isCatchAll })
  }
  console.log(`Created ${personMap.size} persons`)

  // ─── BEREICHE + BESCHLÜSSE + PROTOKOLL-AUFGABEN ─────────────────────────────

  function matchingPersonIds(verantwortlich: string | undefined): string[] {
    const matches: string[] = []
    let anyNamedMatched = false
    for (const p of PERSONEN) {
      if (p.id === 'helferx') continue
      if (!verantwortlich) continue
      const v = verantwortlich.toLowerCase()
      if (p.keywords.some(k => v.includes(k.toLowerCase()))) {
        matches.push(personMap.get(p.id)!.id)
        anyNamedMatched = true
      }
    }
    if (!verantwortlich || !anyNamedMatched) {
      matches.push(personMap.get('helferx')!.id)
    }
    return matches
  }

  let bereichCount = 0
  let beschlussCount = 0
  let protokollTaskCount = 0
  let assignmentCount = 0

  for (let bIdx = 0; bIdx < BEREICHE.length; bIdx++) {
    const b = BEREICHE[bIdx]
    const bereich = await prisma.bereich.create({
      data: {
        name: b.name,
        icon: b.icon,
        verantwortliche: b.verantwortliche,
        ordering: bIdx,
      },
    })
    bereichCount++

    for (let i = 0; i < b.beschluesse.length; i++) {
      await prisma.beschluss.create({
        data: { text: b.beschluesse[i], bereichId: bereich.id, ordering: i },
      })
      beschlussCount++
    }

    for (const a of b.aufgaben) {
      const task = await prisma.task.create({
        data: {
          title: a.titel,
          detail: a.detail || null,
          status: a.status,
          bereichId: bereich.id,
          priority: 'medium',
        },
      })
      protokollTaskCount++

      const personIds = matchingPersonIds(a.verantwortlich)
      if (personIds.length > 0) {
        await prisma.taskAssignment.createMany({
          data: personIds.map(personId => ({ taskId: task.id, personId })),
        })
        assignmentCount += personIds.length
      }
    }
  }
  console.log(`Created ${bereichCount} bereiche, ${beschlussCount} beschlüsse, ${protokollTaskCount} protokoll-tasks, ${assignmentCount} assignments`)

  // ─── TEAMS & PARTICIPANTS (Watt-Turnier) ────────────────────────────────────

  const teams = await Promise.all([
    prisma.team.create({ data: { name: 'Die Könige', eventDay: 'thursday' } }),
    prisma.team.create({ data: { name: 'Kartenhaie', eventDay: 'thursday' } }),
    prisma.team.create({ data: { name: 'Stichmeister', eventDay: 'thursday' } }),
  ])
  console.log(`Created ${teams.length} teams`)

  await Promise.all([
    prisma.participant.create({ data: { name: 'Hans Gruber', phone: '0171 1234567', eventDay: 'thursday', paid: true, teamId: teams[0].id } }),
    prisma.participant.create({ data: { name: 'Klaus Maier', phone: '0172 2345678', eventDay: 'thursday', paid: true, teamId: teams[0].id } }),
    prisma.participant.create({ data: { name: 'Sepp Huber', phone: '0173 3456789', eventDay: 'thursday', paid: false, teamId: teams[1].id } }),
    prisma.participant.create({ data: { name: 'Franz Berger', eventDay: 'thursday', paid: true, teamId: teams[1].id } }),
    prisma.participant.create({ data: { name: 'Josef Wimmer', eventDay: 'thursday', paid: false } }),
  ])
  console.log('Created participants')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
