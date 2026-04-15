// Idempotente Datenmigration aus der Festausschuss-Sitzung vom 13. April 2026.
// Safe to re-run: alle Operationen matchen per Titel/Name, legen nur Fehlendes an
// und aktualisieren nur, wenn sich Inhalte unterscheiden.

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function ensurePerson(name: string, initials: string, color: string, ordering: number) {
  const existing = await prisma.person.findFirst({ where: { name } })
  if (existing) {
    console.log(`  = Person "${name}" existiert bereits`)
    return existing
  }
  const created = await prisma.person.create({
    data: { name, initials, color, ordering, isCatchAll: false },
  })
  console.log(`  + Person "${name}" angelegt`)
  return created
}

async function ensureBereich(name: string, icon: string, ordering: number, verantwortliche = '') {
  const existing = await prisma.bereich.findFirst({ where: { name } })
  if (existing) {
    console.log(`  = Bereich "${name}" existiert bereits`)
    return existing
  }
  const created = await prisma.bereich.create({
    data: { name, icon, ordering, verantwortliche },
  })
  console.log(`  + Bereich "${name}" angelegt (icon ${icon})`)
  return created
}

async function findTask(title: string, bereichName?: string) {
  if (bereichName) {
    const bereich = await prisma.bereich.findFirst({ where: { name: bereichName } })
    if (!bereich) return null
    return prisma.task.findFirst({ where: { title, bereichId: bereich.id } })
  }
  return prisma.task.findFirst({ where: { title } })
}

async function assignPerson(taskId: string, personName: string) {
  const person = await prisma.person.findFirst({ where: { name: personName } })
  if (!person) {
    console.log(`    ! Person "${personName}" nicht gefunden, skip`)
    return
  }
  const existing = await prisma.taskAssignment.findUnique({
    where: { taskId_personId: { taskId, personId: person.id } },
  })
  if (existing) return
  await prisma.taskAssignment.create({ data: { taskId, personId: person.id } })
  console.log(`    + "${personName}" zugewiesen`)
}

async function unassignPerson(taskId: string, personName: string) {
  const person = await prisma.person.findFirst({ where: { name: personName } })
  if (!person) return
  const deleted = await prisma.taskAssignment.deleteMany({
    where: { taskId, personId: person.id },
  })
  if (deleted.count > 0) console.log(`    - "${personName}" entfernt`)
}

type UpsertData = {
  status?: 'offen' | 'in_arbeit' | 'erledigt'
  detail?: string | null
  addPersons?: string[]
  removePersons?: string[]
}

async function updateTask(bereichName: string, title: string, data: UpsertData) {
  const task = await findTask(title, bereichName)
  if (!task) {
    console.log(`  ! Task "${title}" in ${bereichName} nicht gefunden`)
    return null
  }
  const update: { status?: string; detail?: string | null } = {}
  if (data.status !== undefined && task.status !== data.status) update.status = data.status
  if (data.detail !== undefined && task.detail !== data.detail) update.detail = data.detail
  if (Object.keys(update).length > 0) {
    await prisma.task.update({ where: { id: task.id }, data: update })
    console.log(`  ~ Task "${title}" aktualisiert (${Object.keys(update).join(', ')})`)
  } else {
    console.log(`  = Task "${title}" inhaltlich unverändert`)
  }
  for (const p of data.removePersons ?? []) await unassignPerson(task.id, p)
  for (const p of data.addPersons ?? []) await assignPerson(task.id, p)
  return task
}

async function createTaskIfMissing(
  bereichName: string,
  title: string,
  data: { status: 'offen' | 'in_arbeit' | 'erledigt'; detail?: string | null; persons?: string[] }
) {
  const bereich = await prisma.bereich.findFirst({ where: { name: bereichName } })
  if (!bereich) {
    console.log(`  ! Bereich "${bereichName}" nicht gefunden`)
    return null
  }
  const existing = await prisma.task.findFirst({ where: { title, bereichId: bereich.id } })
  if (existing) {
    console.log(`  = Task "${title}" bereits in ${bereichName}`)
    // Assignments trotzdem sicherstellen
    for (const p of data.persons ?? []) await assignPerson(existing.id, p)
    return existing
  }
  const task = await prisma.task.create({
    data: {
      title,
      bereichId: bereich.id,
      status: data.status,
      detail: data.detail ?? null,
    },
  })
  console.log(`  + Task "${title}" neu in ${bereichName}`)
  for (const p of data.persons ?? []) await assignPerson(task.id, p)
  return task
}

async function moveTask(title: string, fromBereich: string, toBereich: string) {
  const task = await findTask(title, fromBereich)
  if (!task) {
    // Schon im Ziel?
    const already = await findTask(title, toBereich)
    if (already) console.log(`  = "${title}" bereits in ${toBereich}`)
    else console.log(`  ! "${title}" weder in ${fromBereich} noch in ${toBereich}`)
    return
  }
  const target = await prisma.bereich.findFirst({ where: { name: toBereich } })
  if (!target) {
    console.log(`  ! Ziel-Bereich "${toBereich}" fehlt`)
    return
  }
  await prisma.task.update({ where: { id: task.id }, data: { bereichId: target.id } })
  console.log(`  → "${title}": ${fromBereich} → ${toBereich}`)
}

async function renameTask(oldTitle: string, newTitle: string, bereichName: string) {
  const task = await findTask(oldTitle, bereichName)
  if (!task) {
    const already = await findTask(newTitle, bereichName)
    if (already) console.log(`  = "${newTitle}" in ${bereichName} bereits umbenannt`)
    else console.log(`  ! "${oldTitle}" in ${bereichName} nicht gefunden`)
    return
  }
  await prisma.task.update({ where: { id: task.id }, data: { title: newTitle } })
  console.log(`  ~ "${oldTitle}" → "${newTitle}" (${bereichName})`)
}

// ─── Haupt-Migration ─────────────────────────────────────────────────────────

async function main() {
  console.log('\n═══ Migration: Sitzung 2026-04-13 ═══\n')

  // [1] Neue Personen -----------------------------------------------
  console.log('[1] Personen anlegen')
  await ensurePerson('Verena', 'VE', '#ec4899', 10)
  await ensurePerson('Petra',  'PE', '#14b8a6', 11)
  await ensurePerson('Mirjam', 'MI', '#f59e0b', 12)

  // [2] Neuer Bereich "Toiletten & Hygiene" -------------------------
  console.log('\n[2] Neuer Bereich "Toiletten & Hygiene"')
  await ensureBereich('Toiletten & Hygiene', '🚻', 95)

  // [3] WC-Tasks aus Zelt in neuen Bereich umziehen -----------------
  console.log('\n[3] WC-Tasks umziehen')
  await moveTask('Klowagen mit Tank organisieren', 'Zeltaufbau & Infrastruktur', 'Toiletten & Hygiene')
  await moveTask('WC-Service festlegen',           'Zeltaufbau & Infrastruktur', 'Toiletten & Hygiene')

  // [4] GEMA-Tasks präzisieren --------------------------------------
  console.log('\n[4] GEMA-Tasks umbenennen')
  await renameTask('GEMA beantragen', 'GEMA Fest beantragen', 'Musik & Programm')
  await renameTask('GEMA beantragen', 'GEMA Fußballturnier beantragen', 'Turnier & Verein')

  // [5] Status- und Detail-Updates ----------------------------------
  console.log('\n[5] Status- & Detail-Updates')

  await updateTask('Security & Genehmigungen', 'Landratsamt – Dokumente abschicken', {
    status: 'erledigt',
    detail: 'Dokumente an Gemeinde und Landratsamt abgeschickt. Sperrzeitverkürzung beantragt. Rückmeldung steht noch aus (Hundi fragt bei Gemeinde nach).',
  })

  await updateTask('Zeltaufbau & Infrastruktur', 'Wachdienst Weiher (Patrouille)', {
    status: 'erledigt',
    detail: 'Verworfen in früherer Sitzung. Kein Zaun und keine Patrouille im Sicherheitskonzept — Behördenrückmeldung wird abgewartet.',
  })

  await updateTask('Personal & Helfer', 'Helferliste Uhrzeiten festlegen', {
    status: 'in_arbeit',
    detail: 'Schichten Do–So grob festgelegt (siehe Sitzung 13.04.). Feintuning in Helferliste.de durch Dani.',
  })

  await updateTask('Musik & Programm', 'DJs für Sa & So buchen', {
    detail: 'Sa → DJ Adriano, So → DJ Simon Deutinger (Kehraus nach Blaskapelle). Seb macht DJ Simon fix.',
    addPersons: ['Sebi'],
  })

  await updateTask('Getränke & Lieferanten', 'Preise & Mengen festlegen', {
    detail: 'Schweiger-Preise liegen vor, Kratzer/Daberger noch einholen. ' +
      'Preise aus Sitzung 13.04. (Richtschnur, final nach Beobachtung anderer Feste): ' +
      'Bier 0,5l 4€ (Helles/Radler/Weißbier/Russ gleich), Helles 0,33l 3€, Mass 8€, ' +
      'Alkoholfrei 0,5l 2,50–3€ (Wasser 2,50€), Weinschorle 0,33l Flasche 4€, ' +
      'Longdrinks/Cocktails einheitlich 7€ (Cuba, Rüscherl, Vodka Bull/Lemon, Fanta Korn, Aperol, Lillet Wild Berry), ' +
      'Prosecco 0,1l 3€ / 0,7l Flasche 18€, Weißwein 0,75l Flasche 20€, Gießkanne 50€ + 10€ Pfand.',
  })

  await updateTask('Toiletten & Hygiene', 'Klowagen mit Tank organisieren', {
    detail: 'Ale stellt Odlfassl bereit. Max Thalhammer (Junior) pumpt ab. Vereinsheim direkt anschließbar ohne Umbau. Volumen/Leerungsfrequenz separat zu klären.',
  })

  await updateTask('Zeltaufbau & Infrastruktur', 'Bauzaun organisieren', {
    detail: 'Seb rechnet 2 Varianten (mit/ohne Weiher-Absicherung). Lieferanten: Wirgens (Jonas), Lippacher Georg, Hörgstätter. Hundi hat bewusst keinen Zaun ins Sicherheitskonzept geschrieben — Behördenrückmeldung abwarten.',
    addPersons: ['Sebi'],
  })

  await updateTask('Sponsoring & Einladungen', 'Einladungen Ehrengäste verschicken', {
    detail: 'Briefe an DJK-Verband, BFV, BLSV, Bürgermeister/Gemeinderat, ehem. Vorstände DJK Ottenhofen, Neumeier Hias, SV Wörth/Hörlkofen. Verena übernimmt Versand (ab Vorstandssitzung 14.04.). Zeitnah!',
    addPersons: ['Verena', 'Hundi'],
  })

  await updateTask('Sponsoring & Einladungen', 'Sponsorenliste finalisieren', {
    detail: 'Bio Bauer Knauer und Wirgens (Jonas, Bauzaun) einladen. Weitere Sponsoren am 27.04. konkretisieren.',
  })

  await updateTask('Eintrittspreise & Karten', 'Kartenvorverkauf vorbereiten', {
    detail: '300 VVK-Tickets für 250€ bestellt (Hundi). Finale Besprechung in Vorstandssitzung 14.04. Paco verteilt VVK-Karten an Verkäufer.',
  })

  await updateTask('Eintrittspreise & Karten', 'Eintritt Freitag: finale Entscheidung', {
    detail: 'Sitzung 13.04.: frei oder 5€ (vertagt). Tendenz: kein Eintritt (Konkurrenz Poing).',
  })

  await updateTask('Personal & Helfer', 'Helferliste.de einrichten', {
    detail: 'Komplette Überarbeitung mit neuen Schichten Do–So (siehe Protokoll 13.04.). Julia Deutinger + Emma Anzenberger aus Liste entfernen (unter 15 Jahre).',
    addPersons: ['Sebi', 'Valli'],
  })

  await updateTask('Personal & Helfer', 'Personal Festsonntag (22-25 Pers.)', {
    detail: 'Petra hat 6 Personen organisiert (1 Schlittenträger, 3 mit Bedienerfahrung, 2 tbd). Schlittenkonzept als Plan B bestätigt (2m Schlitten, 2 Träger + 1 Kassierer pro Schlitten, 15–20 Essen). Jugendliche ab 15 dürfen tragen (nicht nach 22 Uhr, nicht hinter die Theke).',
    addPersons: ['Petra', 'Mirjam'],
  })

  await updateTask('Personal & Helfer', 'Bedienungen für Festsonntag (Lengdorf)', {
    detail: 'Simon Wiethaus bleibt als Option für externe Bedienungen. Zusätzlich/parallel beschlossen: Schlittenkonzept (Markus hat mit Simon gesprochen, der Tipp kam von dort). Musterteller + großen Schlitten beim Ernst anfragen.',
  })

  await updateTask('Sonstiges', 'Gottesdienst – Gestaltung', {
    detail: 'Bettina Ruhland gestaltet, Gemeindepfarrer hält. Kurzer Gottesdienst (Festbetrieb danach). Ministranten-Einteilung separat mit Alexandra.',
  })

  await updateTask('Sonstiges', 'WM-Übertragung (Viertelfinal)', {
    detail: 'Falls Deutschland im WM-Viertelfinal spielt → Übertragung im Zelt. Rudi Rauch kontaktieren (Technik). Verantwortlich: Thommy.',
    addPersons: ['Tommy'],
    removePersons: ['Marco'],
  })

  await updateTask('Turnier & Verein', 'Preisliste erstellen und einschweißen', {
    detail: 'A3-Plakate für die Theke. Druck bei Raffi oder Limbacher Regina, sobald Preise final.',
  })

  // [6] Neue Tasks --------------------------------------------------
  console.log('\n[6] Neue Tasks')

  await createTaskIfMissing('Getränke & Lieferanten', 'Universalgläser bei Ernst Rappold anfragen', {
    status: 'offen',
    detail: 'Ca. 100 Stk Universalgläser (Plastik oder Glas) für Prosecco und Weißwein. Sektflöten-Idee verworfen.',
    persons: ['Dani'],
  })

  await createTaskIfMissing('Getränke & Lieferanten', 'Weinprobe in Karlsdorf organisieren', {
    status: 'offen',
    detail: 'Weißwein-Probe in Karlsdorf (Dane\'s Kontakt). Verena fährt mit. Qualität vor Preis.',
    persons: ['Dani', 'Verena'],
  })

  await createTaskIfMissing('Getränke & Lieferanten', 'Prosecco-Bezug entscheiden', {
    status: 'offen',
    detail: 'Drei Optionen: 1) Schweiger (Sekt), 2) Valdo (Prosecco-Marke), 3) Christian (Weingroßhandel, Kontakt über Marco, Kommissionsware).',
    persons: ['Dani'],
  })

  await createTaskIfMissing('Getränke & Lieferanten', 'Obst für Cocktails besorgen', {
    status: 'offen',
    detail: 'Orangen, Limetten, Beeren für die Cocktail-Dekoration.',
    persons: ['Dani'],
  })

  await createTaskIfMissing('Essen & Küche', 'Musterteller bei Ernst Rappold holen', {
    status: 'offen',
    detail: 'Zwei Musterteller, um Schlitten-Maß bestimmen zu können. Achtung: Teller mit Rand stehen höher — Maß ändert sich dadurch.',
    persons: ['Mexx'],
  })

  await createTaskIfMissing('Essen & Küche', 'Schlitten organisieren (Ernst oder selber bauen)', {
    status: 'offen',
    detail: 'Großer 2m-Schlitten für Essensausgabe am Sonntag. Erst beim Ernst anfragen; zur Not selber bauen (Georg/Schorsch).',
    persons: ['Mexx'],
  })

  await createTaskIfMissing('Toiletten & Hygiene', 'Odlfassl Volumen + Leerungsfrequenz klären', {
    status: 'offen',
    detail: 'Mit Ale und Max Thalhammer (Junior) abstimmen: Volumen des Odlfassls, ob 2x täglich geleert werden muss, welche Vorbereitungen am Vereinsheim nötig sind.',
    persons: ['Valli', 'Sebi'],
  })

  await createTaskIfMissing('Zeltaufbau & Infrastruktur', 'Zeltanlieferung mit Otto Hainz klären', {
    status: 'offen',
    detail: 'Lieferdatum für das Festzelt bei Otto Hainz abstimmen.',
    persons: ['Sebi'],
  })

  await createTaskIfMissing('Security & Genehmigungen', 'Gemeinde nach Stand Landratsamt fragen', {
    status: 'offen',
    detail: 'Bis nächste Sitzung Rückmeldung von Gemeinde einholen zum Genehmigungsstand beim Landratsamt. Lisa (Gemeinde) meinte, es sei reine Unterschrifts-Formalität.',
    persons: ['Hundi'],
  })

  await createTaskIfMissing('Personal & Helfer', 'Kellnertaschen/Revolvertaschen auftreiben', {
    status: 'offen',
    detail: 'Bedarf: ca. 10 Revolvertaschen + Geldbeutel. Marcos Papa hat 5 Stück Geldbeutel. Weitere bei Christa Hock und anderen anfragen, auch beim Ernst Rappold. Jeder schaut im Umfeld.',
  })

  await createTaskIfMissing('Sonstiges', 'Ministranten-Einteilung mit Alexandra abstimmen', {
    status: 'offen',
    detail: 'Alexandra macht den Einteilungsplan und braucht min. 6 Wochen vorher Bescheid (= bis spätestens Ende Mai 2026). 7–8 Ministranten. Klären: Weihrauch/Weihwasser nötig? Umfang des Gottesdienstes?',
    persons: ['Hundi'],
  })

  await createTaskIfMissing('Sonstiges', 'Werbevideo mit Leon erstellen', {
    status: 'in_arbeit',
    detail: 'Erstes Werbevideo für das Fest. Hundi arbeitet mit Leon. Parallel: DJK-70-Jahr-Aufkleber bei kommenden Vereinsveranstaltungen verteilen (Frühschoppen, Busausflug …).',
    persons: ['Hundi'],
  })

  await createTaskIfMissing('Sonstiges', 'Sitzungsprotokoll 13.04. in App einpflegen', {
    status: 'in_arbeit',
    detail: 'Aus Transkript + Protokoll die Änderungen in die Web-App übertragen. (Automatisiert via prisma/migrate-sitzung-2026-04-13.ts.)',
    persons: ['Tommy'],
  })

  console.log('\n═══ Migration abgeschlossen ═══\n')
}

main()
  .catch(e => {
    console.error('Migration fehlgeschlagen:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
