# DJK Events (Veranstaltungs-App DJK SG Ottenhofen)

Diese Datei gibt Claude Code (claude.ai/code) Orientierung für die Arbeit in diesem Repo.
Sie ist die zentrale Projekt-Doku; ergänzend gibt es `README.md` (kurz) und
`ANLEITUNG-NEUE-VERANSTALTUNG.md` (Schritt-für-Schritt für den Nutzer).

## Projekt-Überblick

Interne **Orga- und Planungs-App** für die Veranstaltungen des **DJK SG Ottenhofen e.V.**
Kein öffentliches Tool — Zugang nur über **persönliche Benutzerkonten** mit
Bereichs-Rollen (siehe „Authentifizierung").

Seit dem Umbau Juli 2026 ist die App **mehrveranstaltungsfähig**: Eine Veranstaltung
ist ein Eintrag im Register `src/data/veranstaltungen.ts`; Menü, Übersichtsseite,
URLs und Daten-Scoping folgen automatisch. **Kein Copy-Paste von Seitencode.**

- **Live:** https://djk-ottenhofen-event.de (Login mit Benutzerkonto)
- Veranstaltungen aktuell: `jubilaeum-2026` (abgeschlossen, inkl. Abschlussbericht),
  `sommerfest-2027` (geplant)

Daneben gibt es drei **dauerhafte Bereiche** unabhängig von den Veranstaltungen:
`/werbebanden` (Bandenwerbung am Sportplatz), `/schluessel` (Schlüsselverwaltung)
und `/djk-info` (Vereinszeitschrift-Verwaltung) — siehe die Abschnitte
„Werbebanden-Bereich", „Schlüssel-Bereich" und „DJK-Info-Bereich". Der Zugriff
läuft über ein einheitliches Benutzer-/Rollensystem, siehe „Authentifizierung".

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

`[eventId]/layout.tsx` validiert die ID (unbekannt → `notFound()`) und prüft
die Rolle `veranstaltungen:lesen` (sonst `redirect('/')`); die einzelnen
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

**Auth:** über das zentrale Benutzer-/Rollensystem (Bereich `werbebanden`,
siehe „Authentifizierung") — kein eigenes Bereichs-Passwort mehr. Der
Einstellungen-Tab erscheint nur für Rolle `verwalten`.

**Modelle:** `Werbepartner` (zwei Kontaktblöcke — allgemein `ansprechpartner`/
`telefon`/`email`, für die Rechnung `ansprechpartnerRechnung`/`telefonRechnung`/
`emailRechnung` —, `ustId`, Ist-Länge vs. abgerechnete lfd. Meter, Preis/m netto,
Abschnitt 1–3 + PositionNr, Status aktiv/gekuendigt, Kündigung),
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

**Platzabschnitte** in `src/data/werbebanden.ts`: 34 m / 26,88 m / 35,5 m
(die früher separat geführte Zusatzfläche von 17,5 m gehört zu Abschnitt 3 und
ist dort eingerechnet — Abschnitt 4 gibt es nicht). Die Platzübersicht rechnet
mit **Ist-Längen** (physisch), die Abrechnung mit den **lfd. Metern** (können
abweichen). Partner mit einer unbekannten Abschnittsnummer erscheinen unter
„Ohne Abschnitt erfasst", damit sie beim Entfallen eines Abschnitts sichtbar
bleiben.

**Versand-Stempel:** Die Checkbox „Versendet" im Rechnungs-Tab schreibt über
`PUT api/werbebanden/rechnungen/[id]/versand` `versendetAm` + `versendetVon`
(Name aus der Session) und setzt den Status auf „versendet"; Abhaken löscht den
Stempel und nimmt den Status auf „erstellt" zurück, lässt „bezahlt" aber stehen.
Bewusst eine eigene Route: `rechnungDaten()` in `werbebanden-felder.ts` kennt
die beiden Stempelfelder nicht, damit ein normaler PUT sie nicht fälschen kann.
Das manuelle Status-Dropdown stempelt nicht.

**Rechnungslauf-Hilfe:** `src/components/werbebanden/RechnungslaufHilfe.tsx`
erklärt im Lauf-Dialog, was beim Klick passiert (fester Kernsatz + Fallliste,
die den Dialoginhalt ersetzt — kein zweites Modal, das bricht mobil das
Scrollen). Die Fälle beschreiben das echte Verhalten der Route
`api/werbebanden/rechnungen/lauf` (übersprungen wird je **Saison + Partner**,
Vorauswahl = aktiv mit Preis > 0 und lfd. Meter > 0). **Ändert sich die Route,
muss die Fallliste mitgezogen werden.**

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

**Auth:** über das zentrale Benutzer-/Rollensystem (Bereich `schluessel`,
siehe „Authentifizierung") — kein eigenes Bereichs-Passwort mehr.
Einstellungen + Pfandkasse nur für Rolle `verwalten`.

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
Transponder-Typ). Inhaber, Schließmatrix, Schloss-/
Transponder-Nummern werden in der App gepflegt oder einmalig über ein
**privates, NICHT eingechecktes Importskript** eingespielt (liegt fertig
lokal bei Thomas, `~/Claude/Projects/djk70j-schluessel-echtdaten/`:
Extraktion aus den Original-Excel/PDF-Quellen + idempotenter Import mit
Leer-Bestand-Guard; zum Einspielen werden Skript + JSON untracked in den
App-Ordner kopiert, per `npx tsx` ausgeführt und wieder gelöscht — kein
pm2-Restart nötig). Keine echten Anlagen- oder Personendaten in Commits!

## DJK-Info-Bereich (`/djk-info`, dauerhaft)

Verwaltung der **Vereinszeitschrift „DJK Info"** (3 Ausgaben/Jahr, ~29
Anzeigenkunden, 896 Hefte Verteilung) — ersetzt Excel „Abrechnung DJK Info"
+ Word-Verteilerlisten. Aufbau nach dem Werbebanden-Muster: eigener
Routen-Baum mit `InfoShell` (Tabs: Kunden | Ausgaben | Rechnungen |
Verteilung | Einstellungen), Client-Views in `src/components/djk-info/`,
Sidebar/AppHeader blenden sich auf `/djk-info/**` aus.

**Auth:** über das zentrale Benutzer-/Rollensystem (Bereich `djk-info`, siehe
„Authentifizierung") — die früheren drei Rollen-Passwörter sind abgeschafft;
die alte Kassier/Redakteur/Leser-Semantik entspricht jetzt
verwalten/bearbeiten/lesen. **Rollen-Matrix** (jede Route gated serverseitig
per `erfordereRolle`, die Shell blendet Bedienelemente nur zusätzlich aus):

| Aktion | verwalten | bearbeiten | lesen |
|---|---|---|---|
| Lesen (alle Bereiche außer Einstellungen) | ✓ | ✓ | ✓ |
| Schaltungs-Matrix, Ausgaben anlegen/ändern, Druckrechnungs-Upload | ✓ | ✓ | — |
| Kunden, Rechnungen, Verteilung, Dateien, Einstellungen (inkl. GET), Druckkosten-Feld | ✓ | — | — |

**Modelle (Präfix `Info`):** `InfoKunde`, `InfoPreis` (Preistabelle
290/230/195/155/110/90 € netto/Jahr), `InfoAusgabe` (jahr+nummer, z.B.
„2026-1"), `InfoSchaltung` (Kunde × Ausgabe, Basis der Abrechnung),
`InfoRechnung` (editierbarer Snapshot, Nummernkreis **`JJJJ/I/NNNN`** —
getrennt vom Banden-Kreis `JJJJ/B/NNNN`, beide über
`src/lib/rechnungsnummer.ts`), `InfoDatei` (Kunde ODER Ausgabe),
`InfoVerteilgebiet`/`InfoStrasse`/`InfoVerteiler` (Heftzahlen überall
editierbar; Gebietssumme wird bewusst NICHT aus den Straßen erzwungen),
`InfoEinstellung` (Singleton „djk-info").

**Rechnungsbetrag:** `netto = round(jahresNetto × n ÷ 3, 2)` — NIE den
gerundeten Einzelpreis × n rechnen (290 ÷ 3 → 96,67 × 3 = 290,01!). Helfer
`anteiligerNetto()` in `src/data/djk-info.ts`. Rechnungs-PDF
(`src/lib/info-rechnung-pdf.ts`) und Banden-PDF teilen sich die
Briefvorlagen-Primitive in **`src/lib/pdf-brief.ts`** (Wappen + Verbandslogo
aus `rechnung-assets.ts`, editierbarer Kontaktblock/Fußzeile aus den
Einstellungen).

**Verteilungs-PDFs** (`src/lib/verteilung-pdf.ts`, Route
`/api/djk-info/verteilung/pdf?ziel=…`): DIN-A4-Listen für die Austräger —
`gesamt` (Übersicht), `alle` (Sammel-PDF, je Bereich eine Seite),
`ottenhofen` (4 Gebiets-Handzettel mit Straßenlisten), `auslagen`,
`postversand`, `<gebietId>` (einzeln).

**Uploads** in `uploads/djk-info/<kundeId|ausgabeId>/` (gitignored, wie
Banden), Auslieferung NUR über `/api/djk-info/dateien/<id>` ohne
Dateiendung (Middleware-Punkt-Matcher!). Kunden-Arten: vertrag, anzeige
(nur Bild), kuendigung; Ausgaben-Arten: druckrechnung, heft.

**Seed `prisma/seed-djk-info.ts`** (+ Daten in `seed-djk-info-daten.ts`,
läuft beim Auto-Deploy, idempotent): Einstellungen/Preise/Ausgaben per
upsert; 32 Kunden, 83 Schaltungen 2025 und 30 historische Rechnungen aus
der Abrechnungs-Excel sowie Gebiete/Straßen/Verteilerliste aus den
Word-Dokumenten nur beim allerersten Lauf.

## Datenmodell (`prisma/schema.prisma`)

SQLite. **Event-Scoping:** `CostItem`, `Sponsor`, `Bereich`, `Person`, `Task`
tragen `eventId String @default("jubilaeum-2026")` (+ Index). `Beschluss` /
`TaskAssignment` erben über ihre Pflicht-FKs. Alle Schema-Änderungen müssen
**additiv mit Default** sein (Deploy nutzt `prisma db push`, kein `migrate`;
`prisma/migrations/` ist veraltet und wird nicht verwendet).

- **Auth:** `User` (username?, passwordHash?, istAdmin, aktiv, tokenVersion —
  „login-fähig" = username UND passwordHash gesetzt; die alten
  Warenwirtschafts-Zeilen ohne username bleiben unangetastet) +
  `UserBereichsRolle` (userId × bereich → rolle, `@@unique([userId, bereich])`).
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
- **DJK-Info (ohne Event-Scoping, dauerhaft):** `InfoKunde`, `InfoPreis`,
  `InfoAusgabe`, `InfoSchaltung`, `InfoRechnung`, `InfoDatei`,
  `InfoVerteilgebiet`, `InfoStrasse`, `InfoVerteiler`, `InfoEinstellung`.
- **Ohne UI (Daten bleiben erhalten):** `Product`, `Inventory`, `SalesEntry`,
  `SalesEstimate` (frühere Warenwirtschaft, UI im Juli 2026 entfernt),
  `Team`, `Participant` (Watt-Turnier), `SimpleForecast`, `EntryForecast`,
  `ForecastEntry` (frühere Prognose-Seiten). Nicht löschen — Produktivdaten!

## API-Routen (`src/app/api/.../route.ts`)

- **Auth:** `auth/login` (username + password), `auth/logout`,
  `mein-konto/passwort` (PUT), `admin/benutzer[...]` (nur istAdmin).
- **Event-gescoped** (GET `?event=`, POST-Body `eventId`, Default `jubilaeum-2026`):
  `bereiche[/id]`, `personen[/id]`, `tasks[/id]`, `costs`, `sponsors`, `anmerkungen`.
- `[id]`-Routen sind unverändert ungescoped (cuid ist global eindeutig).

## Authentifizierung (einheitliches Benutzer-/Rollensystem, seit 08/2026)

**Ein zentraler Login für alles** — die früheren separaten Bereichs-Passwörter
(Werbebanden/Schlüssel) und Rollen-Passwörter (DJK-Info) sind abgeschafft.

- **Login** `/login`: Dropdown mit allen aktiven Benutzern (`User.username` +
  `passwordHash` gesetzt) + Passwort. Ein Cookie **`djk_session`**
  (`${userId}.${ts}.${tokenVersion}.${hmac}`, `lib/auth.ts` + `lib/hmac.ts`,
  `AUTH_SECRET`, 30 Tage).
- **Zwei Schichten:** `src/middleware.ts` (Edge, kein Prisma!) prüft NUR
  „eingeloggt ja/nein" (Signatur + Ablauf). Die Autorisierung passiert in
  **`src/lib/session.ts`** (Node): `getSessionUser()` lädt bei jedem Request
  frisch `User` + `UserBereichsRolle` aus der DB → Rollenänderungen wirken
  sofort. `tokenVersion`-Abgleich Cookie ↔ DB invalidiert Sessions bei
  Passwort-Reset/Deaktivierung. Reine Konstanten (Bereiche/Rollen/Labels)
  liegen in **`lib/bereiche.ts`** (auch aus Client-Components importierbar —
  `session.ts` re-exportiert sie, darf aber NIE in Client-Code importiert
  werden, sonst bricht der Build an next/headers).
- **Rollenmodell:** je Bereich (`veranstaltungen` | `werbebanden` |
  `schluessel` | `djk-info`) eine Rolle `lesen` < `bearbeiten` < `verwalten`
  (Rang-Vergleich in `darf()`). Kein Eintrag = kein Zugriff, Kachel/Sidebar
  unsichtbar. `User.istAdmin` = Systemverwalter (alles + `/admin/benutzer`).
  Veranstaltungen: `bearbeiten` = Festplanung, `verwalten` = zusätzlich
  Finanzen/Kosten/Sponsoren.
- **WICHTIG — jede API-Route gated selbst:** Da die Middleware keine Bereiche
  mehr kennt, beginnt JEDE Route (auch GETs!) mit
  `const verboten = await erfordereRolle(req, '<bereich>', '<aktion>'); if (verboten) return verboten`.
  Neue Route ohne diesen Guard = für alle eingeloggten Nutzer offen!
  Layout-Gates (`darf(...)` → `redirect('/')`) sind nur UX, kein Schutz.
- **Selbstverwaltung:** `/mein-konto` (eigenes Passwort ändern, erhöht
  `tokenVersion` und stellt das eigene Cookie neu aus). **Adminbereich:**
  `/admin/benutzer` (anlegen, Rollen je Bereich, Passwort-Reset,
  Deaktivieren statt Löschen — `SalesEntry.enteredBy`-FKs); Kachel/Sidebar
  nur für `istAdmin` sichtbar.
- Seed-User: **`Admin` / `spielwiese`** (`istAdmin`, `prisma/seed-user.ts`,
  läuft beim Auto-Deploy; Passwort wird nie überschrieben — **nach dem ersten
  Login über /mein-konto ändern**). Alle weiteren Konten legt der Admin über
  den Adminbereich an — NIE echte Namen/Passwörter ins Repo (öffentlich!).
  Der Alt-User `DJKalle` bleibt in Bestands-DBs liegen, ist aber ohne
  `istAdmin`/Rollen wirkungslos (per Adminbereich deaktivierbar).

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
npm run db:seed:werbebanden      # Werbebanden-Startdaten
npm run db:seed:djk-info         # DJK-Info-Startdaten
npm run dev                      # http://localhost:3000
```

## Seeds (`prisma/`)

- **`seed.ts`** (`npm run db:seed`) — Festplanung **nur Jubiläum 2026**
  (deleteMany ist eventId-gescoped, andere Veranstaltungen bleiben unberührt).
- **`seed-sommerfest-2027.ts`** — Standard-Bereiche + Catch-All-Person für 2027;
  idempotent (no-op, sobald Bereiche existieren). **Läuft beim Auto-Deploy.**
  Vorlage für künftige Veranstaltungen (siehe ANLEITUNG-NEUE-VERANSTALTUNG.md).
- **`seed-user.ts`** — idempotenter Admin-Login-Seed (`Admin`, istAdmin;
  Passwort nur beim allerersten Anlegen, repariert istAdmin/aktiv falls nötig).
  **Läuft beim Auto-Deploy** (stellt nach dem Rollensystem-Umbau sicher,
  dass immer ein Admin-Login existiert).
- **`seed-werbebanden.ts`** (`npm run db:seed:werbebanden`) — Werbebanden-Startdaten
  (Einstellungen + Partner + Rechnungen 2025/2026 aus der Excel); idempotent.
  **Läuft beim Auto-Deploy.**
- **`seed-schluessel.ts`** (`npm run db:seed:schluessel`) — Schlüssel-Grundgerüst
  (Einstellungen, Typen GHS/GS1–GS6/Transponder — bewusst OHNE Echtdaten, Repo
  ist öffentlich); idempotent. **Läuft beim Auto-Deploy.**
- **`seed-djk-info.ts`** (`npm run db:seed:djk-info`) — DJK-Info-Startdaten
  (Einstellungen, Preise, Ausgaben, Kunden + Schaltungen + Rechnungen 2025,
  Verteilgebiete/Straßen/Verteiler); idempotent. **Läuft beim Auto-Deploy.**
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
`prisma generate`, `prisma db push --accept-data-loss`, dann die idempotenten
Seeds (Admin-User, Anfangsbestand 2026, Sommerfest 2027, Werbebanden,
Schlüssel, DJK-Info), `npm run build`, `pm2 restart`.

- Server-Pfad `/var/www/djk-ottenhofen-event/app`, pm2 `djk-ottenhofen-event`, Port **3010**.
- **Doku-/Nicht-Deploy-Commits mit `[skip ci]` versehen.**
- Üblicher Ablauf: Branch → committen → pushen → PR nach `main` → mergen (= Deploy).

## Konventionen

- **Deutsch** in UI, Doku und Commits.
- Mobile-first; im echten Browser/Handy gegenprüfen, nicht nur Build/Typecheck.
- Veranstaltungsspezifisches gehört ins **Register** (`src/data/veranstaltungen.ts`),
  nicht in Komponenten. Neue Veranstaltung = Register-Eintrag + optionaler Seed.
- DB-Backups (`*.db.backup*`) und `.env` sind gitignored; nie committen.

## Formulare: Farbsystem für Feldgruppen

Feldgruppen in Formularen stehen in eingefärbten Blöcken; die Farbe steht für die
**Art der Angabe**, nicht für die Position — dieselbe Gruppe sieht in jedem
Formular gleich aus. Klassen zentral in **`src/components/ui/feldgruppe.ts`**
(`gruppenRahmen` / `gruppenTitel`), nie lokal nachbauen:

| Schlüssel | Farbe | Wofür |
|---|---|---|
| `stammdaten` | Schiefer | Firma, Anschrift, Rechnungskopf |
| `kontakt` | Smaragd | Ansprechpartner, Telefon, E-Mail, Empfänger |
| `geld` | Bernstein | Rechnungskontakt, Versandweg, Beträge, Steuer |
| `leistung` | Himmel | Bandenmaße, Anzeigengröße, Abschnitt, PDF-Angaben |
| `status` | Violett | Status, Kündigung, interne Bemerkung |

**Grau ist vergeben:** die Eingabefelder selbst haben `bg-gray-50` (Input/Select),
deshalb taugt Grau nicht mehr als Gruppenfarbe. **Im Schlüsselbereich kein
`geld`** — dort markiert Bernstein die ausgewählten Schlüssel.

Eingebaut in: `werbebanden/PartnerDetailView`, `werbebanden/RechnungEditView`,
`djk-info/KundeDetailView`, `djk-info/RechnungEditView`,
`schluessel/AusgabeFlowView`. Bewusst **nicht** in Einstellungsseiten (dort
trennen bereits Cards), Listen/Tabellen und kurzen Dialogen. Mockups zur
Entscheidung liegen unter `mockups/partner-block-farben.html` und
`mockups/block-farben-system.html`.

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
  (gedacht für statische Assets). Deshalb streamen `/api/werbebanden/dateien/<id>`,
  `/api/djk-info/dateien/<id>` und die Verteilungs-PDF-Routen über IDs/Query
  ohne Endung.
- **`uploads/` liegt nur auf dem Server** (gitignored, wie `dev.db`) — bei
  Server-Umzügen mitsichern.
- **Frische Worktrees/Checkouts brauchen lokales Setup:** `.env`, `dev.db`
  und `node_modules` sind gitignored — vor Build/Tests `npm install`,
  `.env` anlegen, `npx prisma db push` + Seeds (sonst z.B. „Module not
  found: pdf-lib" oder leere Login-Tabellen).
- **UI-Verifikation eingeloggter Seiten mit headless Chrome:** Cookie per
  `fetch` auf `/api/auth/login` holen (`set-cookie` → `djk_session`-Wert)
  und in puppeteer-core via `page.setCookie({name:'djk_session', value,
  domain:'localhost', path:'/', httpOnly:true})` setzen — seit dem
  Ein-Cookie-Umbau (PR #46) braucht es keine Login-Hilfsseite in `public/`
  mehr (der Ordner existiert gar nicht). Screenshots immer gegen den
  Prod-Server (`next start`) — gegen `next dev` hängt headless Chrome
  (HMR-WebSocket). Das Test-Skript muss im Repo-Ordner liegen/laufen,
  damit `node_modules` auflöst.
- **Parameterlose GET-API-Routen brauchen `export const dynamic = 'force-dynamic'`**
  — sonst führt Next sie beim Build aus und friert die Antwort statisch ein
  (betroffen z.B. `einstellungen`, `djk-info/preise`, `djk-info/verteilung`).
- **Einstellungs-PUTs ersetzen ALLE Felder** (Feld-Whitelist mit Defaults in
  `*-felder.ts`) — ein Teil-PUT leert die nicht mitgeschickten Felder. Die
  Views schicken deshalb immer das komplette Formular; die Seeds rüsten nur
  leere Briefkopf-Felder nach, ersetzen also keinen verlorenen Inhalt.
- **`npm run build` zerschießt einen parallel laufenden `npm run dev`**
  (gemeinsames `.next/` → 404 auf alle Chunks, Seiten ohne JS). Dev-Server
  danach neu starten.
- **Browser-Verifikation ohne Dauer-Dependency:** `npm install --no-save
  puppeteer-core` + System-Chrome (`/Applications/Google Chrome.app/...`);
  `package.json` bleibt unverändert, `node_modules` ist gitignored. Beim
  Login auf die URL warten (`waitForFunction`), nicht auf ein
  Navigationsevent — `router.push` ist SPA-Navigation.
- **Neue API-Route ⇒ IMMER zuerst `erfordereRolle(...)`** (siehe
  „Authentifizierung"): Die Middleware prüft nur „eingeloggt" — eine Route
  ohne eigenen Guard ist für JEDEN eingeloggten Nutzer offen, egal welche
  Rollen er hat. Das gilt auch für harmlos wirkende GETs und Datei-/PDF-Routen.
- **`lib/session.ts` NIE aus Client-Components (`'use client'`) importieren**
  — es zieht `next/headers` + Prisma und bricht den Build. Für Typen/Labels
  (Bereich, BereichsRolle, BEREICH_LABELS …) stattdessen `lib/bereiche.ts`
  importieren; `session.ts` re-exportiert dieselben Konstanten für Server-Code.
