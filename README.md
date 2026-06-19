# DJK Ottenhofen – 70 Jahre (Fest-Planungs-App)

Interne Orga- und Planungs-App für das 70-jährige Jubiläumsfest des **DJK Ottenhofen e.V.**
(Finanzplanung, Festplanung, Warenwirtschaft). Next.js 14 + Prisma/SQLite, passwortgeschützt.

- **Live:** https://djk-ottenhofen-event.de
- **Festzeitraum:** 9.–12. Juli 2026 (Do–So)

> **📖 Die vollständige Projekt-Doku steht in [`CLAUDE.md`](./CLAUDE.md)** — Architektur, Datenmodell,
> Module, Auth, Seeds, Deployment und Stolpersteine. Diese README ist nur der Kurz-Einstieg.

## Schnellstart (lokal)

```bash
npm install
npx prisma generate
npx prisma db push            # Schema → frische SQLite-DB
npx tsx prisma/seed-user.ts   # Login-User DJKalle anlegen
npm run db:seed               # Festplanung + Watt-Turnier seeden
npm run dev                   # http://localhost:3000
```

Eine `.env` mit `DATABASE_URL` (z. B. `file:./dev.db`) und `AUTH_SECRET` ist erforderlich.

## Deployment

Auto-Deploy via GitHub Actions (`.github/workflows/deploy.yml`): **Push auf `main`** → SSH (Key-basiert)
zu **web01** → `git checkout -f origin/main` + `npm install` + `prisma generate` + `prisma db push`
+ `npm run build` + `pm2 restart djk-ottenhofen-event`. Läuft mit `set -e`.
pm2-Prozess `djk-ottenhofen-event`, **Port 3010**, Pfad `/var/www/djk-ottenhofen-event/app`.

Doku-/Nicht-Deploy-Commits mit `[skip ci]` versehen.

### ⚠️ Niemals direkt auf dem Server an den Dateien editieren

Der Deploy setzt das Arbeitsverzeichnis hart auf `origin/main` (`git checkout -f`) — Server-Edits gehen
verloren. **Alle Änderungen ausschließlich über Git/PRs nach `main`.** Hintergrund zum wochenlangen
stillen Deploy-Fehlschlag (Juni 2026) siehe [`CLAUDE.md`](./CLAUDE.md) und `docs/db-migration-handoff.md`.
