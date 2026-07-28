# DJK Events (Veranstaltungs-App DJK SG Ottenhofen)

Diese Datei gibt Claude Code (claude.ai/code) Orientierung für die Arbeit in diesem Repo.
Sie ist die zentrale Projekt-Doku; ergänzend gibt es `README.md` (kurz) und
`ANLEITUNG-NEUE-VERANSTALTUNG.md` (Schritt-für-Schritt für den Nutzer).

## Projekt-Überblick

Interne **Orga- und Planungs-App** für die Veranstaltungen des **DJK SG Ottenhofen e.V.**
Kein öffentliches Tool — nur der Festausschuss meldet sich an (ein gemeinsames Passwort).

Seit dem Umbau Juli 2026 ist die App **mehrveranstaltungsfähig**: Eine Veranstaltung
ist ein Eintrag im Register `src/data/veranstaltungen.ts`; Menü, Übersichtsseite,
URLs und Daten-Scoping folgen automatisch. **Kein Copy-Paste von Seitencode.**

- **Live:** https://djk-ottenhofen-event.de (passwortgeschützt)
- Veranstaltungen aktuell: `jubilaeum-2026` (abgeschlossen, inkl. Abschlussbericht),
  `sommerfest-2027` (geplant)

## Tech-Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** (Dark-Sidebar-Layout, mobile-first)
- **Prisma 5** + **SQLite** (file-based DB `prisma/dev.db`, von Git ignoriert)
- **bcryptjs** (Passwort-Hash), eigenes HMAC-Cookie für die Session (kein next-auth)
- Fonts: lokale Geist-Fonts + **Archivo / Source Sans 3** via `next/font/google`
  (build-time self-hosted, für den Abschlussbericht)
- Deployment: **Hetzner web01**, pm2-Prozess `djk-ottenhofen-event`, **Port 3010**, nginx + Let's Encrypt

## Architektur: Vorlage + Register

**Register** `src/data/veranstaltungen.ts` — die zentrale Datei des Projekts:
- `Veranstaltung { id, titel, icon, jahr, zeitraum, status, bereiche, standNote?, startDate?, tage }`
- `bereiche` ⊆ `['festplanung', 'finanzplanung', 'abschlussbericht']` steuert,
  welche Unterseiten es gibt (Menü **und** URL; fehlender Bereich → 404).
- `tage` liefert die Festtage (ersetzt die früher hartkodierten Tages-Konstanten
  der Finanzplanung). `standNote` erzeugt die „Stand: …"-Zeile, `startDate` den
  Countdown im Header (nur solange in der Zukunft).

**Routen** (`src/app/`):

| Route | Datei | Inhalt |
|---|---|---|
| `/` | `page.tsx` | Übersicht: Kachel je Veranstaltung, Vergangene unten |
| `/[eventId]` | `[eventId]/page.tsx` | Mini-Startseite (Status, Zeitraum, Bereichs-Kacheln) |
| `/[eventId]/festplanung` | dünne Server-Page → `FestplanungView` | Aufgaben/Bereiche |
| `/[eventId]/finanzplanung` | dünne Server-Page → `FinanzplanungView` | 5 Tabs (Umsätze/Kosten/Spenden/Vergleich/Bericht) |
| `/[eventId]/abschlussbericht` | dünne Server-Page → `AbschlussberichtView` | Protokoll Abschlussbesprechung (nur Jubiläum) |

`[eventId]/layout.tsx` validiert die ID (unbekannt → `notFound()`); die einzelnen
Pages prüfen zusätzlich das Bereichs-Gate (`event.bereiche.includes(...)`).

**Templates** (`src/components/veranstaltungen/`): `FinanzplanungView.tsx` und
`FestplanungView.tsx` sind Client-Komponenten mit Prop `{ event: Veranstaltung }` —
sie holen ihre Daten mit `?event=<id>` und schreiben `eventId` in POST-Bodies.
`AbschlussberichtView.tsx` (Server) + `abschlussbericht.module.css` (gekapseltes
CSS Module; Vereinsfarben aus den `--djk-*`-Variablen in `globals.css`).
`AnmerkungenPanel.tsx` (Client): sticky Anmerkungs-Balken im Abschlussbericht —
Formular (Name, TOP inkl. „Sonstiges", abhängiger Unterpunkt, Text) + für alle
sichtbare Liste. Liegt bewusst außerhalb von `.va-sheet` (overflow:hidden würde
sticky brechen); `<main>` darf deshalb auch kein overflow-auto bekommen.

**Umsätze** sind bewusst NICHT in der DB: `src/lib/umsaetze.ts` exportiert
`UMSAETZE` als Record je Veranstaltung (Jubiläum = Endstand Kassen-Excel
22.07.2026). Veranstaltung ohne Eintrag → Leerzustand-Hinweis in den Tabs.

**Navigation** (`src/components/Navigation.tsx`): registry-getrieben — Übersicht +
Veranstaltungen (neueste zuerst), Bereichs-Unterlinks der aktiven Veranstaltung
aufgeklappt. Ab ~4 Veranstaltungen auf ein „Veranstaltung wechseln"-Dropdown
umbauen (Kommentar im Code). `AppHeader.tsx` rendert die Brotkrümel-Zeile
„Übersicht › Titel › Bereich".

## Datenmodell (`prisma/schema.prisma`)

SQLite. **Event-Scoping:** `CostItem`, `Sponsor`, `Bereich`, `Person`, `Task`
tragen `eventId String @default("jubilaeum-2026")` (+ Index). `Beschluss` /
`TaskAssignment` erben über ihre Pflicht-FKs. Alle Schema-Änderungen müssen
**additiv mit Default** sein (Deploy nutzt `prisma db push`, kein `migrate`;
`prisma/migrations/` ist veraltet und wird nicht verwendet).

- **Auth:** `User` (Login-Passwort-Hashes).
- **Festplanung:** `Bereich`, `Person` (`isCatchAll` = „Nicht zugewiesen"),
  `Task`, `TaskAssignment`, `Beschluss`.
- **Finanzen:** `CostItem` (vatRate/amountEntry/dueDate/costType/status/eventDay),
  `Sponsor`.
- **Abschlussbericht:** `BerichtAnmerkung` (name, top z.B. "top3"/"sonstiges",
  unterpunkt?, text) — Besucher-Anmerkungen, für alle sichtbar.
- **Ohne UI (Daten bleiben erhalten):** `Product`, `Inventory`, `SalesEntry`,
  `SalesEstimate` (frühere Warenwirtschaft, UI im Juli 2026 entfernt),
  `Team`, `Participant` (Watt-Turnier), `SimpleForecast`, `EntryForecast`,
  `ForecastEntry` (frühere Prognose-Seiten). Nicht löschen — Produktivdaten!

## API-Routen (`src/app/api/.../route.ts`)

- **Auth:** `auth/login` (nur Passwort, gegen alle User-Hashes), `auth/logout`.
- **Event-gescoped** (GET `?event=`, POST-Body `eventId`, Default `jubilaeum-2026`):
  `bereiche[/id]`, `personen[/id]`, `tasks[/id]`, `costs`, `sponsors`, `anmerkungen`.
- `[id]`-Routen sind unverändert ungescoped (cuid ist global eindeutig).

## Authentifizierung

- Reines **Passwort-Login**; Session = HMAC-Cookie `djk_auth` (`lib/auth.ts`),
  30 Tage, signiert mit **`AUTH_SECRET`** (Web-Crypto, edge-kompatibel).
- `src/middleware.ts` schützt alles außer `/login` + Auth-APIs — auch alle
  neuen `/[eventId]`-Routen (Matcher greift automatisch).
- Seed-User: **`DJKalle` / `DJKistsuper`** (Rolle admin).

## Umgebungsvariablen (`.env`, gitignored)

| Variable       | Zweck                                              |
|----------------|----------------------------------------------------|
| `DATABASE_URL` | SQLite-Pfad, z. B. `file:./dev.db`                 |
| `AUTH_SECRET`  | HMAC-Schlüssel für das Session-Cookie (zwingend!)  |

## Lokale Entwicklung

```bash
npm install
npx prisma generate
npx prisma db push               # Schema → SQLite
npx tsx prisma/seed-user.ts      # Login-User
npm run db:seed                  # Festplanung Jubiläum (+ Watt-Demo)
npm run db:seed:sommerfest-2027  # Startzustand Sommerfest
npm run dev                      # http://localhost:3000
```

## Seeds (`prisma/`)

- **`seed.ts`** (`npm run db:seed`) — Festplanung **nur Jubiläum 2026**
  (deleteMany ist eventId-gescoped, andere Veranstaltungen bleiben unberührt).
- **`seed-sommerfest-2027.ts`** — Standard-Bereiche + Catch-All-Person für 2027;
  idempotent (no-op, sobald Bereiche existieren). **Läuft beim Auto-Deploy.**
  Vorlage für künftige Veranstaltungen (siehe ANLEITUNG-NEUE-VERANSTALTUNG.md).
- **`seed-user.ts`** — idempotenter Login-User-Seed.
- **`seed-anfangsbestand-2026-07-07.ts`** — Inventur-Anfangsbestand Fest 2026
  (Warenwirtschaft-Daten; UI entfernt, Skript bleibt marker-geschützt im Deploy).
- `db:reset` = `prisma db push --force-reset && db:seed` (die alten
  `prisma/migrations/` sind bewusst NICHT im Einsatz).

## URLs & Redirects

Alle Alt-URLs der Ein-Fest-Ära leiten permanent (308) weiter — Tabelle in
`next.config.mjs`:

- `/finanzen` → `/jubilaeum-2026/finanzplanung`; `/festplanung` → `/jubilaeum-2026/festplanung`
- `/kosten`, `/sponsoring`, `/uebersicht`, `/planer`, `/prognose` → `/jubilaeum-2026/finanzplanung`
- `/teilnehmer` → `/jubilaeum-2026/festplanung`
- `/waren[/inventur|/verkauf]`, `/bestand`, `/inventur`, `/getraenke[/katalog]`,
  `/produkte`, `/protokolle` → `/jubilaeum-2026`

Redirects laufen **vor** der Auth-Middleware; das Ziel ist normal geschützt.

## Deployment & Git-Workflow

Auto-Deploy via GitHub Actions (`.github/workflows/deploy.yml`): **Push auf `main`**
→ SSH zu **web01** → `git checkout -f -B main origin/main`, `npm install`,
`prisma generate`, `prisma db push --accept-data-loss`, Anfangsbestand- +
Sommerfest-2027-Seed (beide idempotent), `npm run build`, `pm2 restart`.

- Server-Pfad `/var/www/djk-ottenhofen-event/app`, pm2 `djk-ottenhofen-event`, Port **3010**.
- **Doku-/Nicht-Deploy-Commits mit `[skip ci]` versehen.**
- Üblicher Ablauf: Branch → committen → pushen → PR nach `main` → mergen (= Deploy).

## Konventionen

- **Deutsch** in UI, Doku und Commits.
- Mobile-first; im echten Browser/Handy gegenprüfen, nicht nur Build/Typecheck.
- Veranstaltungsspezifisches gehört ins **Register** (`src/data/veranstaltungen.ts`),
  nicht in Komponenten. Neue Veranstaltung = Register-Eintrag + optionaler Seed.
- DB-Backups (`*.db.backup*`) und `.env` sind gitignored; nie committen.

## ⚠️ Stolpersteine / Bekannte Eigenheiten

- **Niemals direkt auf dem Server editieren.** Der Deploy setzt das Arbeitsverzeichnis
  hart auf `origin/main` (`git checkout -f`) — Server-Edits gehen verloren.
  *Hintergrund (Juni 2026):* wochenlang „grüne" Deploys ohne neuen Code, weil
  `git pull` an Server-Edits scheiterte; seitdem `checkout -f` + `set -e`.
- **`prisma/migrations/` ist tot.** Nur `schema.prisma` zählt; Schema-Änderungen
  additiv mit Default (SQLite + `db push --accept-data-loss` auf dem Server).
- **Abschlussbericht-CSS bleibt im CSS Module.** Keine globalen Selektoren
  (`*`, `body`, `:root`) hineinschreiben — das Original-HTML hatte sie, sie
  wurden beim Einbau bewusst entfernt/gescoped.
- **Warenwirtschaft/Alt-Seiten sind entfernt** (Juli 2026), ihre DB-Daten
  existieren weiter. Bei Bedarf im Git-Verlauf: Stand vor dem Umbau-Merge.
- **nginx:** aktiv ist Port **3010** (`sites-enabled`); `sites-available` enthält
  eine veraltete Kopie mit Port 3000. Alter systemd-Dienst `djk-fest.service` verwaist.
