import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import { BEREICHE, PERSONEN } from '../src/data/protokolle'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Reihenfolge: erst FK-Kinder, dann Eltern.
  await prisma.taskAssignment.deleteMany()
  await prisma.beschluss.deleteMany()
  await prisma.task.deleteMany()
  await prisma.bereich.deleteMany()
  await prisma.person.deleteMany()
  await prisma.salesEntry.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.salesEstimate.deleteMany()
  await prisma.participant.deleteMany()
  await prisma.team.deleteMany()
  await prisma.product.deleteMany()
  // User NICHT löschen — DJKalle/Login bleibt erhalten.
  console.log('Cleared protokoll/warenwirtschaft data (User unverändert)')

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

  // ─── PRODUCTS (Getränke/Speisen) ────────────────────────────────────────────

  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Halbe (0,5l)', purchasePrice: 0.80, salePrice: 3.50, unit: 'Glas', category: 'Bier & Radler' } }),
    prisma.product.create({ data: { name: 'Radler (0,5l)', purchasePrice: 0.80, salePrice: 3.50, unit: 'Glas', category: 'Bier & Radler' } }),
    prisma.product.create({ data: { name: 'Weißbier (0,5l)', purchasePrice: 0.80, salePrice: 3.50, unit: 'Glas', category: 'Bier & Radler' } }),
    prisma.product.create({ data: { name: 'Spezi/Cola (0,5l)', purchasePrice: 0.50, salePrice: 3.00, unit: 'Flasche', category: 'Softdrinks' } }),
    prisma.product.create({ data: { name: 'Apfelschorle (0,5l)', purchasePrice: 0.45, salePrice: 3.00, unit: 'Flasche', category: 'Softdrinks' } }),
    prisma.product.create({ data: { name: 'Wasser (0,5l)', purchasePrice: 0.25, salePrice: 2.00, unit: 'Flasche', category: 'Softdrinks' } }),
    prisma.product.create({ data: { name: 'Schnaps 2cl', purchasePrice: 0.30, salePrice: 2.00, unit: 'Shot', category: 'Schnaps & Shots' } }),
    prisma.product.create({ data: { name: 'Jägermeister 2cl', purchasePrice: 0.40, salePrice: 2.00, unit: 'Shot', category: 'Schnaps & Shots' } }),
    prisma.product.create({ data: { name: 'Aperol Spritz', purchasePrice: 1.50, salePrice: 5.00, unit: 'Glas', category: 'Longdrinks' } }),
    prisma.product.create({ data: { name: 'Cuba Libre', purchasePrice: 1.80, salePrice: 5.00, unit: 'Glas', category: 'Longdrinks' } }),
    prisma.product.create({ data: { name: 'Weinschorle (0,25l)', purchasePrice: 0.80, salePrice: 5.00, unit: 'Glas', category: 'Longdrinks' } }),
    prisma.product.create({ data: { name: 'Sekt (0,1l)', purchasePrice: 0.80, salePrice: 3.50, unit: 'Glas', category: 'Wein & Sekt' } }),
    prisma.product.create({ data: { name: 'Leberkäs-Semmel', purchasePrice: 1.50, salePrice: 4.00, unit: 'Stück', category: 'Warme Speisen' } }),
    prisma.product.create({ data: { name: 'Steaksemmel', purchasePrice: 2.50, salePrice: 5.00, unit: 'Stück', category: 'Warme Speisen' } }),
    prisma.product.create({ data: { name: 'Brezel', purchasePrice: 0.50, salePrice: 1.50, unit: 'Stück', category: 'Snacks' } }),
  ])
  console.log(`Created ${products.length} products`)

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

  // ─── INVENTORY (Beispiele) ──────────────────────────────────────────────────

  const halbe = products.find(p => p.name === 'Halbe (0,5l)')!
  const weissbier = products.find(p => p.name === 'Weißbier (0,5l)')!
  const spezi = products.find(p => p.name === 'Spezi/Cola (0,5l)')!

  await Promise.all([
    prisma.inventory.create({ data: { productId: halbe.id, quantity: 100, eventDay: 'thursday', type: 'start' } }),
    prisma.inventory.create({ data: { productId: weissbier.id, quantity: 50, eventDay: 'thursday', type: 'start' } }),
    prisma.inventory.create({ data: { productId: spezi.id, quantity: 60, eventDay: 'thursday', type: 'start' } }),
  ])
  console.log('Created inventory entries')

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
