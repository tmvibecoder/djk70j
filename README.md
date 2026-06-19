This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Deployment

Auto-Deploy via GitHub Actions (`.github/workflows/deploy.yml`): Push auf `main` -> SSH (Key-basiert) zum Server **web01** -> `git fetch origin main` + `git checkout -f -B main origin/main` + `npm install` + `npx prisma generate` + `npx prisma db push --accept-data-loss` + `npm run build` + `pm2 restart djk-ottenhofen-event`. Das Skript läuft mit `set -e`, bricht also bei jedem Fehler ab.

- Next.js-App, laeuft unter pm2 als `djk-ottenhofen-event` auf **Port 3010** (nginx proxyt dorthin). Server-Pfad `/var/www/djk-ottenhofen-event/app`.
- Genutzte Secrets: `SERVER_IP`, `SERVER_USER`, `SSH_PRIVATE_KEY` (gemeinsamer Deploy-Key auf web01). Obsolete Secrets `SSH_HOST`/`SSH_USER`/`SSH_PASSWORD` wurden geloescht.
- **Schema-Sync:** SQLite-DB (`prisma/dev.db`, file-based, von Git ignoriert). Der Deploy gleicht das Schema per `prisma db push` ab — additive Änderungen (neue Spalten mit Default) sind dadurch ohne Migration sicher.
- Der alte systemd-Dienst `djk-fest.service` (Port 3000) ist verwaist und wurde gestoppt + disabled (frueheres `sshpass`/`systemctl`-Deploy schlug seit April fehl).
- Stolperfalle: `nginx sites-available/djk-ottenhofen-event` ist eine veraltete Kopie mit Port 3000; aktiv (sites-enabled) ist Port 3010.
- Doku-Commits, die NICHT deployen sollen, mit `[skip ci]` versehen.

### ⚠️ Niemals direkt auf dem Server an den Dateien editieren

Der Deploy setzt das Arbeitsverzeichnis hart auf `origin/main` (`git checkout -f`). Alle Änderungen ausschließlich über Git/PRs nach `main` bringen — nicht im Server-Verzeichnis `…/app` editieren.

Hintergrund (Juni 2026): Es wurde länger direkt auf dem Server editiert (gebindebasierte Inventur). Das frühere Deploy-Skript nutzte `git pull` **ohne** `set -e`; durch die lokalen Server-Änderungen brach `git pull` ab, das Skript lief aber weiter und meldete „success" — es wurde **wochenlang kein neuer Code deployt**, obwohl jeder Lauf grün war. Der Server-Stand wurde als Branch `server-live-stand` in Git gesichert und in `main` integriert; das Skript wurde auf `checkout -f` + `set -e` umgestellt, damit so etwas nicht erneut passiert.

## Warenwirtschaft & Inventur

Reiter **Warenwirtschaft** (`/waren`) mit Unter-Seiten Katalog (`/waren`), Inventur (`/waren/inventur`), Verkauf (`/waren/verkauf`).

### Datenmodell (`prisma/schema.prisma`)

- **`Product`**
  - `trackInventory` — `false` = Katalog/Verkaufsware, `true` = Inventur-Artikel (eingekaufte Ware). Filter über `GET /api/products?inventory=true|all`.
  - `packSize` / `packLabel` — Gebindegröße (z. B. 12 = Träger à 12; `0` = Einzelware) und Bezeichnung. Gezählt wird in vollen Gebinden + losen Flaschen.
  - `isCritical` — kritisches Getränk: in der Inventur hervorgehoben/oben angepinnt, häufiger zählen.
- **`Inventory`** — eine Zählung pro Produkt und Zeitpunkt
  - `quantity` = Gesamtflaschen (`packs * packSize + loose`), dazu `packs` / `loose`.
  - `session` — Zählzeitpunkt-Key, siehe unten. Upsert erfolgt pro `(productId, session)`.

### Zählzeitpunkte (Sessions)

Flexibel aus **Tag + Uhrzeit** gewählt; Key-Format `"<tag>@HH:MM"`, z. B. `friday@17:15`. So sind mehrere Zählungen pro Tag möglich (z. B. Fr 17:15 und 20:30).

- Tage: `wednesday … monday` (`INVENTORY_DAYS`), Donnerstag = `INVENTORY_START_DAY`. Uhrzeit-Raster 15/30 Min via `buildTimeSlots`.
- Sortierung/Verbrauch über `inventorySessionRank()` (Tag- + Uhrzeit-Rang) — **abwärtskompatibel** zu den alten festen Sessions (`COUNT_SESSIONS`: `anlieferung`, `freitag`, `samstag_frueh/_spaet`, `sonntag`, `montag`). Alle Helfer in `src/types/index.ts`.
- **Verbrauch** = erste erfasste Zählung (= Anlieferung/Start + Lieferungen) − zuletzt erfasste Zählung. Werte auf EK-Basis. Berechnung in `src/app/api/inventory/summary/route.ts`.

### Erfassung (mobile-first, `src/app/waren/inventur/page.tsx`)

- Zeitpunkt: Tag-Buttons (Mi/Do(START)/Fr/Sa/So/Mo) + Uhrzeit-Dropdown (15-/30-Min-Takt).
- Modi **Liste** und **Helfer-Tour** (ein Getränk pro Screen); **Blind**-Zählung (Soll aus/an); Autosave (debounced, `PUT /api/inventory` mit `session`).
- Getränke-Auswahl: Suche + „Nur kritische"-Filter; kritisch umschalten per Stern (`PATCH /api/products/[id]`, ändert nur `isCritical`, keine Preise).
- **Übersicht**: Warenwert (EK), Verbrauch, Bestand je Getränk inkl. „niedrig"-Warnung.

### Seeds

- `prisma/seed-dabberger.ts` — Inventur-Artikel (Auftragsbestätigung Dabberger) inkl. Anlieferungs-Startbestand (Session `anlieferung`). Idempotent (löscht zuvor alle `trackInventory`-Artikel).
- `prisma/seed-user.ts` — Login-User (idempotent, läuft im Deploy).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
