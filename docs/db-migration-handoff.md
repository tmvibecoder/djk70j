# Handover-Briefing: DB-Migration für Protokolle & Aufgaben

> **Zweck:** Dieses Dokument enthält den vollständigen Kontext, damit ein
> neues Claude-Fenster die Arbeit an der editierbaren Aufgaben-Verwaltung
> aufnehmen kann, ohne die Vorgeschichte zu kennen.

---

## 1. Projekt im Überblick

- **App:** DJK Ottenhofen — 70-Jahre-Jubiläumsfest Planungs-App
- **Stack:** Next.js 14.2.35 (App Router) · React 18 · TypeScript · Prisma 5.22 · SQLite · Tailwind
- **Repo lokal:** `/Users/thomasmiler/Claude/TCP/djk70j` ⚠️ wichtig — siehe Warnung unten
- **GitHub:** https://github.com/tmvibecoder/djk70j (branch `main`)
- **Live:** https://djk-ottenhofen-event.de
- **Server:** Hetzner-VPS, Login per Shell-Alias `hetzner`
- **pm2-Prozess:** `djk-ottenhofen-event` auf Port **3010** (nicht 3000!)
- **App-Verzeichnis auf Server:** `/var/www/djk-ottenhofen-event/app`

### ⚠️ Warnung: mehrere djk-Repos auf der Festplatte

Auf dem Mac existieren mehrere Verzeichnisse mit ähnlichen Namen — **nur eines davon ist das echte aktive Repo**:

| Pfad | Status |
|---|---|
| `/Users/thomasmiler/Claude/TCP/djk70j` | ✅ **Das richtige** — aktiv, viele Commits, deployed |
| `/Users/thomasmiler/Claude/DJK/djk70j` | ❌ Alt, irrelevant |
| `/Users/thomasmiler/Claude/DJK/djk-fest-app` | ❌ Älterer Schwester-Fork, irrelevant |
| `/root/djk70j` (auf Server) | ❌ Leichen-Clone, irrelevant |

**Immer ausschließlich in `/Users/thomasmiler/Claude/TCP/djk70j` arbeiten.**
Verwirrend ist, dass `package.json` in allen drei Repos `"name": "djk-fest-app"` heißt — das ist ein Erbe vom ursprünglichen Fork und kein zuverlässiges Identifikationsmerkmal.

---

## 2. Das Problem

Die Seite `/protokolle` (Code in [`src/app/protokolle/page.tsx`](../src/app/protokolle/page.tsx)) zeigt eine Liste von **Bereichen** mit zugehörigen **Aufgaben** und **Beschlüssen**. Es gibt zwei Tabs:

1. **Bereiche** — Aufgaben gruppiert nach Bereich (Musik, Getränke, Zelt, …)
2. **Personen** — Aufgaben gruppiert nach 8 vordefinierten Personen (Hundi, Sebi, Marco, Valli, Mexx, Dani, Tommy, Helfer x)

**Aktuell:** Beide Tabs sind **read-only**. Die Daten kommen aus einer **statischen TypeScript-Datei** [`src/data/protokolle.ts`](../src/data/protokolle.ts) — kein Prisma, keine API, kein DB-Eintrag. Deshalb gibt es:
- Keinen Edit-Button
- Keine Lösch-Funktion
- Keine Möglichkeit, Personen zuzuweisen
- Den Hinweis-Text *„Lese-Ansicht. Bearbeiten und Personen-Zuweisen folgt nach DB-Migration."*

Der Nutzer (Thomas) will jetzt genau das: **Aufgaben editierbar, löschbar, und Personen zuweisbar machen** — sowohl auf `/protokolle` als auch im Dashboard.

---

## 3. Was es schon gibt

### 3.1 Existierender `Task`-Code (NICHT verwechseln!)

Es gibt bereits eine **separate** Aufgaben-Seite unter `/aufgaben` ([`src/app/aufgaben/page.tsx`](../src/app/aufgaben/page.tsx)), die ein **anderes** Datenmodell nutzt — das Prisma-Model `Task` in [`prisma/schema.prisma`](../prisma/schema.prisma). Diese Seite hat schon Edit/Delete/Assignee per Modal.

**Aber:** Diese existierende `Task`-Tabelle ist **NICHT** das, was die Protokolle-Seite anzeigt. Es sind zwei unterschiedliche Datenquellen, die die gleiche fachliche Idee abbilden („Aufgabe").

**Empfehlung:** Beim DB-Design entscheiden, ob die beiden zusammengeführt werden (eine `Task`-Tabelle für beide Seiten) oder ob man bewusst getrennt bleibt (`ProtokollAufgabe` neben `Task`). Ich (das vorige Claude) tendiere zu **zusammenführen**, weil eine einzige Wahrheit pro fachlichem Konzept langfristig sauberer ist und das Dashboard-Reassign sowieso eine einheitliche API will. Vor der Entscheidung mit Thomas abstimmen.

### 3.2 Aktueller Inhalt von [`src/data/protokolle.ts`](../src/data/protokolle.ts)

Die Datei enthält:

- **`BEREICHE`** — Array mit 10 Bereichen, jeweils mit:
  - `id`, `name`, `icon`, `verantwortliche` (free-text)
  - `beschluesse: string[]` (Liste von Beschluss-Texten)
  - `aufgaben: Aufgabe[]`
- **`Aufgabe`** Interface:
  ```ts
  { titel: string; verantwortlich?: string; status: 'offen'|'in_arbeit'|'erledigt'; detail?: string }
  ```
  Wichtig: `verantwortlich` ist **Freitext** wie `"Hundi"`, `"Hundi + Mäx"`, `"Festausschuss"` — keine echte Verknüpfung zu einer User-/Person-Tabelle.
- **`PERSONEN`** — Array mit 8 vordefinierten Personen (siehe unten)
- Helper-Funktionen `getBereichStats`, `getGlobalStats`, `getDringendeAufgaben`, `getAufgabenForPerson`, `getPersonStats` — alle berechnen on-the-fly aus `BEREICHE`

**Gesamt-Datenvolumen:** ~10 Bereiche, ~56 Aufgaben, ~30 Beschlüsse. Klein genug, um in einer einzigen Seed-Datei vollständig migriert zu werden.

### 3.3 Die 8 Personen

Definiert in [`src/data/protokolle.ts`](../src/data/protokolle.ts) als `PERSONEN`-Konstante:

| ID | Name | Initialen | Farbe | Match-Keywords (in `verantwortlich` Freitext) |
|---|---|---|---|---|
| `hundi` | Hundi | HU | `#6366f1` indigo | `Hundi` |
| `sebi` | Sebi | SE | `#f59e0b` amber | `Seb` |
| `marco` | Marco | MA | `#10b981` emerald | `Marco` |
| `valli` | Valli | VA | `#ec4899` pink | `Valentin`, `Valli` |
| `mexx` | Mexx | MX | `#a855f7` purple | `Mäx`, `Max` |
| `dani` | Dani | DA | `#06b6d4` cyan | `Dane`, `Dani` |
| `tommy` | Tommy | TO | `#0ea5e9` sky | `Thommy`, `Tommy` |
| `helferx` | Helfer x | HX | `#6b7280` gray | (catchall — alles, was zu keiner anderen Person passt) |

**Aktuelle Matching-Logik:** Substring-basiert. „Hundi + Mäx" matcht **beide** (Hundi und Mexx). „Festausschuss" matcht keine namentliche Person → landet bei Helfer x. Diese Logik muss in der DB-Variante als echte M:N-Beziehung abgebildet werden.

### 3.4 Aktueller Prisma-Schema-Stand

[`prisma/schema.prisma`](../prisma/schema.prisma) hat diese Models:

```
User, Product, SalesEntry, Inventory, SalesEstimate,
Station, Shift, ShiftAssignment, Team, Participant, Task
```

**Noch nicht da:** `Bereich`, `Beschluss`, irgendeine Form von „Person" als eigene Entität.

Das `User`-Model existiert mit Feldern `id`, `name`, `email?`, `role`, `createdAt`, `updatedAt`. Die 8 DJK-Personen könnte man dort einkippen oder als eigenes `Person`-Model anlegen — das ist eine Design-Entscheidung.

### 3.5 Personen-Ansicht (UI bereits gebaut)

Die Personen-Tab-Logik ist bereits in [`src/app/protokolle/page.tsx`](../src/app/protokolle/page.tsx) vorhanden:
- Tab-Switch oben (Bereiche / Personen)
- Personen-Pills mit Avatar/Initialen + Total-Count
- Status-Filter (Alle/Offen/In Arbeit/Erledigt)
- Header-Karte mit aktiver Person + Status-Counts
- Aufgaben-Liste pro Status (Offen/In Arbeit/Erledigt)
- Read-only — keine Edit-Aktionen

Die UI muss erhalten bleiben. Sie soll nur ihre Daten künftig aus der DB beziehen statt aus `protokolle.ts`, und Edit-Aktionen ergänzt bekommen.

### 3.6 Mockups im Repo

Im Ordner `mockups/` liegen u.a.:
- `personen-index.html` — Vergleich der drei Varianten
- `personen-1-tabs.html` — **die gewählte Variante** (entspricht der aktuellen Implementierung)
- `personen-2-swimlanes.html`, `personen-3-akkordeon.html` — verworfen
- `protokolle-final.html` — der bestehende Bereichs-Tracker (Tab „Bereiche")

---

## 4. Was zu tun ist

### 4.1 Ziel
1. **Aufgaben editieren** — Titel, Status, Verantwortliche(r), Detail, evtl. Deadline/Priority
2. **Aufgaben löschen** — mit Confirm-Dialog
3. **Personen zuweisen** — Mehrfach-Zuweisung (eine Aufgabe kann mehreren Personen gehören)
4. **Im Dashboard** ([`src/app/page.tsx`](../src/app/page.tsx)) ebenfalls Tasks editieren / zuweisen können
5. **Bestehende Read-Only-Ansichten erhalten** — Bereiche-Tab und Personen-Tab funktionieren weiter wie heute, nur eben mit DB-Daten

### 4.2 Empfohlener Implementierungsweg

#### Schritt 1 — Design-Entscheidung mit Thomas abstimmen
- Existierendes `Task`-Model **erweitern** (zusammenführen mit Protokoll-Aufgaben) oder **neues `ProtokollAufgabe`-Model**?
- Personen als eigenes `Person`-Model oder als `User` mit speziellen Feldern?
- Empfehlung: **Eine `Task`-Tabelle** + **eigenes `Person`-Model** (separat von `User`, weil `User` ggf. später für Login gebraucht wird und eine andere Semantik hat).

#### Schritt 2 — Prisma-Schema erweitern
Neue Models (Vorschlag):

```prisma
model Bereich {
  id              String   @id @default(cuid())
  name            String
  icon            String   // emoji
  verantwortliche String   // Freitext, z.B. "Hundi, Mäx, Festausschuss"
  ordering        Int      @default(0)
  aufgaben        Task[]
  beschluesse     Beschluss[]
}

model Person {
  id        String   @id @default(cuid())
  name      String   // "Hundi", "Sebi", ...
  initials  String   // "HU", "SE", ...
  color     String   // hex, "#6366f1"
  ordering  Int      @default(0)
  isCatchAll Boolean @default(false) // true für "Helfer x"
  aufgaben  TaskAssignment[]
}

model TaskAssignment {
  id       String @id @default(cuid())
  taskId   String
  task     Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  personId String
  person   Person @relation(fields: [personId], references: [id], onDelete: Cascade)
  @@unique([taskId, personId])
}

model Beschluss {
  id        String  @id @default(cuid())
  text      String
  bereichId String
  bereich   Bereich @relation(fields: [bereichId], references: [id], onDelete: Cascade)
  ordering  Int     @default(0)
}
```

Und das bestehende `Task`-Model erweitern:

```prisma
model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  detail      String?         // ← neu, ersetzt das alte `detail` aus protokolle.ts
  status      String    @default("offen") // 'offen' | 'in_arbeit' | 'erledigt'
  priority    String    @default("medium")
  deadline    DateTime?
  bereichId   String?         // ← neu, optional
  bereich     Bereich?  @relation(fields: [bereichId], references: [id], onDelete: SetNull)
  assignments TaskAssignment[] // ← neu, ersetzt das alte single assigneeId
  // assigneeId bleibt vorerst für Rückwärtskompatibilität, wird später entfernt
  // ... bestehende Felder ...
}
```

**Wichtig:** Status-Werte vereinheitlichen. Aktuell verwenden:
- Existierende `Task`-Tabelle: `'open' | 'in_progress' | 'done'`
- `protokolle.ts`: `'offen' | 'in_arbeit' | 'erledigt'`
Beide Sets im Code finden und auf **eines** standardisieren (Empfehlung: deutsche Form `offen|in_arbeit|erledigt`, weil es im UI sichtbar ist und konsistent zur Domäne).

#### Schritt 3 — Migration + Seed
1. `npx prisma migrate dev --name add_protokolle_models` (lokal)
2. Seed-Funktion in [`prisma/seed.ts`](../prisma/seed.ts) erweitern, die:
   - Die 8 Personen aus `PERSONEN` einfügt
   - Die 10 Bereiche aus `BEREICHE` einfügt
   - Alle Aufgaben einfügt, dabei `verantwortlich` parst und passende `TaskAssignment`-Einträge erzeugt (gleiche Match-Logik wie aktuell in `getAufgabenForPerson`)
   - Alle Beschlüsse einfügt
3. Lokal testen mit `npm run db:reset` (= reset + seed)

#### Schritt 4 — API-Endpoints
Unter `src/app/api/`:
- `bereiche/route.ts` — GET (Liste), POST
- `bereiche/[id]/route.ts` — GET, PUT, DELETE
- `tasks/route.ts` — bereits vorhanden, erweitern um Bereichs-Filter und Personen-Embed
- `tasks/[id]/route.ts` — bereits vorhanden, erweitern für `assignments`
- `tasks/[id]/assignments/route.ts` — POST/DELETE für Personen-Zuweisung
- `personen/route.ts` — GET (Liste), POST
- `beschluesse/route.ts` und `beschluesse/[id]/route.ts`

#### Schritt 5 — Frontend
Umbau von [`src/app/protokolle/page.tsx`](../src/app/protokolle/page.tsx):
- Statt `import { BEREICHE, PERSONEN, ... } from '@/data/protokolle'` → `useEffect` + `fetch('/api/bereiche')` etc.
- Loading-State, Error-State
- **Edit-Modal** für Aufgaben (Titel, Detail, Status, Personen-Multi-Select, Priorität, Deadline)
- **Delete-Button** mit Confirm
- **„+ Neue Aufgabe"-Button** pro Bereich
- **Person-Multi-Select** als Dropdown mit Avataren
- Optimistisches Update oder einfaches Refetch nach Mutation

#### Schritt 6 — Dashboard
[`src/app/page.tsx`](../src/app/page.tsx) liest aktuell `BEREICHE` aus `protokolle.ts`. Ersetzen durch `fetch('/api/tasks?...)` und Edit-Aktionen einbinden (idealerweise dieselbe Modal-Komponente wiederverwenden, in `src/components/` extrahieren).

#### Schritt 7 — `src/data/protokolle.ts` aufräumen
Wenn alles auf DB läuft: die Datei kann **gelöscht** werden, oder als `seed-source.ts` umbenannt und nur noch vom Seeder importiert werden.

#### Schritt 8 — Deploy-Skript anpassen
[`scripts/deploy.sh`](../scripts/deploy.sh) muss nach dem `npm run build`-Schritt auch `npx prisma migrate deploy` ausführen, damit Schema-Änderungen auf dem Server greifen. **Achtung:** SQLite ist file-based — der Server hat seine eigene `prisma/dev.db`. Migrationen sind aber idempotent, das passt.

---

## 5. Workflow-Konventionen (Auto-Memory von Thomas)

- **Sprache:** Thomas spricht Deutsch, Antworten in Deutsch
- **Commit & Push:** Jede Änderung **sofort** committen UND nach GitHub pushen, ohne Rückfrage. Co-Author-Footer im Commit:
  ```
  Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
  ```
- **Deploy:** Auf dem Server immer per One-Liner:
  ```
  curl -fsSL https://raw.githubusercontent.com/tmvibecoder/djk70j/main/scripts/deploy.sh | bash
  ```
  Dieser zieht den main-branch, baut, restartet pm2, prüft Health.

---

## 6. Wichtige Stolperfallen aus der Vergangenheit

1. **Falsches Repo angefasst** — bitte vor jedem Schreibvorgang verifizieren, dass du in `/Users/thomasmiler/Claude/TCP/djk70j` arbeitest, nicht in einem der Schwester-Verzeichnisse.
2. **Port-Konflikt 3000** — DJK läuft auf **3010**, nicht 3000. Auf 3000 läuft etwas anderes (vermutlich `zeiterfassung` oder `kathi-website`). Niemals an Port 3000 für DJK basteln.
3. **nginx-Backups nie in `sites-enabled/`** — sonst lädt nginx beide Configs und kollabiert mit „duplicate listen options". Backups gehören nach `/tmp/`.
4. **Status-Werte uneinheitlich** — `open|in_progress|done` (Task-Tabelle) vs. `offen|in_arbeit|erledigt` (protokolle.ts). Beim Vereinheitlichen im UI ggf. eine Lookup-Map einbauen.
5. **`package.json` heißt `djk-fest-app`** in allen drei Ordnern — kein zuverlässiges Identifikationsmerkmal. Immer am Pfad und am git-remote (`tmvibecoder/djk70j`) festmachen.

---

## 7. Empfohlene Reihenfolge im neuen Chat

1. Mit Thomas die offene Design-Frage klären: **`Task` vereinen vs. `ProtokollAufgabe` neu**, **`Person` separat vs. `User` erweitern**, **Status-Strings vereinheitlichen ja/nein**.
2. Schema schreiben + lokal migrieren + seeden + smoke-test mit `npm run dev`
3. API bauen
4. Frontend umbauen (erst `/protokolle`, dann Dashboard)
5. Edit-Modal als wiederverwendbare Komponente
6. Deploy-Skript um `prisma migrate deploy` ergänzen
7. Auf Server deployen, in Browser testen
8. Old code aufräumen (`src/data/protokolle.ts` raus oder umbenennen)

---

## 8. Letzte relevante Commits

```
bcd4568 Deploy: nginx-Backup nach /tmp statt sites-enabled
634309b Deploy: DJK auf Port 3010 statt 3000 (Konflikt mit anderen pm2-Apps)
d3efdc7 Add deploy script for Hetzner production server
d1165c1 Protokolle: Personen-Ansicht (Variante 1, Tab-Switcher)
bb9ba39 Personen-Mockups: 3 Varianten für Aufgaben nach Verantwortlichem
b5f75ff Protokolle: Bereichs-Tracker mit Status-Filter und Excel-Daten
```

Viel Erfolg beim nächsten Schritt 🚀
