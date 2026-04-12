// Idempotenter Login-User-Seed.
// Legt DJKalle an, wenn er noch nicht existiert. Wird vom deploy.sh
// auf dem Server bei jedem Deploy aufgerufen — sicher mehrfach laufbar.

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

const SEED_USERS: Array<{ username: string; name: string; password: string; role: string }> = [
  { username: 'DJKalle', name: 'DJKalle', password: 'DJKistsuper', role: 'admin' },
]

async function main() {
  for (const u of SEED_USERS) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } })
    if (existing) {
      console.log(`User '${u.username}' existiert bereits — überspringe`)
      continue
    }
    const passwordHash = await bcrypt.hash(u.password, 10)
    await prisma.user.create({
      data: {
        username: u.username,
        name: u.name,
        passwordHash,
        role: u.role,
      },
    })
    console.log(`User '${u.username}' angelegt`)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
