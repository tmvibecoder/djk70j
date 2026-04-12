// Idempotente Datenmigration: alte Task-Status-Werte (open|in_progress|done)
// auf neue deutsche Werte (offen|in_arbeit|erledigt) umstellen.
// Wird vom deploy.sh nach `prisma db push` aufgerufen.

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  const r1 = await prisma.task.updateMany({ where: { status: 'open' }, data: { status: 'offen' } })
  const r2 = await prisma.task.updateMany({ where: { status: 'in_progress' }, data: { status: 'in_arbeit' } })
  const r3 = await prisma.task.updateMany({ where: { status: 'done' }, data: { status: 'erledigt' } })
  console.log(`Status migrated: ${r1.count} open→offen, ${r2.count} in_progress→in_arbeit, ${r3.count} done→erledigt`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
