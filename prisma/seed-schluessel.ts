// Startzustand für den Schlüssel-Bereich (/schluessel).
//
// WICHTIG: Dieses Repo ist öffentlich — der Seed enthält deshalb bewusst
// KEINE echten Daten der Schließanlage (keine Inhaber/Privatadressen, keine
// Gruppenbezeichnungen, keine Schließmatrix, keine Schloss-/Transponder-
// Nummern). Er legt nur das neutrale Grundgerüst an; alles Weitere wird in
// der App gepflegt oder einmalig über ein privates, nicht eingechecktes
// Importskript eingespielt.
//
// Idempotent (läuft gefahrlos bei jedem Deploy):
// 1. Einstellungen: upsert mit leerem update — spätere Nutzeränderungen
//    überleben.
// 2. Schlüsseltypen: nur beim allerersten Lauf (count-Guard) — in der App
//    angelegte/umbenannte Typen werden nie überschrieben.
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

// Neutrales Grundgerüst der ABUS-Anlage (General- + Gruppenschlüssel) und
// der Transponder Sporthalle. Bezeichnungen bleiben leer und werden in der
// App gepflegt (echte Gruppenzuordnungen gehören nicht ins öffentliche Repo).
const TYPEN: { system: string; code: string; bezeichnung: string; kategorie: string; sortier: number }[] = [
  { system: 'abus', code: 'GHS', bezeichnung: 'Generalschlüssel', kategorie: 'general', sortier: 0 },
  { system: 'abus', code: 'GS1', bezeichnung: '', kategorie: 'gruppe', sortier: 1 },
  { system: 'abus', code: 'GS2', bezeichnung: '', kategorie: 'gruppe', sortier: 2 },
  { system: 'abus', code: 'GS3', bezeichnung: '', kategorie: 'gruppe', sortier: 3 },
  { system: 'abus', code: 'GS4', bezeichnung: '', kategorie: 'gruppe', sortier: 4 },
  { system: 'abus', code: 'GS5', bezeichnung: '', kategorie: 'gruppe', sortier: 5 },
  { system: 'abus', code: 'GS6', bezeichnung: '', kategorie: 'gruppe', sortier: 6 },
  { system: 'transponder', code: 'Halle', bezeichnung: 'Transponder Sporthalle', kategorie: '', sortier: 0 },
]

async function main() {
  // 1. Einstellungen: nur anlegen, nie Nutzeränderungen überschreiben
  await prisma.schluesselEinstellung.upsert({
    where: { id: 'schluessel' },
    create: {
      id: 'schluessel',
      standardPfand: 20,
    },
    update: {},
  })

  // 2. Typen-Grundgerüst nur beim allerersten Lauf
  const vorhanden = await prisma.schluesselTyp.count()
  if (vorhanden > 0) {
    console.log(`Schlüssel-Seed: ${vorhanden} Typen vorhanden — nichts zu tun.`)
    return
  }
  for (const typ of TYPEN) {
    await prisma.schluesselTyp.create({ data: typ })
  }
  console.log(`Schlüssel-Seed: ${TYPEN.length} Schlüsseltypen als Grundgerüst angelegt.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
