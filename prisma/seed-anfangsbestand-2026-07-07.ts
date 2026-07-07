import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

// Anfangsbestand zum Fest (09.–12.07.2026), angeliefert & geprüft am Di 07.07.2026.
// Quellen: Lieferung Schweiger + Lieferung Daberger (LS 2026-23142).
// Ersetzt ALLE bisherigen Inventur-Artikel und deren Zählungen (Cascade) und legt
// die Anlieferung als Startbestand an (Session "anlieferung").
//
// Läuft beim Deploy automatisch, ist aber gegen Mehrfachausführung geschützt:
// Wenn der Anlieferungs-Marker (MARKER in den Notes) schon existiert, passiert nichts —
// spätere Zählungen während des Fests werden also NICHT überschrieben.
//
// Zähl-Logik je Gebinde:
// - Fässer/Kästen ohne bekannte Flaschenzahl: unit = "Fass"/"Kasten", packSize 0,
//   quantity = Anzahl Gebinde (halbe Gebinde als Dezimalzahl möglich).
// - Träger/Trays/WINZZ mit bekannter Größe (z.B. 12×1,0): unit = Flasche/Fläschchen,
//   packSize gesetzt → gezählt wird in vollen Gebinden + losen Flaschen.
// - EK-Preise (pro Zähleinheit) aus der Dabberger-Auftragsbestätigung übernommen,
//   wo bekannt; sonst 0 → bitte nachpflegen, sonst stimmt der Warenwert nicht.

const MARKER = 'Anlieferung 07.07.2026 (Schweiger + Daberger LS 2026-23142)'

type Item = {
  name: string
  cat: string
  unit: string
  ek: number
  pack: number // 0 = ganze Gebinde/Einzelware zählen
  packLabel?: string
  packs: number | null // gezählte volle Gebinde (nur bei pack > 0)
  loose: number // lose Einheiten bzw. Gesamtzahl bei pack = 0
  artNr: string
  lieferant: 'Schweiger' | 'Daberger'
}

const ITEMS: Item[] = [
  // ── Lieferung Schweiger: Fässer (in ganzen Fässern zählen) ──────────────────
  { name: 'Helles Export 30 L',        cat: 'Fässer', unit: 'Fass', ek: 0, pack: 0, packs: null, loose: 2,  artNr: '000013', lieferant: 'Schweiger' },
  { name: 'Helles Export 50 L',        cat: 'Fässer', unit: 'Fass', ek: 0, pack: 0, packs: null, loose: 12, artNr: '000015', lieferant: 'Schweiger' },
  { name: 'Schmankerl Weiße 50 L',     cat: 'Fässer', unit: 'Fass', ek: 0, pack: 0, packs: null, loose: 8,  artNr: '000065', lieferant: 'Schweiger' },
  { name: 'Zitronen-Limonade 50 L',    cat: 'Fässer', unit: 'Fass', ek: 0, pack: 0, packs: null, loose: 6,  artNr: '000081', lieferant: 'Schweiger' },
  { name: 'Tafelwasser 50 L',          cat: 'Fässer', unit: 'Fass', ek: 0, pack: 0, packs: null, loose: 6,  artNr: '000087', lieferant: 'Schweiger' },
  { name: 'Frizzante / Perlwein 25 L', cat: 'Fässer', unit: 'Fass', ek: 0, pack: 0, packs: null, loose: 10, artNr: '000569', lieferant: 'Schweiger' },

  // ── Lieferung Schweiger: Kästen (in ganzen Kästen zählen) ───────────────────
  { name: 'Helles alkoholfrei 0,5 l',  cat: 'Kästen', unit: 'Kasten', ek: 0, pack: 0, packs: null, loose: 15,  artNr: '000105', lieferant: 'Schweiger' },
  { name: 'Weiße alkoholfrei 0,5 l',   cat: 'Kästen', unit: 'Kasten', ek: 0, pack: 0, packs: null, loose: 10,  artNr: '000106', lieferant: 'Schweiger' },
  { name: 'Helles Export 0,33 l',      cat: 'Kästen', unit: 'Kasten', ek: 0, pack: 0, packs: null, loose: 100, artNr: '000114', lieferant: 'Schweiger' },
  { name: 'Zitronen-Limo 0,5 l',       cat: 'Kästen', unit: 'Kasten', ek: 0, pack: 0, packs: null, loose: 10,  artNr: '000401', lieferant: 'Schweiger' },
  { name: 'Spezi 0,5 l',               cat: 'Kästen', unit: 'Kasten', ek: 0, pack: 0, packs: null, loose: 20,  artNr: '000406', lieferant: 'Schweiger' },
  { name: 'Quelle medium 0,5 l',       cat: 'Kästen', unit: 'Kasten', ek: 0, pack: 0, packs: null, loose: 50,  artNr: '000407', lieferant: 'Schweiger' },
  { name: 'Apfel-Schorle 0,5 l',       cat: 'Kästen', unit: 'Kasten', ek: 0, pack: 0, packs: null, loose: 30,  artNr: '000408', lieferant: 'Schweiger' },
  // WINZZ mit bekannter Kastengröße (12×0,33) → Flaschen-Zählung in Kästen + lose
  { name: 'WINZZ Weinschorle 0,33 l',  cat: 'Kästen', unit: 'Flasche', ek: 0, pack: 12, packLabel: 'Kasten', packs: 50, loose: 0, artNr: '000565', lieferant: 'Schweiger' },

  // ── Lieferung Schweiger: Sonstiges ──────────────────────────────────────────
  { name: 'Kohlensäure 10 kg', cat: 'Sonstiges', unit: 'Stück', ek: 0, pack: 0, packs: null, loose: 6, artNr: '000602', lieferant: 'Schweiger' },

  // ── Lieferung Daberger: Einzelflaschen ──────────────────────────────────────
  { name: 'Aperol 11% 1,0 l',                   cat: 'Spirituosen & Wein', unit: 'Flasche', ek: 14.70, pack: 0, packs: null, loose: 90, artNr: '101',  lieferant: 'Daberger' },
  { name: 'Sarti Rosa 17% 0,7 l',               cat: 'Spirituosen & Wein', unit: 'Flasche', ek: 0,     pack: 0, packs: null, loose: 48, artNr: '114',  lieferant: 'Daberger' },
  { name: 'Havana Club 3 Jahre 40% 1,0 l',      cat: 'Spirituosen & Wein', unit: 'Flasche', ek: 16.99, pack: 0, packs: null, loose: 30, artNr: '1208', lieferant: 'Daberger' },
  { name: 'Asbach Uralt 38% 1,0 l',             cat: 'Spirituosen & Wein', unit: 'Flasche', ek: 17.80, pack: 0, packs: null, loose: 60, artNr: '306',  lieferant: 'Daberger' },
  { name: 'Lillet Blanc 17% 0,75 l',            cat: 'Spirituosen & Wein', unit: 'Flasche', ek: 13.43, pack: 0, packs: null, loose: 30, artNr: '1706', lieferant: 'Daberger' },
  { name: 'Wodka Hausmarke 37,5% 1,0 l',        cat: 'Spirituosen & Wein', unit: 'Flasche', ek: 8.68,  pack: 0, packs: null, loose: 54, artNr: '1910', lieferant: 'Daberger' },
  { name: 'Korn Hausmarke 32% 1,0 l',           cat: 'Spirituosen & Wein', unit: 'Flasche', ek: 0,     pack: 0, packs: null, loose: 30, artNr: '936',  lieferant: 'Daberger' },
  { name: 'Chardonnay Edenkoben trocken 0,75 l', cat: 'Spirituosen & Wein', unit: 'Flasche', ek: 0,    pack: 0, packs: null, loose: 60, artNr: '6042', lieferant: 'Daberger' },
  { name: 'Energy Drink Hausmarke 1,5 l',       cat: 'Alkoholfrei', unit: 'Flasche', ek: 1.99, pack: 0, packs: null, loose: 36, artNr: '705', lieferant: 'Daberger' },

  // ── Lieferung Daberger: Träger (volle Träger + lose Flaschen zählen) ────────
  { name: 'Coca Cola 1,0 l',              cat: 'Alkoholfrei', unit: 'Flasche', ek: 16.79 / 12, pack: 12, packLabel: 'Träger', packs: 28, loose: 0, artNr: '4100', lieferant: 'Daberger' },
  { name: 'Fanta 1,0 l',                  cat: 'Alkoholfrei', unit: 'Flasche', ek: 16.79 / 12, pack: 12, packLabel: 'Träger', packs: 8,  loose: 0, artNr: '4110', lieferant: 'Daberger' },
  { name: 'Schweppes Bitter Lemon 1,0 l', cat: 'Alkoholfrei', unit: 'Flasche', ek: 10.91 / 6,  pack: 6,  packLabel: 'Träger', packs: 9,  loose: 0, artNr: '4030', lieferant: 'Daberger' },
  { name: 'Schweppes Wild Berry 1,0 l',   cat: 'Alkoholfrei', unit: 'Flasche', ek: 10.91 / 6,  pack: 6,  packLabel: 'Träger', packs: 9,  loose: 0, artNr: '4040', lieferant: 'Daberger' },

  // ── Lieferung Daberger: Trays (Shots; volle Trays + lose Fläschchen zählen) ─
  { name: 'Ficken Jostabeerenlikör 15% 2 cl', cat: 'Shots (Trays)', unit: 'Fläschchen', ek: 0, pack: 20, packLabel: 'Tray', packs: 12, loose: 0, artNr: '4103', lieferant: 'Daberger' },
  { name: 'Jägermeister 35% 2 cl',            cat: 'Shots (Trays)', unit: 'Fläschchen', ek: 0, pack: 24, packLabel: 'Tray', packs: 12, loose: 0, artNr: '4106', lieferant: 'Daberger' },
]

async function main() {
  console.log('Seede Anfangsbestand 07.07.2026 (Schweiger + Daberger)...')

  // Schutz gegen Mehrfachausführung (läuft bei jedem Deploy):
  const applied = await prisma.inventory.findFirst({
    where: { session: 'anlieferung', notes: { contains: MARKER } },
  })
  if (applied) {
    console.log('  Anfangsbestand bereits eingespielt — nichts zu tun.')
    return
  }

  // Alte Inventur-Artikel samt Zählungen entfernen (Cascade)
  const del = await prisma.product.deleteMany({ where: { trackInventory: true } })
  console.log(`  ${del.count} alte Inventur-Artikel (inkl. Zählungen) entfernt`)

  for (const it of ITEMS) {
    const quantity = it.pack > 0 ? (it.packs ?? 0) * it.pack + it.loose : it.loose

    const product = await prisma.product.create({
      data: {
        name: it.name,
        category: it.cat,
        purchasePrice: it.ek,
        salePrice: 0,
        unit: it.unit,
        isActive: true,
        trackInventory: true,
        packSize: it.pack,
        packLabel: it.pack > 0 ? (it.packLabel ?? 'Träger') : null,
      },
    })

    await prisma.inventory.create({
      data: {
        productId: product.id,
        quantity,
        packs: it.pack > 0 ? it.packs : null,
        loose: it.loose,
        session: 'anlieferung',
        eventDay: 'anlieferung',
        type: 'count',
        notes: `${MARKER} — ${it.lieferant}, Art. ${it.artNr}`,
      },
    })

    const gebinde = it.pack > 0 ? ` (${it.packs} ${it.packLabel ?? 'Träger'} à ${it.pack})` : ''
    console.log(`  + ${it.name}: ${quantity} ${it.unit}${gebinde}`)
  }

  const count = await prisma.product.count({ where: { trackInventory: true } })
  console.log(`Fertig. ${count} Inventur-Artikel mit Anfangsbestand angelegt.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
