// Quelldaten für prisma/seed.ts — initialer Stand der Protokoll-Bereiche,
// -Beschlüsse und -Aufgaben. Zur Laufzeit kommt alles aus der DB via /api/bereiche.

export interface Aufgabe {
  titel: string
  verantwortlich?: string
  status: 'offen' | 'in_arbeit' | 'erledigt'
  detail?: string
}

export interface Bereich {
  id: string
  name: string
  icon: string
  verantwortliche: string
  beschluesse: string[]
  aufgaben: Aufgabe[]
}

export const BEREICHE: Bereich[] = [
  {
    id: "musik",
    name: "Musik & Programm",
    icon: "🎺",
    verantwortliche: "Hundi, Mäx, Festausschuss",
    beschluesse: [
      "Blaskapelle spielt So 11:30–16:00 Uhr",
      "Ehrungen gegen 13:00 Uhr beim Mittagessen",
      "Band 'Drunter und Drüber' fix für Samstag",
      "DJ Josh für Freitag fix",
      "Externer DJ für Samstag bevorzugt",
      "Festprogramm für alle 4 Tage festgelegt",
    ],
    aufgaben: [
      { titel: "Blaskapelle gebucht (Stadtkapelle Erding)", status: "erledigt", verantwortlich: "Hundi + Mäx" },
      { titel: "Band 'Drunter und Drüber' gebucht", status: "erledigt", verantwortlich: "Festausschuss" },
      { titel: "DJ Josh für Freitag zugesagt", status: "erledigt", verantwortlich: "Festausschuss" },
      { titel: "DJs für Sa & So buchen", status: "in_arbeit", verantwortlich: "Festausschuss", detail: "Sa → DJ Adriano, So → DJ Simon (Kehraus)" },
      { titel: "Blaskapelle Details klären (Tische, Pausen)", status: "in_arbeit", verantwortlich: "Hundi", detail: "Spielzeit 11:30–15:30, Details offen" },
      { titel: "GEMA beantragen", status: "offen", detail: "Auf April-Sitzung vertagt" },
      { titel: "GEMA-Befreiung prüfen", status: "offen", verantwortlich: "Marco" },
      { titel: "Ablauf Festsonntag finalisieren", status: "offen", verantwortlich: "Festausschuss" },
    ],
  },
  {
    id: "getraenke",
    name: "Getränke & Lieferanten",
    icon: "🍺",
    verantwortliche: "Thommy, Dane, Seb",
    beschluesse: [
      "Getränkekarte festgelegt",
      "Gin Tonic und offener Wein gestrichen",
      "Prosecco aus dem Fass für Aperol",
    ],
    aufgaben: [
      { titel: "Kühlwagen bei Schweiger reserviert", status: "erledigt", verantwortlich: "Thommy + Marco" },
      { titel: "Schweiger-Treffen & Angebot abgestimmt", status: "erledigt", verantwortlich: "Seb + Thommy" },
      { titel: "Getränkekarte festgelegt", status: "erledigt", verantwortlich: "Festausschuss" },
      { titel: "Preise & Mengen festlegen", status: "in_arbeit", verantwortlich: "Thommy", detail: "Schweiger liegt vor, Kratzer/Daberger ausstehend" },
      { titel: "Eiswürfel bestellen (~300 kg)", status: "in_arbeit", verantwortlich: "Dane + Seb", detail: "Daniel Meine hat zugesagt, tägliche Nachbestellung möglich" },
      { titel: "Gießkannen + Aufkleber", status: "in_arbeit", verantwortlich: "Dane + Valentin", detail: "Hundi bestellt Aufkleber" },
      { titel: "Getränke-Sortiment Mengen klären", status: "in_arbeit", verantwortlich: "Dane + Thommy", detail: "Daniel klärt Mengen mit Thommy" },
      { titel: "Spülen für Schänke anfragen", status: "offen", verantwortlich: "Max, Valentin" },
    ],
  },
  {
    id: "zelt",
    name: "Zeltaufbau & Infrastruktur",
    icon: "⛺",
    verantwortliche: "Seb, Valentin, Hundi",
    beschluesse: [
      "Zelt in Längsrichtung (Variante 2)",
      "Klo-Wagen der Burschen nutzen",
      "Teuren Klo-Anbieter absagen",
    ],
    aufgaben: [
      { titel: "Zeltplan erstellt & finalisiert", status: "erledigt", verantwortlich: "Seb" },
      { titel: "Zelt-Upgrade auf 12×30m", status: "erledigt", verantwortlich: "Seb" },
      { titel: "Holzboden Küchenzelt bestätigt", status: "erledigt", verantwortlich: "Seb" },
      { titel: "Platz vermessen (Drohne)", status: "erledigt", verantwortlich: "Festausschuss" },
      { titel: "Veranstaltungstechnik organisiert", status: "erledigt", verantwortlich: "Valentin" },
      { titel: "Klowagen mit Tank organisieren", status: "in_arbeit", verantwortlich: "Valentin + Seb", detail: "Zwei Angebote liegen vor, Uwe prüft Container" },
      { titel: "Bauzaun organisieren", status: "in_arbeit", verantwortlich: "Hundi", detail: "Seb rechnet Zaunlänge, Wirgens liefert" },
      { titel: "Müllcontainer", status: "in_arbeit", verantwortlich: "Hundi + Valentin", detail: "Luthner liefert Container" },
      { titel: "Bühne – finale Größe festlegen", status: "in_arbeit", verantwortlich: "Valentin", detail: "Felder genügend vorhanden" },
      { titel: "Parkplatz Voglrieder-Wiese", status: "in_arbeit", verantwortlich: "Hundi", detail: "Wiese freigegeben, Hundi meldet sich kurz vorm Fest" },
      { titel: "Bar & Klowagen Lieferung klären", status: "offen", detail: "Noch nicht bearbeitet" },
      { titel: "Stromverteilung klären", status: "offen", verantwortlich: "Oef, Valentin", detail: "Erdung, FI-Schutzschalter, Anforderungen" },
      { titel: "Laubbläser für Zeltbelüftung", status: "offen" },
      { titel: "WC-Service festlegen", status: "offen" },
      { titel: "Wachdienst Weiher (Patrouille)", status: "offen", detail: "Patrouille geplant, keine Personen zugewiesen" },
    ],
  },
  {
    id: "security",
    name: "Security & Genehmigungen",
    icon: "🛡️",
    verantwortliche: "Valentin, Hundi, Marco",
    beschluesse: [
      "2 Security-Personen für Fr + Sa",
      "Strikte Alterskontrolle mit UV-Stempeln und Armbändern",
      "Muttizettel-Pflicht für Minderjährige ab 16",
      "Veranstaltungszeiten definiert",
    ],
    aufgaben: [
      { titel: "Security organisiert (Anton Bowinzki)", status: "erledigt", verantwortlich: "Valentin + Dane", detail: "~1.000 € Wochenende auf Rechnung" },
      { titel: "4.000 Einlassbänder bestellt", status: "erledigt", verantwortlich: "Valentin", detail: "Sponsor: Luthner" },
      { titel: "Jugendschutzbeauftragter bestimmt", status: "erledigt", verantwortlich: "Thommy" },
      { titel: "Gemeinde-Auflagen geklärt", status: "erledigt", verantwortlich: "Hundi" },
      { titel: "Elektroabnahme geklärt", status: "erledigt", verantwortlich: "Valentin + Hundi", detail: "Nicht erforderlich" },
      { titel: "Landratsamt – Dokumente abschicken", status: "in_arbeit", verantwortlich: "Hundi", detail: "Dokumente wurden/werden abgeschickt" },
      { titel: "Genehmigungen / Gestattung", status: "in_arbeit", verantwortlich: "Hundi", detail: "Zeiten werden der Gemeinde mitgeteilt" },
      { titel: "Warnwesten beschaffen", status: "offen", verantwortlich: "Valentin", detail: "Noch zu klären ob nötig" },
      { titel: "Feuerlöscher – finale Bestätigung FFO", status: "offen", verantwortlich: "Valentin", detail: "2-3 Stück von Feuerwehr" },
    ],
  },
  {
    id: "sponsoring",
    name: "Sponsoring & Einladungen",
    icon: "🤝",
    verantwortliche: "Seb, Marco, Dane",
    beschluesse: [
      "Firmen per Brief, Vereine per E-Mail einladen",
      "Bauzaun-Banner als Sponsoring-Gegenleistung",
      "Ab 100 € Spende → Einladung Festsonntag",
      "Keine Gratis-Bewirtung für Gastvereine",
      "1–2 Ehrentische reservieren",
      "Top-5-Vereine: reservierter Tisch",
    ],
    aufgaben: [
      { titel: "Winz sponsert Bauzaunbanner", status: "erledigt", verantwortlich: "Dane" },
      { titel: "Einladung DJK Verband", status: "erledigt", verantwortlich: "Marco" },
      { titel: "Einladung Bürgermeisterin/Ehrenvorsitzende", status: "erledigt", verantwortlich: "Marco" },
      { titel: "Einladung ins DJK Amtsblatt", status: "erledigt", verantwortlich: "Mirjam" },
      { titel: "Sponsorenliste finalisieren", status: "in_arbeit", verantwortlich: "Seb", detail: "Persönlicher Kontakt bei großen, Rest per Mail" },
      { titel: "Sponsoren kontaktieren", status: "in_arbeit", verantwortlich: "Seb" },
      { titel: "Bauzaunbanner bestellen (3 Stk à 50 €)", status: "in_arbeit", verantwortlich: "Hundi" },
      { titel: "Einladung Vereine per Mail/WhatsApp", status: "in_arbeit", verantwortlich: "Seb" },
      { titel: "Einladungen Ehrengäste verschicken", status: "offen", detail: "Liste steht, kein Verantwortlicher zugewiesen" },
    ],
  },
  {
    id: "eintritt",
    name: "Eintrittspreise & Karten",
    icon: "🎫",
    verantwortliche: "Hundi, Festausschuss",
    beschluesse: [
      "Samstag: VVK 8 €, AK 10 €",
      "Kombiticket 15 € als Option",
    ],
    aufgaben: [
      { titel: "1.500 Becher bestellt (0,4l DJK/AXA)", status: "erledigt", verantwortlich: "Valentin" },
      { titel: "Kartenvorverkauf vorbereiten", status: "in_arbeit", verantwortlich: "Hundi", detail: "Hundi bestellt VVK-Tickets" },
      { titel: "Eintritt Freitag: finale Entscheidung", status: "offen", verantwortlich: "Festausschuss", detail: "Tendenz: kein Eintritt (Konkurrenz Poing)" },
    ],
  },
  {
    id: "personal",
    name: "Personal & Helfer",
    icon: "👥",
    verantwortliche: "Petra, Mirjam, Valentin, Hundi",
    beschluesse: [
      "Wertmarken-System beschlossen",
      "Mindestlohn für So-Servicekräfte",
      "Trinkgeld So für Bedienungen, Fr/Sa für Vereinskasse",
      "Keine Kartenzahlung, nur Bargeld",
    ],
    aufgaben: [
      { titel: "Personalplanung Festsonntag → Petra & Mirjam", status: "erledigt", verantwortlich: "Seb" },
      { titel: "Wertmarken checken/nachdrucken", status: "erledigt", verantwortlich: "Marco" },
      { titel: "Reinigungspersonal organisiert", status: "erledigt", verantwortlich: "Vorstand" },
      { titel: "Personal Festsonntag (22-25 Pers.)", status: "in_arbeit", verantwortlich: "Petra + Mirjam", detail: "Petra kontaktiert Personen, Schichtaufsicht nötig" },
      { titel: "Helferliste.de einrichten", status: "in_arbeit", verantwortlich: "Valentin", detail: "System wird genutzt, Einrichtung läuft" },
      { titel: "Ablaufplan (Tagesablauf Do–So)", status: "in_arbeit", verantwortlich: "Hundi + Seb", detail: "Hundi erstellt das Festprogramm" },
      { titel: "Bedienungen für Festsonntag (Lengdorf)", status: "offen", verantwortlich: "Hundi", detail: "Simon Wiethaus anfragen" },
      { titel: "Helferliste Uhrzeiten festlegen", status: "offen" },
      { titel: "Kassenpersonal (12–24 Uhr)", status: "offen", verantwortlich: "Bepp" },
      { titel: "Küche/Cocktails Personal (17–24 Uhr)", status: "offen", verantwortlich: "Karin, Mirjam" },
    ],
  },
  {
    id: "essen",
    name: "Essen & Küche",
    icon: "🍖",
    verantwortliche: "Mäx, Valentin",
    beschluesse: [
      "Essensplan für alle 4 Tage festgelegt",
      "So: Schweinebraten + Käsespätzle",
      "Kaffee & Kuchen über Helferliste (50+ Kuchen)",
    ],
    aufgaben: [
      { titel: "Grobe Essensplanung erledigt", status: "erledigt", verantwortlich: "Mäx" },
      { titel: "500 Gedecke bei Ernst Rappold reserviert", status: "erledigt", verantwortlich: "Dane + Seb" },
      { titel: "Küchenausstattung & Spülmaschinen", status: "in_arbeit", verantwortlich: "Valentin + Mäx", detail: "2 Spülmaschinen gewünscht, Angebote werden eingeholt" },
      { titel: "Backwaren bestellen", status: "in_arbeit", detail: "Beck z'Reithof liefert fürs Fest, Schmerber für Arbeitsdienste" },
      { titel: "Kuchenspenden über Helferliste sammeln", status: "in_arbeit", verantwortlich: "Helferliste" },
      { titel: "Teller/Geschirr – Mengen Festsonntag", status: "offen", verantwortlich: "Mäx" },
      { titel: "Griller organisieren", status: "offen", detail: "Settles, Reiser, Knauer angefragt" },
    ],
  },
  {
    id: "turnier",
    name: "Turnier & Verein",
    icon: "⚽",
    verantwortliche: "Jugendleitung, Daniel, Marco",
    beschluesse: [],
    aufgaben: [
      { titel: "Turnierpläne erstellt", status: "erledigt", verantwortlich: "Jugendleitung" },
      { titel: "Give-Aways beschafft (VR Bank, Sparkasse)", status: "erledigt", verantwortlich: "Halle + Mirjam" },
      { titel: "Kinderbetreuung organisiert", status: "erledigt", verantwortlich: "Halle" },
      { titel: "Give-Aways vom DJK Verband", status: "erledigt", verantwortlich: "Vorstand" },
      { titel: "Auftritt Teamgirls organisiert", status: "erledigt", verantwortlich: "Halle + Karin" },
      { titel: "Plakate Soccer 5 erstellt", status: "erledigt", verantwortlich: "Soccer 5" },
      { titel: "Plakatieren genehmigt", status: "erledigt", verantwortlich: "Marco" },
      { titel: "Preise bestellen (Medaillen, Bälle)", status: "in_arbeit", verantwortlich: "Jugendleitung" },
      { titel: "Bambini-Einlagenspiel", status: "in_arbeit", verantwortlich: "Andreas Haas" },
      { titel: "Plakate Sommerfest/Jugendturnier", status: "in_arbeit", verantwortlich: "Vorstand + Bepp" },
      { titel: "GEMA beantragen", status: "in_arbeit", verantwortlich: "Marco" },
      { titel: "Gestattung bei Gemeinde", status: "in_arbeit", verantwortlich: "Marco + Bepp" },
      { titel: "Turnierpläne verschicken", status: "offen", verantwortlich: "Jugendleitung" },
      { titel: "Schiris organisieren", status: "offen", verantwortlich: "Holbinger" },
      { titel: "Spielbälle organisieren", status: "offen", verantwortlich: "Jugendleitung" },
      { titel: "Mannschaften anrufen (Bestätigung)", status: "offen", verantwortlich: "Jugendleitung" },
      { titel: "Kabinenpläne erstellen", status: "offen", verantwortlich: "Jugendleitung" },
      { titel: "Quittungen/Spielplan drucken (10×)", status: "offen", verantwortlich: "Jugendleitung" },
      { titel: "Gutscheine drucken", status: "offen", verantwortlich: "Jugendleitung" },
      { titel: "Absperrungen organisieren", status: "offen", verantwortlich: "Bepp" },
      { titel: "15 Plakate DIN A3 aufhängen", status: "offen", verantwortlich: "Jugendleitung" },
      { titel: "Veranstaltungen im Internet anzeigen", status: "offen", verantwortlich: "Hundi" },
      { titel: "Preisliste erstellen und einschweißen", status: "offen", verantwortlich: "Marco" },
      { titel: "Pfandmarken bereitstellen", status: "offen", verantwortlich: "Jugendleitung" },
    ],
  },
  {
    id: "sonstiges",
    name: "Sonstiges",
    icon: "📋",
    verantwortliche: "Diverse",
    beschluesse: [
      "Keine Kartenzahlung, nur Bargeld",
    ],
    aufgaben: [
      { titel: "Werbung gestaltet (Banner, Plakate)", status: "erledigt", verantwortlich: "Hundi" },
      { titel: "Sitzungsprotokoll eingeführt", status: "erledigt", verantwortlich: "Seb" },
      { titel: "Festausschuss zusammengestellt", status: "erledigt", verantwortlich: "Seb + Hundi" },
      { titel: "Marco als beratende Funktion dabei", status: "erledigt", verantwortlich: "Seb + Thommy" },
      { titel: "Finanzübersicht erstellen", status: "in_arbeit", verantwortlich: "Thommy", detail: "Abstimmung mit Alex Reisner läuft" },
      { titel: "Gottesdienst – Gestaltung", status: "in_arbeit", verantwortlich: "Hundi", detail: "Gemeindepfarrer hält, Bettina gestaltet, Details im April" },
      { titel: "WM-Übertragung (Viertelfinal)", status: "offen", verantwortlich: "Marco", detail: "Falls Deutschland spielt → Rudi Rauch kontaktieren" },
      { titel: "Happy Hour planen", status: "offen" },
      { titel: "Instagram-Reels produzieren", status: "offen" },
    ],
  },
]

// ─── PERSONEN ────────────────────────────────────────────────────────────────

export interface Person {
  id: string
  name: string
  initials: string
  color: string
  keywords: string[] // case-insensitive substrings to match in `verantwortlich`
}

export const PERSONEN: Person[] = [
  { id: 'hundi',   name: 'Hundi',    initials: 'HU', color: '#6366f1', keywords: ['Hundi'] },
  { id: 'sebi',    name: 'Sebi',     initials: 'SE', color: '#f59e0b', keywords: ['Seb'] },
  { id: 'marco',   name: 'Marco',    initials: 'MA', color: '#10b981', keywords: ['Marco'] },
  { id: 'valli',   name: 'Valli',    initials: 'VA', color: '#ec4899', keywords: ['Valentin', 'Valli'] },
  { id: 'mexx',    name: 'Mexx',     initials: 'MX', color: '#a855f7', keywords: ['Mäx', 'Max'] },
  { id: 'dani',    name: 'Dani',     initials: 'DA', color: '#06b6d4', keywords: ['Dane', 'Dani'] },
  { id: 'tommy',   name: 'Tommy',    initials: 'TO', color: '#0ea5e9', keywords: ['Thommy', 'Tommy'] },
  { id: 'helferx', name: 'Helfer x', initials: 'HX', color: '#6b7280', keywords: [] },
]
