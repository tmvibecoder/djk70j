// Idempotente Warenwirtschafts-Katalog-Migration nach der Sitzung vom 13. April 2026.
// Übernimmt die im Protokoll festgelegten Getränkepreise.
// Safe to re-run: matched per Produkt-Name, updated nur bei Unterschieden.

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

type CatalogEntry = {
  name: string
  category: string
  unit: string
  salePrice: number
  purchasePrice?: number // optional — wenn gesetzt und Produkt neu: verwenden; bei update NIE überschrieben
  isActive?: boolean
  renameFrom?: string // wenn gesetzt: altes Produkt umbenennen statt neu anlegen
}

// ─── Ziel-Katalog laut Protokoll 13.04. ──────────────────────────────────────
const CATALOG: CatalogEntry[] = [
  // Alkoholfrei
  { name: 'Wasser (0,5l)',         category: 'Softdrinks', unit: 'Flasche', salePrice: 2.50 },
  { name: 'Weißes Limo (0,5l)',    category: 'Softdrinks', unit: 'Flasche', salePrice: 3.00 },
  { name: 'Apfelschorle (0,5l)',   category: 'Softdrinks', unit: 'Flasche', salePrice: 3.00 },
  { name: 'Spezi/Cola (0,5l)',     category: 'Softdrinks', unit: 'Flasche', salePrice: 3.00 },

  // Bier
  { name: 'Helles (0,33l)',        category: 'Bier & Radler', unit: 'Flasche', salePrice: 3.00, purchasePrice: 0.55 },
  { name: 'Halbe (0,5l)',          category: 'Bier & Radler', unit: 'Glas',    salePrice: 4.00 },
  { name: 'Radler (0,5l)',         category: 'Bier & Radler', unit: 'Glas',    salePrice: 4.00 },
  { name: 'Weißbier (0,5l)',       category: 'Bier & Radler', unit: 'Glas',    salePrice: 4.00 },
  { name: 'Russ (0,5l)',           category: 'Bier & Radler', unit: 'Glas',    salePrice: 4.00, purchasePrice: 0.80 },
  { name: 'Mass Helles (1,0l)',    category: 'Bier & Radler', unit: 'Mass',    salePrice: 8.00, purchasePrice: 1.60 },

  // Wein & Sekt
  { name: 'Prosecco (0,1l)',       category: 'Wein & Sekt', unit: 'Glas',    salePrice: 3.00,  renameFrom: 'Sekt (0,1l)' },
  { name: 'Prosecco-Flasche (0,7l)', category: 'Wein & Sekt', unit: 'Flasche', salePrice: 18.00, purchasePrice: 0 },
  { name: 'Weißwein-Flasche (0,75l)', category: 'Wein & Sekt', unit: 'Flasche', salePrice: 20.00, purchasePrice: 0 },
  { name: 'Weinschorle (0,33l Flasche)', category: 'Wein & Sekt', unit: 'Flasche', salePrice: 4.00, purchasePrice: 0 },

  // Longdrinks — alle einheitlich 7€
  { name: 'Aperol Spritz',         category: 'Longdrinks', unit: 'Becher 0,5l', salePrice: 7.00 },
  { name: 'Cuba Libre',            category: 'Longdrinks', unit: 'Becher 0,5l', salePrice: 7.00 },
  { name: 'Rüscherl',              category: 'Longdrinks', unit: 'Becher 0,5l', salePrice: 7.00, purchasePrice: 0 },
  { name: 'Vodka Bull',            category: 'Longdrinks', unit: 'Becher 0,5l', salePrice: 7.00, purchasePrice: 0 },
  { name: 'Vodka Lemon',           category: 'Longdrinks', unit: 'Becher 0,5l', salePrice: 7.00, purchasePrice: 0 },
  { name: 'Fanta Korn',            category: 'Longdrinks', unit: 'Becher 0,5l', salePrice: 7.00, purchasePrice: 0 },
  { name: 'Lillet Wild Berry',     category: 'Longdrinks', unit: 'Becher 0,5l', salePrice: 7.00, purchasePrice: 0 },
  { name: 'Gießkanne (3–5l, Wunsch-Longdrink)', category: 'Longdrinks', unit: 'Kanne', salePrice: 50.00, purchasePrice: 26.00 },
]

// Produkte, die gemäss Protokoll nicht mehr angeboten werden (deaktivieren, nicht löschen,
// damit bestehende Verkaufs-/Bestandsdaten referenzierbar bleiben).
const DEACTIVATE: string[] = [
  'Weinschorle (0,5l)', // alt: offen gemischt im Glas; neu: nur noch 0,33l Flasche
]

// ─── Haupt ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n═══ Katalog-Migration 2026-04-13 ═══\n')

  // [1] Rename-Pass (vor allem für "Sekt (0,1l)" → "Prosecco (0,1l)")
  console.log('[1] Renames')
  for (const entry of CATALOG) {
    if (!entry.renameFrom) continue
    const old = await prisma.product.findFirst({ where: { name: entry.renameFrom } })
    if (!old) {
      console.log(`  = kein altes Produkt "${entry.renameFrom}" vorhanden (vermutlich schon umbenannt)`)
      continue
    }
    const already = await prisma.product.findFirst({ where: { name: entry.name } })
    if (already && already.id !== old.id) {
      console.log(`  ! "${entry.name}" existiert schon — "${entry.renameFrom}" wird stattdessen deaktiviert`)
      await prisma.product.update({ where: { id: old.id }, data: { isActive: false } })
      continue
    }
    await prisma.product.update({ where: { id: old.id }, data: { name: entry.name } })
    console.log(`  ~ "${entry.renameFrom}" → "${entry.name}"`)
  }

  // [2] Upsert-Pass — für alle Einträge im CATALOG
  console.log('\n[2] Upsert Katalog')
  for (const entry of CATALOG) {
    const existing = await prisma.product.findFirst({ where: { name: entry.name } })
    if (existing) {
      const update: {
        category?: string
        unit?: string
        salePrice?: number
        isActive?: boolean
      } = {}
      if (existing.category !== entry.category) update.category = entry.category
      if (existing.unit !== entry.unit) update.unit = entry.unit
      if (existing.salePrice !== entry.salePrice) update.salePrice = entry.salePrice
      if (entry.isActive !== undefined && existing.isActive !== entry.isActive) update.isActive = entry.isActive
      // Reaktivieren, falls inaktiv
      if (!existing.isActive && entry.isActive !== false) update.isActive = true
      if (Object.keys(update).length > 0) {
        await prisma.product.update({ where: { id: existing.id }, data: update })
        console.log(`  ~ "${entry.name}" geupdated (${Object.keys(update).join(', ')})`)
      } else {
        console.log(`  = "${entry.name}" unverändert`)
      }
    } else {
      await prisma.product.create({
        data: {
          name: entry.name,
          category: entry.category,
          unit: entry.unit,
          salePrice: entry.salePrice,
          purchasePrice: entry.purchasePrice ?? 0,
          isActive: entry.isActive ?? true,
        },
      })
      console.log(`  + "${entry.name}" angelegt (VK ${entry.salePrice.toFixed(2)}€)`)
    }
  }

  // [3] Deaktivieren
  console.log('\n[3] Veraltete Produkte deaktivieren')
  for (const name of DEACTIVATE) {
    const prod = await prisma.product.findFirst({ where: { name } })
    if (!prod) {
      console.log(`  = "${name}" nicht vorhanden`)
      continue
    }
    if (!prod.isActive) {
      console.log(`  = "${name}" bereits inaktiv`)
      continue
    }
    await prisma.product.update({ where: { id: prod.id }, data: { isActive: false } })
    console.log(`  - "${name}" deaktiviert`)
  }

  console.log('\n═══ Katalog-Migration abgeschlossen ═══\n')
}

main()
  .catch(e => {
    console.error('Katalog-Migration fehlgeschlagen:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
