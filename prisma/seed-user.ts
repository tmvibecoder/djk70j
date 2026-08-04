// Idempotenter Admin-Seed. Stellt sicher, dass der Systemverwalter „Admin"
// existiert und istAdmin/aktiv gesetzt sind — das Passwort wird nur beim
// allerersten Anlegen gesetzt und nie überschrieben (Admin ändert es nach
// dem ersten Login über /mein-konto). Läuft bei jedem Deploy.

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: 'Admin' } })
  if (existing) {
    // istAdmin/aktiv absichern (z.B. nach Schema-Umbau), Passwort unangetastet
    if (!existing.istAdmin || !existing.aktiv) {
      await prisma.user.update({ where: { id: existing.id }, data: { istAdmin: true, aktiv: true } })
      console.log(`User 'Admin' repariert (istAdmin/aktiv gesetzt)`)
    } else {
      console.log(`User 'Admin' existiert bereits — überspringe`)
    }
    return
  }
  await prisma.user.create({
    data: {
      username: 'Admin',
      name: 'Admin',
      passwordHash: await bcrypt.hash('spielwiese', 10),
      istAdmin: true,
    },
  })
  console.log(`User 'Admin' angelegt (Systemverwalter)`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
