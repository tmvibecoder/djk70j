// Shared Protokoll-Daten — verwendet von /protokolle und Dashboard

export interface BereichEintrag {
  sitzungNr: number
  datum: string
  themenTitel: string
  inhalt: string
  beschluesse?: string[]
  aufgaben?: string[]
}

export interface Bereich {
  id: string
  name: string
  icon: string
  eintraege: BereichEintrag[]
}

export const BEREICHE: Bereich[] = [
  {
    id: "musik",
    name: "Musik",
    icon: "🎺",
    eintraege: [
      {
        sitzungNr: 1, datum: "10.02.2026",
        themenTitel: "Blaskapelle / Musik am Festsonntag",
        inhalt: "Kontakt zur Stadtkapelle Erding (Ansprechpartner: Christoph Träger) hergestellt. Spielzeit am Festsonntag ca. 11:30–16:00 Uhr. Bezahlung: freies Essen und Getränke, keine finanzielle Vergütung. Ehrungen erst gegen 13:00 Uhr beim Mittagessen. Ablauf mit Pausenzeiten, Kindertanzgruppe (Verena) und Ehrungen wird beim nächsten Treffen finalisiert.",
        beschluesse: ["Blaskapelle spielt So 11:30–16:00 Uhr", "Ehrungen gegen 13:00 Uhr beim Mittagessen"],
        aufgaben: ["Ablauf Festsonntag beim nächsten Treffen finalisieren"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Musik & DJs",
        inhalt: "Samstag: Live-Band 'Drunter und Drüber' ab 18:00 Uhr (zugesagt), danach DJ. Sonntag: Simon nach Blaskapelle ab ~16:00 Uhr. GEMA bei 500 Gästen und 5 € Eintritt: ca. 200–307 €. Vereine haben 2 Veranstaltungen/Jahr GEMA-frei — wird geprüft.",
        beschluesse: ["Band 'Drunter und Drüber' fix für Samstag"],
        aufgaben: ["Simon für Sonntag offiziell anfragen", "GEMA-Befreiung prüfen"]
      }
    ]
  },
  {
    id: "security",
    name: "Security",
    icon: "🛡️",
    eintraege: [
      {
        sitzungNr: 1, datum: "10.02.2026",
        themenTitel: "Security",
        inhalt: "Grundlegend zugesagt. Zwei Personen für Freitag und Samstag. Geschätzte Kosten: ca. 1.000 € fürs Wochenende. Bezahlung auf Rechnung (Kleingewerbe § 22 UStG, keine MwSt). Security übernimmt Alterskontrolle: Ausweiskontrolle, unterschiedliche Armbänder, UV-Stempel für Minderjährige. Wichtig: Strenge Kontrolle wegen Bußgeld-Risiko (12.500 € bei den Burschen). Muttizettel für 16-Jährige erforderlich.",
        beschluesse: ["2 Security-Personen für Fr + Sa", "Strikte Alterskontrolle mit UV-Stempeln und Armbändern", "Muttizettel-Pflicht für Minderjährige ab 16"]
      }
    ]
  },
  {
    id: "eintrittspreise",
    name: "Eintrittspreise & Karten",
    icon: "🎫",
    eintraege: [
      {
        sitzungNr: 1, datum: "10.02.2026",
        themenTitel: "Eintrittspreise & Kartenvorverkauf",
        inhalt: "Freitag: 5 € oder frei? Tendenz Freibetrieb (Bude muss voll werden). Samstag: 10 € Konsens, ggf. 8 € Vorverkauf. Kombiticket Fr+Sa: 15 €. Konkurrenz: Hundi-Fest Poing (kostenlos). Vorverkauf über Helferliste.de (Ticket-Modul mit QR-Code-Scan). Physische Vorverkaufsstellen (Schmerberei, Fußball).",
        beschluesse: ["Tendenz: Freitag 5 €, Samstag 10 €", "Kombiticket 15 € als Option"],
        aufgaben: ["Finale Entscheidung auf nächste Sitzung vertagt", "Vorverkauf-Tool (Helferliste.de) einrichten"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Eintrittspreise (Fortsetzung)",
        inhalt: "Freitag: Tendenz kein Eintritt (Konkurrenz Poing). Samstag: VVK 8 €, AK 10 €. Bei 300 verkauften Karten wird VVK gestoppt.",
        beschluesse: ["Samstag: VVK 8 €, AK 10 €"],
        aufgaben: ["Finale Entscheidung auf Vorstandssitzung"]
      }
    ]
  },
  {
    id: "sponsoring",
    name: "Sponsoring & Einladungen",
    icon: "🤝",
    eintraege: [
      {
        sitzungNr: 1, datum: "10.02.2026",
        themenTitel: "Sponsoring & Einladungen",
        inhalt: "Sponsorenliste angelegt. Firmen per Brief einladen (DJK-Logo-Umschläge, ca. 50 Stück). Vereine per E-Mail/persönlich — als Gäste + Helfer-Hinweis. Ehrengäste: ehemalige Vorstände, Bürgermeisterin, Landrat, Pfarrer, Georg-K.-Verband (500 € Zuschuss), Bayerischer Fußballverband. Gegenleistung: Bauzaun-Banner (Sparkasse 50 €/Banner). BLSV und TS Team Hummel (Trikots) anfragen.",
        beschluesse: ["Firmen per Brief, Vereine per E-Mail einladen", "Bauzaun-Banner als Sponsoring-Gegenleistung"],
        aufgaben: ["Sponsorenliste finalisieren und rumschicken", "Briefe an Sponsoren verschicken", "TS Team Hummel wegen Trikots anfragen"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Bewirtung Ehrengäste / Gastvereine",
        inhalt: "Vereine als Gäste eingeladen, aber keine geschenkten Getränke/Essen. 1–2 reservierte Tische für besondere Gäste (Pfarrer, Bürgermeisterin).",
        beschluesse: ["Keine Gratis-Bewirtung für Gastvereine", "1–2 Ehrentische reservieren"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Sponsorenliste & Banner",
        inhalt: "Liste in der Cloud. Jedes Mitglied soll sie durchsehen und ergänzen. Ab 100 € Spende: Einladung zum Festsonntag mit Essen und Getränk. Spendenquittungen bis 300 € über Verwendungszweck, darüber offiziell. Bisher: 370 € von 3 Spendern.",
        beschluesse: ["Ab 100 € Spende → Einladung Festsonntag"],
        aufgaben: ["Sponsorenliste vervollständigen", "Briefe zeitnah verschicken"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Vereins-Einladungen & Tischplanung",
        inhalt: "28 Tische im Zelt. Nur die 5 größten Vereine bekommen reservierten Tisch (Feuerwehr, Bayern-Fanclub etc.). Kleinere einladen ohne festen Tisch. Böllerschützen: mind. 2 Tische.",
        beschluesse: ["Top-5-Vereine: reservierter Tisch", "Böllerschützen: 2 Tische"]
      }
    ]
  },
  {
    id: "getraenke",
    name: "Getränke & Lieferanten",
    icon: "🍺",
    eintraege: [
      {
        sitzungNr: 1, datum: "10.02.2026",
        themenTitel: "Getränke & Lieferanten",
        inhalt: "Drei Lieferanten: Schweiger (Preisliste vorhanden), Kratzer (noch anfragen), Daberger Getränke (Empfehlung der Burschen — Kühlbrücken, Cocktailmaschinen, alles inklusive). Faustformel Schweiger: 1,6 Liter Bier pro Kopf pro Tag. Bei 400 Gästen = ca. 640 Liter/Tag.",
        aufgaben: ["Tommy: Preise bei Schweiger, Kratzer und Daberger anfragen und vergleichen"]
      },
      {
        sitzungNr: 1, datum: "10.02.2026",
        themenTitel: "Gießkannen-Aktion",
        inhalt: "Gelbe 3-Liter-Gießkannen als Partygetränk (Rüscher/Kuba). DJK-Logo bedruckt/beklebt. EK ca. 2,95 €, Pfand 10–15 €. Social-Media-Reels zur Bewerbung.",
        aufgaben: ["Bis Anfang April bestellen (6 Wochen Lieferzeit)", "Instagram-Reels mit Gießkannen produzieren"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Getränkekarte",
        inhalt: "Fass (Sa/So): Bier, Radler, Weißbier, Russ. Do/Fr: Flaschenbier. Alkoholfrei: Spezi, Weiße Limo, Apfelschorle, Wasser. Cocktails: Wodka Lemon/Bull, Kuba, Rüscher, Weinschorle, Aperol, Prosecco. Gestrichen: Gelbe Limo, Gin Tonic, offener Wein. Prosecco aus dem Fass für Aperol.",
        beschluesse: ["Getränkekarte festgelegt", "Gin Tonic und offener Wein gestrichen"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Eiswürfel",
        inhalt: "Keine Eiswürfelmaschine (zu langsam, Hygiene). 300 kg fertiges Eis bestellen (Daniel Meinel). Lagerung in Styroporboxen mit Trockeneis. Notfall: Edeka, Kaufland, Metro.",
        aufgaben: ["300 kg Eis bei Daniel Meinel bestellen"]
      }
    ]
  },
  {
    id: "djs",
    name: "DJs für Freitag & Samstag",
    icon: "🎧",
    eintraege: [
      {
        sitzungNr: 1, datum: "10.02.2026",
        themenTitel: "DJs für Freitag/Samstag",
        inhalt: "Freitag: DJ Josh (kostenlos, zugesagt). Samstag nach Live-Band: Völky Killi oder Adrian (100–300 €), Tendenz: Externen bezahlen. Sonntag: Deitinger für leise Hintergrundmusik.",
        beschluesse: ["DJ Josh für Freitag fix", "Externer DJ für Samstag bevorzugt"]
      }
    ]
  },
  {
    id: "zeltaufbau",
    name: "Zeltaufbau & Lageplan",
    icon: "⛺",
    eintraege: [
      {
        sitzungNr: 1, datum: "10.02.2026",
        themenTitel: "Zeltaufstellung & Geländeplan",
        inhalt: "Variante 2 bevorzugt: Zelt in Längsrichtung, Eingang von der Herwergerstraße. Vorteile: beeindruckender Anblick, mehr Platz für Kühlwagen, Biergarten vorne, Grillstation zugänglich. Bar hinten ums Eck, Küche mittig. Klo-Wagen hinterm Zelt. Backstage/Festbüro: Baucontainer gesucht.",
        beschluesse: ["Zelt in Längsrichtung (Variante 2)"],
        aufgaben: ["Uwe wegen Baucontainer in Vorstandssitzung fragen"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Sanitäranlagen / Klo-Wagen",
        inhalt: "Anbieter 1 zu teuer (1.800 €), Anbieter 2 zu klein. Lösung: Klo-Wagen der Burschen (4 Damen, 2 Herren, Pissrinne). IBC-Tanks (1.000 L) als Abwassertanks vom Luftner. Thalheimer Max pumpt bei Bedarf. Verbindung über Gefälle.",
        beschluesse: ["Klo-Wagen der Burschen nutzen", "Teuren Anbieter absagen"],
        aufgaben: ["IBC-Tanks beim Luftner anfragen", "Thalheimer Max für Auspumpen einplanen"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Festbüro / Backstage-Container",
        inhalt: "Arbeits-/Bürocontainer hinter dem Zelt gesucht (Tresor, Organisationsmaterial). Muss Fenster haben und abschließbar sein.",
        aufgaben: ["Fischer und Baufirmen anfragen", "Uwe in Vorstandssitzung fragen"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Bauzäune",
        inhalt: "Wirgens (Baufirma, Jonas) stellt Bauzäune bereit. Geschätzt 50–100 Meter benötigt. Kosten ca. 25 €/Element. Sparkasse zahlt 50 €/beworbenen Bauzaun.",
        aufgaben: ["Jonas organisiert Bauzäune bei Wirgens"]
      }
    ]
  },
  {
    id: "parken",
    name: "Parken",
    icon: "🅿️",
    eintraege: [
      {
        sitzungNr: 1, datum: "10.02.2026",
        themenTitel: "Parkplatz",
        inhalt: "Wiesen links und rechts des Sportplatzes als Parkfläche. Pächter Vogelräder muss um Erlaubnis gefragt werden.",
        aufgaben: ["Vogelräder wegen Parkplatz-Nutzung anfragen", "Beleuchtung klären"]
      }
    ]
  },
  {
    id: "sicherheit",
    name: "Sicherheit",
    icon: "🔒",
    eintraege: [
      {
        sitzungNr: 1, datum: "10.02.2026",
        themenTitel: "Sicherheitskonzept & Weiher",
        inhalt: "Sicherheitskonzept wird fertiggestellt. Landratsamt empfiehlt: Weiher nicht mit Bauzaun (zu teuer), stattdessen 2 Personen Patrouille. Festgelände Richtung Straße mit Bauzaun. Rettungszufahrt und Sammelplätze im Geländeplan.",
        aufgaben: ["Sicherheitskonzept an Gemeinde schicken", "Geländeplan mit Fluchtwegen erstellen"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Landratsamt & Genehmigungen",
        inhalt: "Geländeplan ans Landratsamt (inkl. Rettungszufahrt). Veranstaltungszeiten: Do 16:00–00:00, Fr 19:00–03:00, Sa 07:00–03:00, So 10:00–20:00.",
        beschluesse: ["Veranstaltungszeiten definiert"],
        aufgaben: ["Geländeplan einreichen"]
      }
    ]
  },
  {
    id: "sonstiges",
    name: "Sonstiges",
    icon: "📋",
    eintraege: [
      {
        sitzungNr: 1, datum: "10.02.2026",
        themenTitel: "Sonstiges",
        inhalt: "GEMA: Komplex, Setlisten nötig — Agenda für März. Club-WM 2026: Viertelfinals 9.–12. Juli, ggf. Übertragung im Biergarten. Bauzaun-Banner: 3–5 Stück nachbestellen (ca. 29 €/Stück). Helferliste.de für Helfer-Koordination. Tommy baut Finanzübersicht/Dashboard. Müllcontainer über Gemeinde/Bauhof. Elektroabnahme: Landratsamt kommt vorbei.",
        aufgaben: ["GEMA für März auf Agenda", "Bauzaun-Banner bestellen", "Helferliste.de einrichten", "Finanzübersicht erstellen", "Müllcontainer über Gemeinde organisieren"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Essen",
        inhalt: "Do (Wattturnier): Wurstsalat, Brezen, Obatzda (200–250 Brezen). Fr: Leberkässemmeln (300–350 Stk). Sa: Pommes, Grill, abends Obatzda/Wurstsalat (500–750 Semmeln). So: Schweinebraten mit Kartoffel-/Kraut-/Karottensalat + Käsespätzle (in Gaspfanne). Kaffee & Kuchen am Sonntagnachmittag: 50+ Kuchen über Helferliste. Küchenequipment kostenlos aus Moosburg.",
        aufgaben: ["Bäcker anfragen (Reithof, Kreitmaier, Hasi)", "Kuchenspenden über Helferliste sammeln"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Helferliste & Helfergruppe",
        inhalt: "WhatsApp-Helfergruppe: 100 Mitglieder. Helferliste.de für Koordination (Posten: Aufbau, Zeltaufbau, Deko, Service, Abbau, Kuchenspende, Sachspenden).",
        aufgaben: ["Begrüßungsnachricht in WhatsApp-Gruppe posten", "Posten auf Helferliste.de erstellen"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Festprogramm",
        inhalt: "Do: 16:00 Eröffnung, Brotzeit, 19:00 Wattturnier. Fr: 19:00 Discoparty mit DJ Josh. Sa: 09:00 Jugendturnier, 12:00 Stockschützen, 14:00 Fußballturnier & Kindernachmittag, 18:00 Festzeltparty 'Drunter und Drüber'. So: 10:00 Gottesdienst + Böllerschützen, 11:30 Mittagstisch + Blasmusik, 13:00 Ehrungen, 14:30 Kaffee/Kuchen + Kindertanzgruppe.",
        beschluesse: ["Festprogramm für alle 4 Tage festgelegt"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Service-Planung Festsonntag",
        inhalt: "25+ Servicekräfte + 10 Backup für 5 Tischreihen. Pro Gang 4 Personen: 1 nimmt Bestellung auf/kassiert, 1 holt Essen, 1 holt Getränke, 1 trägt Schlitten. Wertmarken-System: Farbige Chips pro Getränk (z.B. Rot=Bier, Weiß=Weißbier, Orange=Spezi). 250 Stk/Farbe à 10 €, gesamt ~100 €. Bezahlung: Mindestlohn 12,90 €/Std für ~4–5h = ~1.390 € gesamt. Trinkgeld am Sonntag für Bedienungen. Fr/Sa ehrenamtlich. Einweisung 1–2 Wochen vorher durch Petra.",
        beschluesse: ["Wertmarken-System beschlossen", "Mindestlohn für So-Servicekräfte", "Trinkgeld So für Bedienungen, Fr/Sa für Vereinskasse"],
        aufgaben: ["Petra: Bedienungen akquirieren", "Petra: Einweisung 1–2 Wochen vor Fest", "Alex: Steuerliche Abwicklung klären", "Wertmarken bestellen (~100 €)"]
      },
      {
        sitzungNr: 2, datum: "09.03.2026",
        themenTitel: "Sonstiges",
        inhalt: "Social Media: 800 Mitglieder sollen Flyer teilen, Instagram-Reels. Kartenzahlung: nur Bargeld, Notlösung: Vereins-Kartenterminal. Ministranten (12 Stk) versorgen. Besteck: 500 + 200 Reserve + 1.000 vom Ernst. Nächster Termin: 30.03.2026, ab April alle 2 Wochen, ab Mai wöchentlich.",
        beschluesse: ["Keine Kartenzahlung, nur Bargeld"],
        aufgaben: ["Instagram-Reels produzieren", "Nächste Sitzung: 30.03.2026"]
      }
    ]
  }
]

export function getBereichStats(bereich: Bereich) {
  const allBeschluesse = bereich.eintraege.flatMap(e => e.beschluesse || [])
  const allAufgaben = bereich.eintraege.flatMap(e => e.aufgaben || [])
  const letztesDatum = bereich.eintraege[bereich.eintraege.length - 1].datum
  return { allBeschluesse, allAufgaben, letztesDatum }
}

export function getStatusColor(aufgabenCount: number) {
  if (aufgabenCount === 0) return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "Abgeschlossen" }
  if (aufgabenCount <= 2) return { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500", label: `${aufgabenCount} offen` }
  return { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500", label: `${aufgabenCount} offen` }
}

export function parseDatum(datum: string): number {
  const [day, month, year] = datum.split('.').map(Number)
  return new Date(year, month - 1, day).getTime()
}
