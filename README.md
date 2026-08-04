# DJK Events (Veranstaltungs-App DJK SG Ottenhofen)

Interne Orga- und Planungs-App für die Veranstaltungen des **DJK SG Ottenhofen e.V.**
(je Veranstaltung: Festplanung, Finanzplanung, ggf. Abschlussbericht).
Next.js 14 + Prisma/SQLite, passwortgeschützt.

- **Live:** https://djk-ottenhofen-event.de
- **Veranstaltungen:** 70 Jahre Jubiläum 2026 (abgeschlossen), DJK Sommerfest 2027 (geplant)
- **Dauerhafte Bereiche** (unabhängig von Veranstaltungen, ein zentraler Benutzer-Login
  mit Rollen je Bereich): `/werbebanden` (Bandenwerbung am Sportplatz), `/schluessel`
  (Schlüsselverwaltung mit Finger-Signatur + PDF-Belegen) und `/djk-info`
  (Vereinszeitschrift: Anzeigenkunden, Rechnungen, Ausgaben, Heft-Verteilung mit
  DIN-A4-PDFs)
- **Neue Veranstaltung anlegen:** siehe [`ANLEITUNG-NEUE-VERANSTALTUNG.md`](./ANLEITUNG-NEUE-VERANSTALTUNG.md)

> **📖 Die vollständige Projekt-Doku steht in [`CLAUDE.md`](./CLAUDE.md)** — Architektur, Datenmodell,
> Module, Auth, Seeds, Deployment und Stolpersteine. Diese README ist nur der Kurz-Einstieg.

## Schnellstart (lokal)

```bash
npm install
npx prisma generate
npx prisma db push               # Schema → frische SQLite-DB
npx tsx prisma/seed-user.ts      # Login-User DJKalle anlegen
npm run db:seed                  # Festplanung Jubiläum 2026 seeden
npm run db:seed:sommerfest-2027  # Startzustand Sommerfest 2027
npm run db:seed:werbebanden      # Werbebanden-Startdaten
npm run db:seed:djk-info         # DJK-Info-Startdaten (Kunden, Verteilung)
npm run dev                      # http://localhost:3000
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
