// Idempotente Datenmigration: benennt die Catchall-Person ("Helfer x")
// in "Nicht zugewiesen" um. Wird vom deploy.sh nach prisma db push aufgerufen.

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  const catchAll = await prisma.person.findFirst({ where: { isCatchAll: true } })
  if (!catchAll) {
    console.log('Keine Catchall-Person gefunden, nichts zu tun')
    return
  }
  if (catchAll.name === 'Nicht zugewiesen') {
    console.log('Catchall-Person heisst bereits "Nicht zugewiesen"')
    return
  }
  await prisma.person.update({
    where: { id: catchAll.id },
    data: { name: 'Nicht zugewiesen', initials: 'NZ' },
  })
  console.log(`Catchall-Person umbenannt: "${catchAll.name}" -> "Nicht zugewiesen"`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
