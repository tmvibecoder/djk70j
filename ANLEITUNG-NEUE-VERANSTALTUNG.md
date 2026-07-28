# Anleitung: Eine neue Veranstaltung anlegen

Diese Website ist so gebaut, dass **eine neue Veranstaltung = ein neuer
Eintrag in einer einzigen Datei** ist. Menü, Übersichtsseite, Adressen
(`/meine-veranstaltung/festplanung` usw.) und die Trennung der Daten in der
Datenbank entstehen daraus automatisch. Es muss **kein Seitencode kopiert
werden**.

## 1. Wo trage ich die Veranstaltung ein?

In der Datei:

```
src/data/veranstaltungen.ts
```

Dort steht die Liste `VERANSTALTUNGEN`. Jede Veranstaltung ist ein Block in
geschweiften Klammern.

## 2. Welche Zeilen muss ich ergänzen?

**Schritt A:** Oben in der Datei die neue Kennung in die Zeile mit
`VeranstaltungId` aufnehmen (das ist der technische Kurzname, er wird Teil
der Adresse — nur Kleinbuchstaben, Zahlen und Bindestriche):

```ts
export type VeranstaltungId = 'jubilaeum-2026' | 'sommerfest-2027' | 'sommerfest-2028'
```

**Schritt B:** Ans Ende der Liste `VERANSTALTUNGEN` einen neuen Block
anhängen (Komma nach dem vorherigen Block nicht vergessen):

```ts
  {
    id: 'sommerfest-2028',              // Teil der Adresse, z.B. /sommerfest-2028
    titel: 'DJK Sommerfest 2028',       // Name im Menü und auf Kacheln
    icon: '☀️',                         // Emoji für Menü und Kacheln
    jahr: 2028,                         // steuert die Sortierung (neueste zuerst)
    zeitraum: 'Sommer 2028',            // Datum als Text, z.B. '9.–12. Juli 2028'
    status: 'geplant',                  // 'geplant', 'laeuft' oder 'abgeschlossen'
    bereiche: ['festplanung', 'finanzplanung'],  // sichtbare Unterseiten
    // startDate: '2028-07-06T18:00:00', // sobald der Termin steht → Countdown oben rechts
    tage: [],                           // Festtage, sobald das Programm steht (siehe unten)
  },
```

Ein Bereich, der **nicht** in `bereiche` steht, taucht bei dieser
Veranstaltung weder im Menü noch als Adresse auf. Der `abschlussbericht`
kommt also erst nach dem Fest dazu.

Die Festtage in `tage` sehen so aus (Beispiel vom Jubiläum) und steuern die
Tages-Spalten in der Finanzplanung:

```ts
    tage: [
      { key: 'friday', label: 'Freitag 07.07.', short: 'Fr 07.07.', icon: '🎶', event: 'Discoabend' },
      { key: 'saturday', label: 'Samstag 08.07.', short: 'Sa 08.07.', icon: '🎉', event: 'Festabend' },
    ],
```

**Schritt C (empfohlen):** Damit die Festplanung direkt benutzbar ist
(Bereiche wie Musik, Getränke, Zelt …), eine Kopie von
`prisma/seed-sommerfest-2027.ts` anlegen (z. B. `seed-sommerfest-2028.ts`),
darin nur die Zeile `const EVENT_ID = 'sommerfest-2028'` anpassen, und in
`.github/workflows/deploy.yml` eine Zeile nach dem Muster der vorhandenen
Seed-Zeilen ergänzen:

```
npx tsx prisma/seed-sommerfest-2028.ts
```

Das Skript ist ungefährlich: Es läuft nur beim allerersten Mal und fasst
keine anderen Veranstaltungen an.

## 3. Wie geht die Änderung online?

Wie jede Code-Änderung in diesem Projekt:

1. Änderungen auf einem eigenen Branch committen und zu GitHub pushen.
2. Pull Request nach `main` erstellen.
3. **PR mergen → die Seite wird automatisch deployt** (GitHub Actions →
   Server web01). Nach 2–3 Minuten ist die neue Veranstaltung online.

Am einfachsten: Claude sagen „Lege die Veranstaltung XY an" — die drei
Schritte oben sind genau das, was dann passiert.

## Was passiert automatisch?

- Menüpunkt in der Sidebar (neueste Veranstaltung zuerst)
- Kachel auf der Übersichtsseite (`/`), abgeschlossene rutschen nach unten
- Adressen `/kennung`, `/kennung/festplanung`, `/kennung/finanzplanung`
  (und `/kennung/abschlussbericht`, falls im Eintrag aufgeführt)
- Brotkrümel-Zeile „Übersicht › Titel › Bereich" auf allen Unterseiten
- Getrennte Daten: Kosten, Spenden und Aufgaben der neuen Veranstaltung
  vermischen sich nicht mit anderen Veranstaltungen
- Leere Seiten zeigen den Hinweis „Die Planung startet demnächst."
