// Startzustand für den Dauerkarten-Bereich (/dauerkarten).
//
// WICHTIG: Dieses Repo ist öffentlich — der Seed enthält deshalb bewusst
// KEINE echten Inhaberdaten. Er legt nur die Einstellungen und die erste
// Saison an; die Karteninhaber werden in der App gepflegt oder einmalig
// über ein privates, nicht eingechecktes Importskript eingespielt.
//
// Idempotent (läuft gefahrlos bei jedem Deploy):
// 1. Einstellungen: upsert mit leerem update — Nutzeränderungen überleben.
// 2. Saison 2026/27: nur beim allerersten Lauf (count-Guard) — später in
//    der App angelegte/umbenannte Saisons werden nie angefasst.
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  // 1. Einstellungen: nur anlegen, nie Nutzeränderungen überschreiben
  // (Defaults für Verteiler/Drucker/Lieferant stehen im Schema)
  await prisma.dkEinstellung.upsert({
    where: { id: 'dauerkarten' },
    create: { id: 'dauerkarten' },
    update: {},
  })

  // 2. Erste Saison nur anlegen, wenn noch gar keine existiert
  const anzahl = await prisma.dkSaison.count()
  if (anzahl === 0) {
    await prisma.dkSaison.create({
      data: { bezeichnung: '2026/27', aktiv: true, preisNormal: 40, preisErmaessigt: 35 },
    })
    console.log('Dauerkarten: Saison 2026/27 angelegt')
  }
  console.log('Dauerkarten-Seed fertig')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
