import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Helfer erstellen
  const users = await Promise.all([
    prisma.user.create({ data: { name: 'Max Müller', role: 'admin', email: 'max@example.com' } }),
    prisma.user.create({ data: { name: 'Anna Schmidt', role: 'orga', email: 'anna@example.com' } }),
    prisma.user.create({ data: { name: 'Peter Weber', role: 'shiftleader' } }),
    prisma.user.create({ data: { name: 'Lisa Bauer', role: 'helper' } }),
    prisma.user.create({ data: { name: 'Tom Fischer', role: 'helper' } }),
    prisma.user.create({ data: { name: 'Maria Hoffmann', role: 'helper' } }),
  ])
  console.log(`Created ${users.length} users`)

  // Produkte erstellen
  const products = await Promise.all([
    // Bier & Radler
    prisma.product.create({ data: { name: 'Helles 0,5l', purchasePrice: 0.80, salePrice: 3.00, unit: 'Flasche', category: 'Bier & Radler' } }),
    prisma.product.create({ data: { name: 'Weißbier 0,5l', purchasePrice: 0.90, salePrice: 3.50, unit: 'Flasche', category: 'Bier & Radler' } }),
    prisma.product.create({ data: { name: 'Radler 0,5l', purchasePrice: 0.75, salePrice: 2.80, unit: 'Flasche', category: 'Bier & Radler' } }),
    // Softdrinks
    prisma.product.create({ data: { name: 'Cola 0,33l', purchasePrice: 0.50, salePrice: 2.00, unit: 'Flasche', category: 'Softdrinks' } }),
    prisma.product.create({ data: { name: 'Spezi 0,33l', purchasePrice: 0.50, salePrice: 2.00, unit: 'Flasche', category: 'Softdrinks' } }),
    prisma.product.create({ data: { name: 'Wasser 0,5l', purchasePrice: 0.30, salePrice: 1.50, unit: 'Flasche', category: 'Softdrinks' } }),
    // Wein & Sekt
    prisma.product.create({ data: { name: 'Weißwein 0,2l', purchasePrice: 1.00, salePrice: 3.50, unit: 'Glas', category: 'Wein & Sekt' } }),
    prisma.product.create({ data: { name: 'Sekt 0,1l', purchasePrice: 1.20, salePrice: 4.00, unit: 'Glas', category: 'Wein & Sekt' } }),
    // Schnaps & Shots
    prisma.product.create({ data: { name: 'Schnaps 2cl', purchasePrice: 0.40, salePrice: 2.00, unit: 'Shot', category: 'Schnaps & Shots' } }),
    // Speisen
    prisma.product.create({ data: { name: 'Leberkäs-Semmel', purchasePrice: 1.50, salePrice: 4.00, unit: 'Stück', category: 'Warme Speisen' } }),
    prisma.product.create({ data: { name: 'Brezel', purchasePrice: 0.50, salePrice: 1.50, unit: 'Stück', category: 'Snacks' } }),
  ])
  console.log(`Created ${products.length} products`)

  // Stationen erstellen
  const stations = await Promise.all([
    prisma.station.create({ data: { name: 'Bar Hauptzelt', description: 'Getränkeausgabe im Hauptzelt' } }),
    prisma.station.create({ data: { name: 'Kasse', description: 'Eintrittskasse' } }),
    prisma.station.create({ data: { name: 'Küche', description: 'Speiseausgabe' } }),
    prisma.station.create({ data: { name: 'Eingang', description: 'Eingangskontrolle' } }),
  ])
  console.log(`Created ${stations.length} stations`)

  // Schichten erstellen
  const shifts = await Promise.all([
    // Donnerstag
    prisma.shift.create({ data: { stationId: stations[0].id, eventDay: 'thursday', startTime: '17:00', endTime: '21:00', requiredHelpers: 2 } }),
    prisma.shift.create({ data: { stationId: stations[0].id, eventDay: 'thursday', startTime: '21:00', endTime: '01:00', requiredHelpers: 2 } }),
    prisma.shift.create({ data: { stationId: stations[1].id, eventDay: 'thursday', startTime: '17:00', endTime: '22:00', requiredHelpers: 1 } }),
    // Freitag
    prisma.shift.create({ data: { stationId: stations[0].id, eventDay: 'friday', startTime: '19:00', endTime: '23:00', requiredHelpers: 3 } }),
    prisma.shift.create({ data: { stationId: stations[0].id, eventDay: 'friday', startTime: '23:00', endTime: '03:00', requiredHelpers: 3 } }),
    prisma.shift.create({ data: { stationId: stations[1].id, eventDay: 'friday', startTime: '19:00', endTime: '01:00', requiredHelpers: 1 } }),
    prisma.shift.create({ data: { stationId: stations[3].id, eventDay: 'friday', startTime: '19:00', endTime: '01:00', requiredHelpers: 2 } }),
  ])
  console.log(`Created ${shifts.length} shifts`)

  // Einige Schichtzuweisungen
  await Promise.all([
    prisma.shiftAssignment.create({ data: { shiftId: shifts[0].id, userId: users[3].id } }),
    prisma.shiftAssignment.create({ data: { shiftId: shifts[0].id, userId: users[4].id } }),
    prisma.shiftAssignment.create({ data: { shiftId: shifts[2].id, userId: users[5].id } }),
  ])
  console.log('Created shift assignments')

  // Teams für Watt-Turnier
  const teams = await Promise.all([
    prisma.team.create({ data: { name: 'Die Könige', eventDay: 'thursday' } }),
    prisma.team.create({ data: { name: 'Kartenhaie', eventDay: 'thursday' } }),
    prisma.team.create({ data: { name: 'Stichmeister', eventDay: 'thursday' } }),
  ])
  console.log(`Created ${teams.length} teams`)

  // Teilnehmer
  await Promise.all([
    prisma.participant.create({ data: { name: 'Hans Gruber', phone: '0171 1234567', eventDay: 'thursday', paid: true, teamId: teams[0].id } }),
    prisma.participant.create({ data: { name: 'Klaus Maier', phone: '0172 2345678', eventDay: 'thursday', paid: true, teamId: teams[0].id } }),
    prisma.participant.create({ data: { name: 'Sepp Huber', phone: '0173 3456789', eventDay: 'thursday', paid: false, teamId: teams[1].id } }),
    prisma.participant.create({ data: { name: 'Franz Berger', eventDay: 'thursday', paid: true, teamId: teams[1].id } }),
    prisma.participant.create({ data: { name: 'Josef Wimmer', eventDay: 'thursday', paid: false } }),
  ])
  console.log('Created participants')

  // Aufgaben
  await Promise.all([
    prisma.task.create({ data: { title: 'Bierzeltgarnituren aufstellen', description: '20 Garnituren aus Lager holen', eventDay: 'thursday', category: 'Aufbau', priority: 'high', assigneeId: users[2].id } }),
    prisma.task.create({ data: { title: 'Getränke bestellen', description: 'Bestellung bei Getränkemarkt aufgeben', category: 'Einkauf', priority: 'high', deadline: new Date('2025-03-01') } }),
    prisma.task.create({ data: { title: 'DJ organisieren', description: 'DJ für Freitag Disco buchen', eventDay: 'friday', category: 'Organisation', priority: 'medium', status: 'done' } }),
    prisma.task.create({ data: { title: 'Deko einkaufen', description: 'Luftballons, Banner, Tischdecken', category: 'Einkauf', priority: 'low' } }),
    prisma.task.create({ data: { title: 'Musikanlage testen', eventDay: 'friday', category: 'Technik', priority: 'medium', status: 'in_progress', assigneeId: users[1].id } }),
  ])
  console.log('Created tasks')

  // Inventur-Beispieldaten
  const helles = products.find(p => p.name === 'Helles 0,5l')!
  const weissbier = products.find(p => p.name === 'Weißbier 0,5l')!
  const cola = products.find(p => p.name === 'Cola 0,33l')!

  await Promise.all([
    prisma.inventory.create({ data: { productId: helles.id, quantity: 100, eventDay: 'thursday', type: 'start' } }),
    prisma.inventory.create({ data: { productId: weissbier.id, quantity: 50, eventDay: 'thursday', type: 'start' } }),
    prisma.inventory.create({ data: { productId: cola.id, quantity: 60, eventDay: 'thursday', type: 'start' } }),
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
