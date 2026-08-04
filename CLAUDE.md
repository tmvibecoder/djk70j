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

Daneben gibt es den **dauerhaften Bereich `/werbebanden`** (Bandenwerbung am
Sportplatz) mit **eigenem Nur-Passwort-Login**, unabhängig von den
Veranstaltungen — siehe Abschnitt „Werbebanden-Bereich".

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

## Werbebanden-Bereich (`/werbebanden`, dauerhaft)

Verwaltung + Jahresabrechnung der Werbebanden am Sportplatz (ersetzt die frühere
Excel + Word-Serienbrief-Lösung). **Bewusst KEINE Veranstaltung** — eigener
Routen-Baum mit eigenem Layout (`src/app/werbebanden/layout.tsx` →
`WerbebandenShell`, helle Tab-Nav: Partner | Rechnungen | Platzübersicht |
Einstellungen). Sidebar/AppHeader der Event-App blenden sich auf
`/werbebanden/**` aus; für App-Nutzer gibt es in der Sidebar den Punkt „Werbebanden".

**Eigene Auth (`src/lib/banden-auth.ts`):** Nur-Passwort-Login, Cookie
`djk_banden_auth`. **Wichtig:** HMAC-Payload ist `banden-auth:${ts}` — bewusst
anderes Format als das App-Cookie, sonst würde ein Banden-Token die ganze App
öffnen (Middleware prüft nur Signaturen, keine DB). Banden-Cookie öffnet NUR
`/werbebanden/**`; App-Cookie öffnet zusätzlich auch den Banden-Bereich.
Das Bereichs-Passwort liegt als bcrypt-Hash in `WerbebandenEinstellung`
(Start: `keymaster`, per Seed; änderbar über die Einstellungs-Seite).

**Modelle:** `Werbepartner` (Kontakte, Ist-Länge vs. abgerechnete lfd. Meter,
Preis/m netto, Abschnitt 1–4 + PositionNr, Status aktiv/gekuendigt, Kündigung),
`WerbepartnerDatei` (Uploads), `WerbebandenRechnung` (editierbarer Snapshot,
Nummernkreis `jahr` + `laufnummer` → `2026/B/0001`, `src/lib/rechnungsnummer.ts`),
`WerbebandenEinstellung` (Singleton „werbebanden": DJK-Stammdaten für die
Rechnungs-PDF + passwordHash).

**Uploads** (Bandenfoto, Vertrag, Kündigungsschreiben; Vertrag/Kündigung auch
als Bilddatei): liegen in **`uploads/werbebanden/`** (gitignored → überlebt
Deploys wie `dev.db`), Helfer `src/lib/uploads.ts` (10-MB-Limit, MIME-Whitelist).
**Auslieferung nur über `/api/werbebanden/dateien/<id>` ohne Dateiendung** —
der Middleware-Matcher schließt URLs mit Punkt aus, eine Endung in der URL
würde die Auth umgehen!

**Rechnungs-PDF:** `src/lib/rechnung-pdf.ts` mit **pdf-lib** (kein headless
Chrome), Layout nach der offiziellen Briefvorlage (DJK_Vorlage_Brief.docx):
Wappen links + DJK-Verbandslogo rechts (Base64 in `src/lib/rechnung-assets.ts`),
Kassier-Kontaktblock und dreispaltige Fußzeile (Anschrift | Register/Vorstand |
Banken) kommen editierbar aus `WerbebandenEinstellung` (kopfKontaktblock,
fusszeileSpalte1–3; Seed rüstet leere Felder nach, überschreibt aber nie
Nutzereingaben). Rechnungslauf (`api/werbebanden/rechnungen/lauf`) überspringt
Partner, die für die Saison schon eine Rechnung haben.

**Platzabschnitte** in `src/data/werbebanden.ts`: 34 m / 26,88 m / 18 m +
17,5 m Zusatzfläche. Die Platzübersicht rechnet mit **Ist-Längen** (physisch),
die Abrechnung mit den **lfd. Metern** (können abweichen).

**Seed `prisma/seed-werbebanden.ts`** (läuft beim Auto-Deploy, idempotent):
Einstellungen per upsert (`update: {}` — überschreibt nie Nutzeränderungen),
Partner + Rechnungen 2025/2026 aus der Excel nur beim allerersten Lauf.

## Schlüssel-Bereich (`/schluessel`, dauerhaft)

Verwaltung der drei Schließsysteme des Vereins (ABUS-Anlage Sportheim,
Transponder Sporthalle, Schrankschlösser/Sonstige): Bestand, Inhaber,
Ausgabe/Rückgabe gegen Pfand mit **Finger-Signatur am Handy** und
Empfangsbestätigung als PDF. Aufbau 1:1 nach dem Werbebanden-Muster
(UI = Mockup „Variante 2 Kompakt-Tabellen" aus PR #40, Akzentfarbe Amber):
eigener Routen-Baum `src/app/schluessel/` → `SchluesselShell` mit Tabs
Bestand | Inhaber | Ausgabe | Schließplan | Belege | ⚙️, Views in
`src/components/schluessel/`.

**Eigene Auth (`src/lib/schluessel-auth.ts`):** Nur-Passwort-Login, Cookie
`djk_schluessel_auth`, HMAC-Payload `schluessel-auth:${ts}` (Domain-Präfix
wie beim Banden-Cookie — verhindert Cookie-Umkopieren zwischen Bereichen).
Schlüssel-Cookie öffnet NUR `/schluessel/**`; App-Cookie öffnet den Bereich
zusätzlich. Hash in `SchluesselEinstellung` (Start: `schluessel2026` per
Seed — **nach dem ersten Login ändern**, Einstellungs-Seite).

**Modelle** (alle `Schluessel…`-Präfix): `SchluesselTyp` (system
abus/transponder/schrank/sonstige + code, `@@unique([system, code])`) →
`SchluesselExemplar` (physische Kopie; status archiv/ausgegeben/keygarage/
verloren/gesperrt; Bestand = groupBy, keine Zähler), `SchluesselTuer` +
`SchluesselSchliessplanEintrag` (Schließmatrix), `SchluesselPerson` (eigene
Inhaberliste, getrennt vom Event-Modell `Person`), `SchluesselBeleg` (bündelt
mehrere Ausgaben gegen EINE Unterschrift; zwei benannte Relationen
AusgabeBeleg/RueckgabeBeleg), `SchluesselAusgabe`,
`SchluesselBestandsAenderung` (Journal), `SchluesselPfandBuchung`
(Pfandkasse = Summe), `SchluesselEinstellung` (Singleton "schluessel").

**Signatur + Hash:** `SignaturPad.tsx` (handgerollter Canvas, Pointer Events,
`touch-action: none`, dpr-Skalierung — keine Dependency). Beim Signieren
(`api/schluessel/belege/[id]/signieren`) wird der kanonische Beleg-Inhalt als
exakter String in `payloadJson` eingefroren und
`hash = SHA256(payloadJson + "\n" + SHA256(pngBytes) + "\n" + signiertAm-ISO)`
gebildet (`src/lib/beleg-hash.ts`). Die Beleg-Liste rechnet den Hash
serverseitig nach (✓ unverändert / ⚠ Abweichung). Gehasht wird Inhalt +
Unterschrift, nicht die PDF (nur Darstellung). Fachliche Buchung (Exemplar-
Status, Pfandkasse) passiert schon beim Anlegen des Belegs — abgebrochene
Signaturen bleiben als „offene" Belege nachsignierbar (Tab Belege).

**Beleg-PDF:** `src/lib/beleg-pdf.ts` (pdf-lib, Briefkopf-Logos aus
`rechnung-assets.ts`), Unterschrift per `embedPng`, Fußzeile mit
Signaturzeitpunkt + SHA-256. Ablage `uploads/schluessel/belege/` via
`src/lib/schluessel-dateien.ts` (gitignored, überlebt Deploys). Auslieferung
über `/api/schluessel/belege/<id>/pdf` — **ohne Dateiendung** (Middleware-
Matcher-Falle wie bei den Banden-Uploads).

**⚠️ Echtdaten:** Das Repo ist öffentlich — `seed-schluessel.ts` legt bewusst
NUR das neutrale Grundgerüst an (GHS/GS1–GS6 ohne Gruppenbezeichnungen,
Transponder-Typ, Start-Passwort). Inhaber, Schließmatrix, Schloss-/
Transponder-Nummern werden in der App gepflegt oder einmalig über ein
privates, NICHT eingechecktes Skript importiert. Keine echten Anlagen- oder
Personendaten in Commits!

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
- **Werbebanden (ohne Event-Scoping, dauerhaft):** `Werbepartner`,
  `WerbepartnerDatei`, `WerbebandenRechnung`, `WerbebandenEinstellung`.
- **Schlüssel (ohne Event-Scoping, dauerhaft):** `SchluesselTyp`,
  `SchluesselExemplar`, `SchluesselTuer`, `SchluesselSchliessplanEintrag`,
  `SchluesselPerson`, `SchluesselBeleg`, `SchluesselAusgabe`,
  `SchluesselBestandsAenderung`, `SchluesselPfandBuchung`,
  `SchluesselEinstellung`.
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
- **`seed-werbebanden.ts`** (`npm run db:seed:werbebanden`) — Werbebanden-Startdaten
  (Einstellungen + Partner + Rechnungen 2025/2026 aus der Excel); idempotent.
  **Läuft beim Auto-Deploy.**
- **`seed-schluessel.ts`** (`npm run db:seed:schluessel`) — Schlüssel-Grundgerüst
  (Einstellungen inkl. Start-Passwort, Typen GHS/GS1–GS6/Transponder — bewusst
  OHNE Echtdaten, Repo ist öffentlich); idempotent. **Läuft beim Auto-Deploy.**
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
- **Datei-Downloads nie mit Dateiendung in der URL** ausliefern — der
  Middleware-Matcher (`.*\..*`) lässt URLs mit Punkt ungeprüft durch
  (gedacht für statische Assets). Deshalb streamt `/api/werbebanden/dateien/<id>`
  über die cuid-ID ohne Endung.
- **`uploads/` liegt nur auf dem Server** (gitignored, wie `dev.db`) — bei
  Server-Umzügen mitsichern.
