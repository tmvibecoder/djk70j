import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean up existing data in correct order (respecting foreign keys)
  await prisma.shiftAssignment.deleteMany()
  await prisma.shift.deleteMany()
  await prisma.station.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.salesEntry.deleteMany()
  await prisma.salesEstimate.deleteMany()
  await prisma.task.deleteMany()
  await prisma.participant.deleteMany()
  await prisma.team.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()
  console.log('Cleared existing data')

  // ─── USERS ───────────────────────────────────────────────────────────────────

  const usersData: { name: string; role: string }[] = [
    { name: 'Luca Raacke', role: 'admin' },
    { name: 'Andreas Lippacher', role: 'orga' },
    { name: 'Jonas Kiermaier', role: 'helper' },
    { name: 'Peter Knauer', role: 'shiftleader' },
    { name: 'Josef Knauer', role: 'helper' },
    { name: 'Philipp Kugler', role: 'helper' },
    { name: 'Xaver Schatz', role: 'shiftleader' },
    { name: 'Thomas Schatz', role: 'helper' },
    { name: 'Daniel Greckl', role: 'helper' },
    { name: 'Bernhard Greckl', role: 'helper' },
    { name: 'Albert Ostermaier', role: 'helper' },
    { name: 'Julian Hergenröder', role: 'orga' },
    { name: 'Alexander Waldner', role: 'helper' },
    { name: 'Florian Schreiner', role: 'helper' },
    { name: 'Manuel Greckl', role: 'helper' },
    { name: 'Jonas Röhling', role: 'helper' },
    { name: 'Thomas Lippacher', role: 'helper' },
    { name: 'Alfred Greckl', role: 'helper' },
    { name: 'Simon Deutinger', role: 'helper' },
    { name: 'Margit Greckl', role: 'helper' },
    { name: 'Michaela Schreiner', role: 'helper' },
    { name: 'Tanja Kiermaier', role: 'helper' },
    { name: 'Antonia Greckl', role: 'helper' },
    { name: 'Luisa Rauch', role: 'helper' },
    { name: 'Moni Heckel', role: 'helper' },
    { name: 'Dieter Heckel', role: 'helper' },
    { name: 'Florian Deutinger', role: 'helper' },
    { name: 'Evi Rauch', role: 'helper' },
    { name: 'Marlene Adam', role: 'helper' },
    { name: 'Carina Klempt', role: 'helper' },
    { name: 'Jenny Waldner', role: 'helper' },
    { name: 'Nina Hundhammer', role: 'helper' },
    { name: 'Kathi Miler', role: 'helper' },
    { name: 'Nadine Piro', role: 'helper' },
    { name: 'Babsi Zuber', role: 'helper' },
    { name: 'Steffi Knauer', role: 'helper' },
    { name: 'Lena Lex', role: 'helper' },
    { name: 'Stjepan Celebic', role: 'helper' },
    { name: 'Sebastian Weber', role: 'helper' },
    { name: 'Marvin Mehnert', role: 'helper' },
    { name: 'Rudi Rauch', role: 'helper' },
    { name: 'Fabian Holzner', role: 'helper' },
    { name: 'Kone Rappold', role: 'helper' },
    { name: 'Franz Brandl', role: 'helper' },
    { name: 'Sepp Greckl', role: 'helper' },
    { name: 'Joe Greckl', role: 'helper' },
    { name: 'Silvia Holbinger', role: 'helper' },
    { name: 'Bianka Schwanzer', role: 'helper' },
    { name: 'Jeanette Klempt', role: 'helper' },
    { name: 'Annika Warta', role: 'helper' },
    { name: 'Sabine Menrad', role: 'helper' },
    { name: 'Hermann Menrad', role: 'helper' },
    { name: 'Daniela Speer', role: 'helper' },
    { name: 'Kathi Menrad', role: 'helper' },
    { name: 'Vroni Lippacher', role: 'helper' },
    { name: 'Dagmar Lierzer', role: 'helper' },
    { name: 'Marion Greckl', role: 'helper' },
    { name: 'Rebecca Holzner', role: 'helper' },
    { name: 'Veronika Lechner', role: 'helper' },
    { name: 'Susanne Greckl', role: 'helper' },
    { name: 'Claudia Zehetmair', role: 'helper' },
    { name: 'Petra Bargen', role: 'helper' },
    { name: 'Julia Adam', role: 'helper' },
    { name: 'Kerstin Wittenstein', role: 'helper' },
  ]

  const userMap = new Map<string, { id: string; name: string }>()
  for (const u of usersData) {
    const user = await prisma.user.create({ data: { name: u.name, role: u.role } })
    userMap.set(u.name, user)
  }
  console.log(`Created ${userMap.size} users`)

  // Helper to look up user ID by name (throws if not found)
  function userId(name: string): string {
    const u = userMap.get(name)
    if (!u) throw new Error(`User not found: ${name}`)
    return u.id
  }

  // ─── STATIONS ────────────────────────────────────────────────────────────────

  const stationsData = [
    { name: 'Aufbau Zelt', description: 'Zeltaufbau und Außenarbeiten' },
    { name: 'Aufbau Innen Zelt', description: 'Innendekoration, Bestuhlung, Tische' },
    { name: 'Küche', description: 'Speisenvorbereitung und Ausgabe' },
    { name: 'Schänke', description: 'Getränkeausschank im Zelt' },
    { name: 'Bar', description: 'Barservice (Mindestalter 18)' },
    { name: 'Biergarten', description: 'Außenbereich Getränkeservice' },
    { name: 'Eintritt', description: 'Einlasskontrolle und Kassenbereich' },
    { name: 'Kasse', description: 'Kassenbereich' },
    { name: 'Nachschub', description: 'Getränke- und Warennachschub' },
    { name: 'Springer', description: 'Flexible Hilfe wo benötigt' },
    { name: 'Klodienst', description: 'Sanitäranlagen (M/W)' },
    { name: 'Steaksemmel', description: 'Steaksemmel-Verkauf und Zubereitung' },
    { name: 'Kaffee & Kuchen', description: 'Kaffee- und Kuchenverkauf' },
    { name: 'Kuchenspende', description: 'Kuchenspenden für Sonntag' },
    { name: 'Abbau', description: 'Abbau, Folgetage, Anhängerfahren' },
  ]

  const stationMap = new Map<string, { id: string; name: string }>()
  for (const s of stationsData) {
    const station = await prisma.station.create({ data: s })
    stationMap.set(s.name, station)
  }
  console.log(`Created ${stationMap.size} stations`)

  // Helper to look up station ID by name
  function stationId(name: string): string {
    const s = stationMap.get(name)
    if (!s) throw new Error(`Station not found: ${name}`)
    return s.id
  }

  // ─── SHIFTS & ASSIGNMENTS ───────────────────────────────────────────────────

  interface ShiftDef {
    station: string
    day: string
    start: string
    end: string
    required: number
    assigned: string[]
  }

  const shifts: ShiftDef[] = [
    // TUESDAY - Aufbau Zelt
    {
      station: 'Aufbau Zelt', day: 'tuesday', start: '08:00', end: '17:00', required: 20,
      assigned: [
        'Luca Raacke', 'Andreas Lippacher', 'Jonas Kiermaier', 'Peter Knauer',
        'Josef Knauer', 'Philipp Kugler', 'Xaver Schatz', 'Thomas Schatz',
        'Daniel Greckl', 'Bernhard Greckl', 'Albert Ostermaier', 'Julian Hergenröder',
        'Alexander Waldner', 'Florian Schreiner', 'Manuel Greckl', 'Jonas Röhling',
        'Thomas Lippacher', 'Alfred Greckl',
      ],
    },
    // MONDAY - Aufbau Innen Zelt
    {
      station: 'Aufbau Innen Zelt', day: 'monday', start: '08:00', end: '17:00', required: 20,
      assigned: [
        'Luca Raacke', 'Peter Knauer', 'Jonas Kiermaier', 'Julian Hergenröder',
        'Jonas Röhling', 'Xaver Schatz', 'Simon Deutinger',
      ],
    },
    // THURSDAY
    {
      station: 'Küche', day: 'thursday', start: '12:00', end: '17:00', required: 6,
      assigned: ['Margit Greckl', 'Andreas Lippacher'],
    },
    {
      station: 'Schänke', day: 'thursday', start: '15:00', end: '19:00', required: 4,
      assigned: ['Michaela Schreiner', 'Tanja Kiermaier'],
    },
    {
      station: 'Schänke', day: 'thursday', start: '19:00', end: '23:00', required: 4,
      assigned: ['Luca Raacke', 'Margit Greckl', 'Antonia Greckl', 'Luisa Rauch'],
    },
    // FRIDAY
    {
      station: 'Biergarten', day: 'friday', start: '15:00', end: '19:00', required: 5,
      assigned: [],
    },
    {
      station: 'Küche', day: 'friday', start: '14:00', end: '17:00', required: 2,
      assigned: ['Moni Heckel', 'Dieter Heckel'],
    },
    {
      station: 'Schänke', day: 'friday', start: '15:00', end: '19:00', required: 3,
      assigned: ['Luca Raacke', 'Florian Deutinger', 'Simon Deutinger'],
    },
    {
      station: 'Eintritt', day: 'friday', start: '19:00', end: '01:00', required: 4,
      assigned: ['Margit Greckl', 'Michaela Schreiner', 'Tanja Kiermaier', 'Florian Deutinger'],
    },
    {
      station: 'Küche', day: 'friday', start: '14:00', end: '18:00', required: 2,
      assigned: ['Evi Rauch', 'Marlene Adam'],
    },
    {
      station: 'Schänke', day: 'friday', start: '19:00', end: '23:00', required: 5,
      assigned: ['Luca Raacke', 'Florian Deutinger', 'Simon Deutinger'],
    },
    {
      station: 'Schänke', day: 'friday', start: '23:00', end: '03:00', required: 5,
      assigned: [],
    },
    {
      station: 'Bar', day: 'friday', start: '19:00', end: '23:00', required: 15,
      assigned: [
        'Carina Klempt', 'Peter Knauer', 'Julian Hergenröder', 'Alexander Waldner',
        'Jenny Waldner', 'Nina Hundhammer', 'Kathi Miler',
      ],
    },
    {
      station: 'Bar', day: 'friday', start: '23:00', end: '03:00', required: 15,
      assigned: [
        'Luca Raacke', 'Xaver Schatz', 'Josef Knauer', 'Peter Knauer',
        'Jonas Röhling', 'Nadine Piro', 'Babsi Zuber', 'Steffi Knauer',
        'Lena Lex', 'Stjepan Celebic',
      ],
    },
    {
      station: 'Springer', day: 'friday', start: '18:00', end: '02:00', required: 3,
      assigned: ['Sebastian Weber'],
    },
    {
      station: 'Klodienst', day: 'friday', start: '19:00', end: '02:00', required: 2,
      assigned: [],
    },
    {
      station: 'Nachschub', day: 'friday', start: '19:00', end: '02:00', required: 3,
      assigned: ['Julian Hergenröder', 'Manuel Greckl'],
    },
    // SATURDAY
    {
      station: 'Schänke', day: 'saturday', start: '09:00', end: '12:00', required: 3,
      assigned: [],
    },
    {
      station: 'Schänke', day: 'saturday', start: '12:00', end: '15:00', required: 4,
      assigned: ['Luca Raacke', 'Marvin Mehnert', 'Julian Hergenröder', 'Simon Deutinger'],
    },
    {
      station: 'Schänke', day: 'saturday', start: '15:00', end: '18:00', required: 4,
      assigned: ['Xaver Schatz', 'Peter Knauer', 'Florian Deutinger', 'Manuel Greckl'],
    },
    {
      station: 'Nachschub', day: 'saturday', start: '09:00', end: '18:00', required: 4,
      assigned: [],
    },
    {
      station: 'Kasse', day: 'saturday', start: '09:00', end: '14:00', required: 3,
      assigned: [],
    },
    {
      station: 'Eintritt', day: 'saturday', start: '18:00', end: '01:00', required: 4,
      assigned: ['Michaela Schreiner', 'Tanja Kiermaier', 'Simon Deutinger'],
    },
    {
      station: 'Schänke', day: 'saturday', start: '18:00', end: '22:00', required: 10,
      assigned: ['Bernhard Greckl', 'Kone Rappold', 'Franz Brandl', 'Sebastian Weber'],
    },
    {
      station: 'Schänke', day: 'saturday', start: '22:00', end: '03:00', required: 10,
      assigned: [],
    },
    {
      station: 'Bar', day: 'saturday', start: '18:00', end: '23:00', required: 20,
      assigned: [
        'Luca Raacke', 'Xaver Schatz', 'Josef Knauer', 'Peter Knauer',
        'Julian Hergenröder', 'Jenny Waldner', 'Jonas Röhling', 'Nadine Piro',
        'Babsi Zuber', 'Steffi Knauer', 'Stjepan Celebic',
      ],
    },
    {
      station: 'Bar', day: 'saturday', start: '23:00', end: '03:00', required: 20,
      assigned: [
        'Peter Knauer', 'Julian Hergenröder', 'Xaver Schatz', 'Jonas Röhling',
        'Steffi Knauer', 'Lena Lex', 'Stjepan Celebic',
      ],
    },
    {
      station: 'Steaksemmel', day: 'saturday', start: '17:00', end: '21:00', required: 4,
      assigned: ['Alfred Greckl', 'Sepp Greckl', 'Joe Greckl'],
    },
    {
      station: 'Steaksemmel', day: 'saturday', start: '21:00', end: '01:00', required: 4,
      assigned: [],
    },
    {
      station: 'Klodienst', day: 'saturday', start: '18:00', end: '02:00', required: 2,
      assigned: [],
    },
    {
      station: 'Nachschub', day: 'saturday', start: '18:00', end: '02:00', required: 4,
      assigned: ['Manuel Greckl'],
    },
    // SUNDAY
    {
      station: 'Küche', day: 'sunday', start: '06:00', end: '09:30', required: 15,
      assigned: ['Luca Raacke', 'Xaver Schatz', 'Alfred Greckl', 'Joe Greckl'],
    },
    {
      station: 'Schänke', day: 'sunday', start: '09:30', end: '11:00', required: 2,
      assigned: ['Fabian Holzner'],
    },
    {
      station: 'Schänke', day: 'sunday', start: '11:00', end: '14:00', required: 10,
      assigned: ['Luca Raacke', 'Rudi Rauch', 'Xaver Schatz', 'Josef Knauer', 'Marvin Mehnert'],
    },
    {
      station: 'Schänke', day: 'sunday', start: '14:00', end: '20:00', required: 10,
      assigned: [
        'Luca Raacke', 'Xaver Schatz', 'Rudi Rauch', 'Josef Knauer',
        'Florian Deutinger', 'Jonas Röhling',
      ],
    },
    {
      station: 'Küche', day: 'sunday', start: '10:00', end: '14:00', required: 10,
      assigned: ['Evi Rauch', 'Margit Greckl', 'Marlene Adam', 'Sepp Greckl'],
    },
    {
      station: 'Kaffee & Kuchen', day: 'sunday', start: '13:00', end: '17:00', required: 4,
      assigned: ['Jeanette Klempt', 'Sabine Menrad', 'Hermann Menrad'],
    },
    {
      station: 'Kuchenspende', day: 'sunday', start: '08:00', end: '12:00', required: 60,
      assigned: [
        'Silvia Holbinger', 'Carina Klempt', 'Andreas Lippacher', 'Moni Heckel',
        'Bianka Schwanzer', 'Antonia Greckl', 'Jeanette Klempt', 'Margit Greckl',
        'Annika Warta', 'Sabine Menrad', 'Evi Rauch', 'Daniela Speer',
        'Kathi Menrad', 'Marlene Adam', 'Kathi Miler', 'Vroni Lippacher',
        'Dagmar Lierzer', 'Marion Greckl', 'Rebecca Holzner', 'Nadine Piro',
        'Veronika Lechner', 'Susanne Greckl', 'Claudia Zehetmair', 'Petra Bargen',
        'Steffi Knauer', 'Julia Adam', 'Kerstin Wittenstein',
      ],
    },
    {
      station: 'Nachschub', day: 'sunday', start: '11:00', end: '15:30', required: 2,
      assigned: [],
    },
    {
      station: 'Springer', day: 'sunday', start: '09:00', end: '18:00', required: 3,
      assigned: [],
    },
    {
      station: 'Abbau', day: 'sunday', start: '18:00', end: '23:00', required: 15,
      assigned: [
        'Andreas Lippacher', 'Margit Greckl', 'Jonas Kiermaier', 'Philipp Kugler',
        'Florian Deutinger', 'Julian Hergenröder', 'Xaver Schatz', 'Simon Deutinger',
      ],
    },
  ]

  for (const shiftDef of shifts) {
    const shift = await prisma.shift.create({
      data: {
        stationId: stationId(shiftDef.station),
        eventDay: shiftDef.day,
        startTime: shiftDef.start,
        endTime: shiftDef.end,
        requiredHelpers: shiftDef.required,
      },
    })

    if (shiftDef.assigned.length > 0) {
      await prisma.shiftAssignment.createMany({
        data: shiftDef.assigned.map((name) => ({
          shiftId: shift.id,
          userId: userId(name),
        })),
      })
    }
  }
  console.log(`Created ${shifts.length} shifts with assignments`)

  // ─── PRODUCTS ────────────────────────────────────────────────────────────────

  const products = await Promise.all([
    // Bier & Radler
    prisma.product.create({ data: { name: 'Halbe (0,5l)', purchasePrice: 1.10, salePrice: 3.50, unit: 'Glas', category: 'Bier & Radler' } }),
    prisma.product.create({ data: { name: 'Radler Maß (1l)', purchasePrice: 1.80, salePrice: 6.50, unit: 'Maß', category: 'Bier & Radler' } }),
    prisma.product.create({ data: { name: 'Weißbier (0,5l)', purchasePrice: 1.00, salePrice: 3.50, unit: 'Glas', category: 'Bier & Radler' } }),
    // Softdrinks
    prisma.product.create({ data: { name: 'Spezi/Cola (0,5l)', purchasePrice: 0.50, salePrice: 3.00, unit: 'Flasche', category: 'Softdrinks' } }),
    prisma.product.create({ data: { name: 'Apfelschorle (0,5l)', purchasePrice: 0.45, salePrice: 3.00, unit: 'Flasche', category: 'Softdrinks' } }),
    prisma.product.create({ data: { name: 'Wasser (0,5l)', purchasePrice: 0.25, salePrice: 2.00, unit: 'Flasche', category: 'Softdrinks' } }),
    // Schnaps & Shots
    prisma.product.create({ data: { name: 'Schnaps 2cl', purchasePrice: 0.30, salePrice: 2.00, unit: 'Shot', category: 'Schnaps & Shots' } }),
    prisma.product.create({ data: { name: 'Jägermeister 2cl', purchasePrice: 0.40, salePrice: 2.00, unit: 'Shot', category: 'Schnaps & Shots' } }),
    // Longdrinks
    prisma.product.create({ data: { name: 'Aperol Spritz', purchasePrice: 1.50, salePrice: 5.00, unit: 'Glas', category: 'Longdrinks' } }),
    prisma.product.create({ data: { name: 'Cuba Libre', purchasePrice: 1.80, salePrice: 5.00, unit: 'Glas', category: 'Longdrinks' } }),
    prisma.product.create({ data: { name: 'Weinschorle (0,25l)', purchasePrice: 0.80, salePrice: 5.00, unit: 'Glas', category: 'Longdrinks' } }),
    // Wein & Sekt
    prisma.product.create({ data: { name: 'Sekt (0,1l)', purchasePrice: 0.80, salePrice: 3.50, unit: 'Glas', category: 'Wein & Sekt' } }),
    // Speisen
    prisma.product.create({ data: { name: 'Leberkäs-Semmel', purchasePrice: 1.50, salePrice: 4.00, unit: 'Stück', category: 'Warme Speisen' } }),
    prisma.product.create({ data: { name: 'Steaksemmel', purchasePrice: 2.50, salePrice: 5.00, unit: 'Stück', category: 'Warme Speisen' } }),
    prisma.product.create({ data: { name: 'Brezel', purchasePrice: 0.50, salePrice: 1.50, unit: 'Stück', category: 'Snacks' } }),
  ])
  console.log(`Created ${products.length} products`)

  // ─── TEAMS (Watt-Turnier) ───────────────────────────────────────────────────

  const teams = await Promise.all([
    prisma.team.create({ data: { name: 'Die Könige', eventDay: 'thursday' } }),
    prisma.team.create({ data: { name: 'Kartenhaie', eventDay: 'thursday' } }),
    prisma.team.create({ data: { name: 'Stichmeister', eventDay: 'thursday' } }),
  ])
  console.log(`Created ${teams.length} teams`)

  // ─── PARTICIPANTS ────────────────────────────────────────────────────────────

  await Promise.all([
    prisma.participant.create({ data: { name: 'Hans Gruber', phone: '0171 1234567', eventDay: 'thursday', paid: true, teamId: teams[0].id } }),
    prisma.participant.create({ data: { name: 'Klaus Maier', phone: '0172 2345678', eventDay: 'thursday', paid: true, teamId: teams[0].id } }),
    prisma.participant.create({ data: { name: 'Sepp Huber', phone: '0173 3456789', eventDay: 'thursday', paid: false, teamId: teams[1].id } }),
    prisma.participant.create({ data: { name: 'Franz Berger', eventDay: 'thursday', paid: true, teamId: teams[1].id } }),
    prisma.participant.create({ data: { name: 'Josef Wimmer', eventDay: 'thursday', paid: false } }),
  ])
  console.log('Created participants')

  // ─── TASKS ───────────────────────────────────────────────────────────────────

  const lucaId = userId('Luca Raacke')
  const andreasId = userId('Andreas Lippacher')

  await Promise.all([
    prisma.task.create({ data: { title: 'Bierzeltgarnituren aufstellen', description: '20 Garnituren aus Lager holen', eventDay: 'thursday', category: 'Aufbau', priority: 'high', assigneeId: lucaId } }),
    prisma.task.create({ data: { title: 'Getränke bestellen', description: 'Bestellung bei Getränkemarkt aufgeben', category: 'Einkauf', priority: 'high', deadline: new Date('2025-03-01') } }),
    prisma.task.create({ data: { title: 'DJ organisieren', description: 'DJ für Freitag Disco buchen', eventDay: 'friday', category: 'Organisation', priority: 'medium', status: 'done' } }),
    prisma.task.create({ data: { title: 'Deko einkaufen', description: 'Luftballons, Banner, Tischdecken', category: 'Einkauf', priority: 'low' } }),
    prisma.task.create({ data: { title: 'Musikanlage testen', eventDay: 'friday', category: 'Technik', priority: 'medium', status: 'in_progress', assigneeId: andreasId } }),
  ])
  console.log('Created tasks')

  // ─── INVENTORY ───────────────────────────────────────────────────────────────

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
