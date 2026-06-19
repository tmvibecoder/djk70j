import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

// Getränke-Inventur aus der Auftragsbestätigung Dabberger 2026-14826 (10.06.2026).
// Preise = Einkaufspreis (EK) pro Flasche. Softdrinks werden in Trägern geliefert
// (packSize), gezählt wird in Trägern + losen Flaschen; quantity = Gesamtflaschen.
const ITEMS = [
  // Spirituosen & Aperitif (Einzelflaschen)
  { name: 'Aperol 11% 1,0 l',          cat: 'Spirituosen & Aperitif', ek: 14.70, pack: 0,  total: 102, packs: null, loose: 102 },
  { name: 'Havana Club 3 Jahre 1,0 l', cat: 'Spirituosen & Aperitif', ek: 16.99, pack: 0,  total: 30,  packs: null, loose: 30 },
  { name: 'Asbach Uralt 1,0 l',        cat: 'Spirituosen & Aperitif', ek: 17.80, pack: 0,  total: 60,  packs: null, loose: 60 },
  { name: 'Lillet Blanc 0,75 l',       cat: 'Spirituosen & Aperitif', ek: 13.43, pack: 0,  total: 30,  packs: null, loose: 30 },
  { name: 'Wodka Hausmarke 1,0 l',     cat: 'Spirituosen & Aperitif', ek: 8.68,  pack: 0,  total: 54,  packs: null, loose: 54 },
  // Alkoholfrei (Träger)
  { name: 'Coca Cola 1,0 l',            cat: 'Alkoholfrei', ek: 16.79 / 12, pack: 12, packLabel: 'Träger', total: 360, packs: 30, loose: 0 },
  { name: 'Fanta 1,0 l',                cat: 'Alkoholfrei', ek: 16.79 / 12, pack: 12, packLabel: 'Träger', total: 96,  packs: 8,  loose: 0 },
  { name: 'Schweppes Bitter Lemon 1,0 l', cat: 'Alkoholfrei', ek: 10.91 / 6, pack: 6, packLabel: 'Träger', total: 54, packs: 9, loose: 0 },
  { name: 'Schweppes Wild Berry 1,0 l',   cat: 'Alkoholfrei', ek: 10.91 / 6, pack: 6, packLabel: 'Träger', total: 54, packs: 9, loose: 0 },
  { name: 'Energy Drink 1,5 l',         cat: 'Alkoholfrei', ek: 1.99, pack: 0, total: 36, packs: null, loose: 36 },
]

async function main() {
  console.log('Seede Dabberger-Inventur-Artikel...')

  // Alte Inventur-Artikel (und deren Zählungen via Cascade) entfernen -> idempotent
  const del = await prisma.product.deleteMany({ where: { trackInventory: true } })
  console.log(`  ${del.count} alte Inventur-Artikel entfernt`)

  for (const it of ITEMS) {
    const product = await prisma.product.create({
      data: {
        name: it.name,
        category: it.cat,
        purchasePrice: it.ek,
        salePrice: 0,
        unit: 'Flasche',
        isActive: true,
        trackInventory: true,
        packSize: it.pack,
        packLabel: it.pack > 0 ? (it.packLabel ?? 'Träger') : null,
      },
    })

    // Anlieferung als Startbestand (Session "anlieferung")
    await prisma.inventory.create({
      data: {
        productId: product.id,
        quantity: it.total,
        packs: it.packs,
        loose: it.loose,
        session: 'anlieferung',
        eventDay: 'anlieferung',
        type: 'count',
        notes: 'Anlieferung Dabberger 10.06.2026',
      },
    })

    console.log(`  + ${it.name}: ${it.total} Fl (EK ${it.ek.toFixed(4)} €)`)
  }

  const count = await prisma.product.count({ where: { trackInventory: true } })
  console.log(`Fertig. ${count} Inventur-Artikel angelegt.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
