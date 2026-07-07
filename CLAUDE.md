# DJK Ottenhofen – 70 Jahre (Fest-Planungs-App)

Diese Datei gibt Claude Code (claude.ai/code) Orientierung für die Arbeit in diesem Repo.
Sie ist die zentrale Projekt-Doku; ergänzend gibt es nur die kurze `README.md`.

## Projekt-Überblick

Interne **Orga- und Planungs-App** für das 70-jährige Jubiläumsfest des **DJK Ottenhofen e.V.**
Kein öffentliches Tool — nur der Festausschuss meldet sich an. Drei fachliche Bereiche:
**Finanzplanung**, **Festplanung** (Aufgaben/Bereiche) und **Warenwirtschaft** (Katalog, Inventur, Verkauf).

- **Live:** https://djk-ottenhofen-event.de (passwortgeschützt)
- **Festzeitraum:** 9.–12. Juli 2026 (Do–So), Aufbau Mo/Di (6./7. Juli)
  - Do 9.7. — Watt-Turnier
  - Fr 10.7. — Disco-Party mit DJ Josch
  - Sa 11.7. — Festzeltparty mit „Drunter & Drüber"
  - So 12.7. — Bayrischer Festsonntag
  - (Festtage/Labels zentral in `src/types/index.ts`: `ALL_DAY_LABELS`, `EVENT_DAY_EVENTS`.)

## Tech-Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** (Dark-Sidebar-Layout, mobile-first)
- **Prisma 5** + **SQLite** (file-based DB `prisma/dev.db`, von Git ignoriert)
- **recharts** (Diagramme Finanzen/Prognose)
- **bcryptjs** (Passwort-Hash), eigenes HMAC-Cookie für die Session (kein next-auth)
- Deployment: **Hetzner web01**, pm2-Prozess `djk-ottenhofen-event`, **Port 3010**, nginx-Reverse-Proxy + Let's-Encrypt

## Projektstruktur (`src/`)

```
src/
  middleware.ts            # Auth-Gate (schützt alles außer /login + Auth-APIs)
  lib/
    auth.ts                # HMAC-signiertes Session-Cookie (edge-kompatibel)
    prisma.ts              # Prisma-Client-Singleton
  types/
    index.ts               # Tage/Labels, Kategorien, Inventur-Sessions & Helfer  ← oft gebraucht
    protokolle.ts          # Typen für die Festplanungs-Seed-Daten
  data/
    protokolle.ts          # Seed-Quelle Festplanung (BEREICHE, PERSONEN)
  components/
    Navigation.tsx         # Sidebar — definiert die 3 LIVE-Reiter (s.u.)
    AppHeader.tsx          # Kopfzeile
    ProtokollAufgabeModal.tsx
    ui/                    # Button, Card, Badge, Input, Select, Modal
  app/
    layout.tsx             # Root-Layout (Sidebar + Header), redirect / → /finanzen
    login/                 # Login-Seite (nur Passwort)
    finanzen/              # ► LIVE: Finanzplanung
    festplanung/           # ► LIVE: Aufgaben & Bereiche
    waren/                 # ► LIVE: Warenwirtschaft (layout + Katalog)
      inventur/            #          └ Inventur
      verkauf/             #          └ Verkauf
    api/                   # Route-Handler (REST), s.u.
    …                      # weitere page.tsx = VERWAISTE Legacy-Seiten (s. Stolpersteine)
```

### Live-Navigation (nur 3 Reiter)

In `src/components/Navigation.tsx` definiert — **nur diese drei Seiten sind aktiv verlinkt**:

| Reiter           | Route          | Unterseiten                                            |
|------------------|----------------|--------------------------------------------------------|
| 💰 Finanzplanung | `/finanzen`    | (Startseite, `/` leitet hierher)                       |
| 📝 Festplanung   | `/festplanung` | —                                                      |
| 📦 Warenwirtschaft | `/waren`     | `/waren` (Katalog), `/waren/inventur`, `/waren/verkauf` |

## Datenmodell (`prisma/schema.prisma`)

SQLite. Grob nach Modul gruppiert:

**Auth**
- `User` — Login-Benutzer (`username`, `passwordHash`, `role`).

**Warenwirtschaft**
- `Product` — Getränke/Speisen. Wichtig:
  - `trackInventory` — `false` = Katalog/Verkaufsware, `true` = Inventur-Artikel (eingekaufte Ware). Filter via `GET /api/products?inventory=true|all`.
  - `packSize` / `packLabel` — Gebindegröße (z. B. 12 = Träger à 12; `0` = Einzelware) + Bezeichnung. Gezählt wird in vollen Gebinden + losen Flaschen.
  - `isCritical` — kritisches Getränk → in der Inventur hervorgehoben/angepinnt, häufiger zählen.
- `Inventory` — eine Zählung pro Produkt **und** Zeitpunkt. `quantity = packs * packSize + loose`; dazu `packs` / `loose`; `session` = Zählzeitpunkt-Key (s. u.). Upsert pro `(productId, session)`.
- `SalesEntry` — protokollierte Verkäufe (Menge, `eventDay`, Erfasser). `SalesEstimate` — Verkaufsschätzung pro Produkt/Tag.

**Festplanung**
- `Bereich` (Musik, Getränke, Zelt …), `Person` (Festausschuss; `isCatchAll` = „Nicht zugewiesen"), `Task` (`status` offen/in_arbeit/erledigt), `TaskAssignment` (M:N Task↔Person), `Beschluss`.

**Finanzen / Prognose**
- `CostItem` (Kostenpositionen; `costType`, `status`, `dueDate`), `Sponsor`, `SimpleForecast` (Besucher × Umsatz/Person), `EntryForecast` (Eintritt), `ForecastEntry` (Legacy, pro Produkt).

**Watt-Turnier (Do)**
- `Team`, `Participant`.

## Zählzeitpunkte der Inventur (Sessions)

Der Zeitpunkt wird flexibel aus **Tag + Uhrzeit** gewählt; Key-Format `"<tag>@HH:MM"`, z. B. `friday@17:15`. Dadurch sind mehrere Zählungen pro Tag möglich (z. B. Fr 17:15 **und** 20:30). Alle Helfer in `src/types/index.ts`:

- Tage `wednesday … monday` (`INVENTORY_DAYS`), Do = `INVENTORY_START_DAY` (Fest-Start), Mi = Anlieferung davor, Mo = Abschluss danach.
- Uhrzeit-Raster 15/30 Min via `buildTimeSlots()`; Key bauen/zerlegen mit `makeSessionKey()` / `parseSessionKey()`.
- Sortierung/Verbrauch über `inventorySessionRank()` — **abwärtskompatibel** zu den alten festen Sessions (`COUNT_SESSIONS`: `anlieferung`, `freitag`, `samstag_frueh/_spaet`, `sonntag`, `montag`, gemappt in `LEGACY_SESSION_RANK`). Uhrzeiten vor 06:00 zählen zum Vorabend.
- Lesbares Label via `inventorySessionLabel()`.
- **Verbrauch** = erste erfasste Zählung (Anlieferung/Start + Lieferungen) − zuletzt erfasste Zählung; Werte auf EK-Basis. Berechnung in `src/app/api/inventory/summary/route.ts`.

### Inventur-Erfassung (mobile-first, `src/app/waren/inventur/page.tsx`)

- Zeitpunkt: Tag-Buttons (Mi/Do(START)/Fr/Sa/So/Mo) + Uhrzeit-Dropdown (15-/30-Min-Takt).
- Modi **Liste** und **Helfer-Tour** (ein Getränk pro Screen); **Blind**-Zählung (Soll aus/an); Autosave (debounced, `PUT /api/inventory` mit `session`).
- Getränke-Auswahl: Suche + „Nur kritische"-Filter; kritisch umschalten per Stern → `PATCH /api/products/[id]` (ändert **nur** `isCritical`, keine Preise).
- **Übersicht**: Warenwert (EK), Verbrauch, Bestand je Getränk inkl. „niedrig"-Warnung.

## API-Routen (`src/app/api/.../route.ts`)

- **Auth:** `auth/login` (nur Passwort, gegen alle User mit Hash geprüft), `auth/logout`.
- **Warenwirtschaft:** `products`, `products/[id]` (PUT voll / PATCH partiell), `products/sales`, `products/estimates`, `inventory`, `inventory/summary`.
- **Festplanung:** `bereiche[/id]`, `personen[/id]`, `tasks[/id]`, `beschluesse[/id]`.
- **Finanzen:** `costs`, `sponsors`, `simple-forecast`, `forecast`, `dashboard`.
- **Watt-Turnier:** `teams[/id]`, `participants[/id]`.

## Authentifizierung

- Reines **Passwort-Login** (kein Benutzername im UI). Das Passwort wird gegen alle `User` mit `passwordHash` geprüft (`api/auth/login`).
- Session = HMAC-signiertes Cookie `djk_auth` (`lib/auth.ts`), Format `userId.timestamp.hmac`, 30 Tage gültig. Signiert/verifiziert mit **`AUTH_SECRET`** (Web-Crypto, läuft auch in der Edge-Middleware).
- `src/middleware.ts` schützt **alles** außer `/login` und den Auth-APIs; API-Calls ohne Session → 401, Browser-Navigation → Redirect auf `/login?next=…`.
- Seed-User (s. u.): **`DJKalle` / `DJKistsuper`** (Rolle admin).

## Umgebungsvariablen (`.env`, gitignored)

| Variable       | Zweck                                              |
|----------------|----------------------------------------------------|
| `DATABASE_URL` | SQLite-Pfad, z. B. `file:./dev.db`                 |
| `AUTH_SECRET`  | HMAC-Schlüssel für das Session-Cookie (zwingend!)  |

> Ohne `AUTH_SECRET` wirft Login/Session einen Fehler (500). Auf dem Server **und** lokal setzen.

## Lokale Entwicklung

```bash
npm install
npx prisma generate
npx prisma db push          # Schema → frische SQLite-DB
npx tsx prisma/seed-user.ts # Login-User DJKalle anlegen
npm run db:seed             # Festplanung + Watt-Turnier seeden (prisma/seed.ts)
npx tsx prisma/seed-anfangsbestand-2026-07-07.ts   # optional: Inventur-Artikel + Anfangsbestand Fest
npm run dev                 # http://localhost:3000
```

`.env` mit `DATABASE_URL` und `AUTH_SECRET` muss vorhanden sein.

## Seeds (`prisma/`)

- **`seed.ts`** (`npm run db:seed`) — Festplanung (`Bereich`, `Person`, `Task`, `TaskAssignment`, `Beschluss`) + Watt-Turnier aus `src/data/protokolle.ts`. **Lässt `User`, `Product`, `Inventory`, `SalesEntry`, `SalesEstimate` bewusst unangetastet**, damit Katalog/Preise und Login bei Re-Seed erhalten bleiben.
- **`seed-user.ts`** — idempotenter Login-User-Seed (`DJKalle`). **Läuft bei jedem Deploy** (`scripts/deploy.sh`).
- **`seed-anfangsbestand-2026-07-07.ts`** — **Anfangsbestand zum Fest** (Lieferungen Schweiger + Daberger LS 2026-23142, angeliefert & geprüft am 07.07.2026). Ersetzt alle `trackInventory`-Artikel samt Zählungen und legt die Anlieferung als Startbestand an (Session `anlieferung`). **Läuft beim Auto-Deploy**, ist aber per Marker gegen Mehrfachausführung geschützt — spätere Fest-Zählungen bleiben erhalten. Fässer/Kästen ohne bekannte Flaschenzahl werden in ganzen Gebinden gezählt (`unit` = Fass/Kasten, `packSize 0`); Träger/Trays/WINZZ mit bekannter Gebindegröße in vollen Gebinden + losen Flaschen.
- **`seed-dabberger.ts`** — *veraltet, abgelöst durch `seed-anfangsbestand-2026-07-07.ts`*: Inventur-Artikel (Auftragsbestätigung Dabberger) inkl. Anlieferungs-Startbestand (Session `anlieferung`). **Löscht zuvor alle `trackInventory`-Artikel** (idempotent, aber destruktiv für Inventur-Stammdaten).
- `migrate-*.ts` — historische Einmal-Migrationsskripte (z. B. `migrate-katalog-2026-04-13.ts`); nicht erneut nötig.

## Deployment & Git-Workflow

Auto-Deploy via GitHub Actions (`.github/workflows/deploy.yml`): **Push auf `main`** → SSH (Key-basiert) zu **web01** → Skript mit `set -e`:

```
git fetch origin main
git checkout -f -B main origin/main      # hart auf origin/main (überschreibt lokale Server-Änderungen)
npm install
npx prisma generate
npx prisma db push --accept-data-loss --skip-generate   # additive Schema-Änderungen ohne Migration
npm run build
pm2 restart djk-ottenhofen-event
pm2 save
```

- Secrets: `SERVER_IP`, `SERVER_USER`, `SSH_PRIVATE_KEY` (gemeinsamer Deploy-Key auf web01). Obsolet & gelöscht: `SSH_HOST`/`SSH_USER`/`SSH_PASSWORD`.
- Server-Pfad `/var/www/djk-ottenhofen-event/app`, pm2-Prozess `djk-ottenhofen-event`, Port **3010**.
- **Doku-/Nicht-Deploy-Commits mit `[skip ci]` versehen**, damit kein unnötiger Deploy läuft.
- Üblicher Ablauf für Code-Änderungen: Branch → committen → pushen → PR nach `main` → mergen (= Deploy). Doku-Commits dürfen direkt nach `main` (mit `[skip ci]`).

## Konventionen

- **Deutsch** in UI, Doku und Commits.
- Mobile-first (Helfer bedienen die Inventur am Handy); im echten Browser/Handy gegenprüfen, nicht nur Build/Typecheck.
- Gemeinsame Konstanten (Tage, Labels, Kategorien, Sessions) zentral in `src/types/index.ts` halten — nicht in Seiten duplizieren.
- DB-Backups (`*.db.backup*`) und `.env` sind gitignored; nie committen.

## ⚠️ Stolpersteine / Bekannte Eigenheiten

- **Niemals direkt auf dem Server editieren.** Der Deploy setzt das Arbeitsverzeichnis hart auf `origin/main` (`git checkout -f`) — Server-Edits gehen verloren. Alle Änderungen über Git/PRs.
  - *Hintergrund (Juni 2026):* Es wurde länger direkt auf dem Server an der Inventur editiert. Das damalige Deploy-Skript nutzte `git pull` **ohne** `set -e`; durch die lokalen Änderungen brach `git pull` ab, das Skript lief aber weiter und meldete „success" → **wochenlang kein neuer Code deployt**, obwohl jeder Lauf grün war. Der Server-Stand wurde als Branch `server-live-stand` gesichert und in `main` integriert; Skript auf `checkout -f` + `set -e` umgestellt. Siehe auch `docs/db-migration-handoff.md` (historisch).
- **Verwaiste Legacy-Seiten:** Unter `src/app/` liegen viele `page.tsx`, die **nicht** in der Navigation hängen (`inventur`, `getraenke[/katalog]`, `produkte`, `bestand`, `uebersicht`, `planer`, `prognose`, `protokolle`, `sponsoring`, `teilnehmer`, `kosten`). Die echten, aktuellen Pendants liegen unter `/finanzen`, `/festplanung`, `/waren`. Bei Änderungen immer prüfen, ob man die **verlinkte** Seite bearbeitet.
- **nginx-Stolperfalle:** `sites-available/djk-ottenhofen-event` ist eine veraltete Kopie mit Port 3000; aktiv (`sites-enabled`) ist Port **3010**.
- **Alter systemd-Dienst** `djk-fest.service` (Port 3000) ist verwaist, gestoppt & disabled (früheres `sshpass`/`systemctl`-Deploy schlug seit April 2026 fehl).
- **SQLite ist file-based & gitignored** (`prisma/dev.db`): Produktivdaten bleiben beim Deploy erhalten; Schema-Abgleich nur additiv über `prisma db push` (neue Spalten brauchen Default).
