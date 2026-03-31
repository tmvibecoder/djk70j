'use client'

import { useState } from "react"

// --- Datentypen ---

interface BereichEintrag {
  sitzungNr: number
  datum: string
  themenTitel: string
  inhalt: string
  beschluesse?: string[]
  aufgaben?: string[]
}

interface Bereich {
  id: string
  name: string
  icon: string
  eintraege: BereichEintrag[]
}

// --- Daten nach Bereichen organisiert ---

const BEREICHE: Bereich[] = [
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

// --- Hilfsfunktionen ---

function getBereichStats(bereich: Bereich) {
  const allBeschluesse = bereich.eintraege.flatMap(e => e.beschluesse || [])
  const allAufgaben = bereich.eintraege.flatMap(e => e.aufgaben || [])
  const letztesDatum = bereich.eintraege[bereich.eintraege.length - 1].datum
  return { allBeschluesse, allAufgaben, letztesDatum }
}

function getStatusColor(aufgabenCount: number): { bg: string; text: string; dot: string; label: string } {
  if (aufgabenCount === 0) return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "Abgeschlossen" }
  if (aufgabenCount <= 2) return { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500", label: `${aufgabenCount} offen` }
  return { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500", label: `${aufgabenCount} offen` }
}

function parseDatum(datum: string): number {
  const [day, month, year] = datum.split('.').map(Number)
  return new Date(year, month - 1, day).getTime()
}

// --- Grid-Übersicht ---

function GridView({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 -mx-4 -mt-16 lg:-mt-6 px-4 pt-16 lg:pt-6 pb-4 mb-6 rounded-b-lg">
        <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
        <h1 className="text-2xl font-bold text-white">Protokolle — Themenübersicht</h1>
        <p className="text-sm text-gray-400 mt-1">{BEREICHE.length} Themenbereiche aus {new Set(BEREICHE.flatMap(b => b.eintraege.map(e => e.sitzungNr))).size} Sitzungen</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BEREICHE.map(bereich => {
          const stats = getBereichStats(bereich)
          const status = getStatusColor(stats.allAufgaben.length)
          return (
            <button
              key={bereich.id}
              onClick={() => onSelect(bereich.id)}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-lg hover:border-gray-300 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{bereich.icon}</span>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${status.bg} ${status.text}`}>
                  <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                  {status.label}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{bereich.name}</h3>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {stats.allBeschluesse.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-500">&#10003;</span>
                    {stats.allBeschluesse.length} Beschlüsse
                  </span>
                )}
                <span>Letzte: {stats.letztesDatum}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                {bereich.eintraege.length} {bereich.eintraege.length === 1 ? "Eintrag" : "Einträge"} aus {new Set(bereich.eintraege.map(e => e.sitzungNr)).size} {new Set(bereich.eintraege.map(e => e.sitzungNr)).size === 1 ? "Sitzung" : "Sitzungen"}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- Detail-Ansicht ---

function DetailView({
  bereich,
  onSelect,
  onBack
}: {
  bereich: Bereich
  onSelect: (id: string) => void
  onBack: () => void
}) {
  const stats = getBereichStats(bereich)
  const eintraegeReversed = [...bereich.eintraege].sort((a, b) => parseDatum(b.datum) - parseDatum(a.datum))

  return (
    <div className="flex gap-0 min-h-[calc(100vh-6rem)]">
      {/* Sidebar — Themen-Navigation */}
      <aside className="hidden lg:block w-56 shrink-0 border-r border-gray-200 bg-white rounded-l-xl -ml-6 -mt-6 -mb-6 mr-6">
        <div className="p-4 border-b border-gray-200">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Übersicht
          </button>
        </div>
        <nav className="py-2">
          {BEREICHE.map(b => (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                b.id === bereich.id
                  ? "bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg shrink-0">{b.icon}</span>
              <span className="truncate">{b.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Hauptinhalt */}
      <main className="flex-1 min-w-0 space-y-6">
        {/* Mobile: Zurück-Button */}
        <button onClick={onBack} className="lg:hidden flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Zurück zur Übersicht
        </button>

        {/* Header */}
        <div className="bg-gray-900 rounded-lg px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{bereich.icon}</span>
            <div>
              <h1 className="text-xl font-bold text-white">{bereich.name}</h1>
              <p className="text-sm text-gray-400">
                {bereich.eintraege.length} {bereich.eintraege.length === 1 ? "Eintrag" : "Einträge"} aus {new Set(bereich.eintraege.map(e => e.sitzungNr)).size} Sitzungen
              </p>
            </div>
          </div>
        </div>

        {/* Aktueller Stand */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Aktueller Stand</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Beschlüsse */}
            {stats.allBeschluesse.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">&#10003;</span>
                  Beschlüsse ({stats.allBeschluesse.length})
                </h3>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {stats.allBeschluesse.map((b, i) => (
                      <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5 shrink-0">&#10003;</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Offene Aufgaben */}
            {stats.allAufgaben.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs">!</span>
                  Offene Punkte ({stats.allAufgaben.length})
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {stats.allAufgaben.map((a, i) => (
                      <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5 shrink-0">&#9679;</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {stats.allBeschluesse.length === 0 && stats.allAufgaben.length === 0 && (
              <p className="text-sm text-gray-500 italic">Noch keine Beschlüsse oder offene Punkte.</p>
            )}
          </div>
        </div>

        {/* Verlauf / Historie */}
        <div>
          <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Verlauf
          </h2>
          <div className="relative">
            {/* Vertikale Timeline-Linie */}
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-6">
              {eintraegeReversed.map((eintrag, idx) => (
                <div key={idx} className="relative flex gap-4">
                  {/* Timeline-Punkt */}
                  <div className="relative z-10 shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      idx === 0 ? "bg-blue-600" : "bg-gray-400"
                    }`}>
                      S{eintrag.sitzungNr}
                    </div>
                  </div>

                  {/* Inhalt */}
                  <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden pb-1">
                    <div className={`px-5 py-3 border-b ${idx === 0 ? "bg-blue-50 border-blue-100" : "bg-gray-50 border-gray-100"}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-gray-500">
                          {eintrag.datum} — Sitzung {eintrag.sitzungNr}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase">Aktuellster</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm mt-0.5">{eintrag.themenTitel}</h3>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      <p className="text-sm text-gray-700 leading-relaxed">{eintrag.inhalt}</p>

                      {eintrag.beschluesse && eintrag.beschluesse.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <div className="text-xs font-bold text-emerald-700 uppercase mb-1">Beschlüsse</div>
                          <ul className="space-y-1">
                            {eintrag.beschluesse.map((b, j) => (
                              <li key={j} className="text-sm text-emerald-800 flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 shrink-0">&#10003;</span>{b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {eintrag.aufgaben && eintrag.aufgaben.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="text-xs font-bold text-amber-700 uppercase mb-1">Aufgaben</div>
                          <ul className="space-y-1">
                            {eintrag.aufgaben.map((a, j) => (
                              <li key={j} className="text-sm text-amber-800 flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5 shrink-0">&#9679;</span>{a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: Schnellnavigation zu anderen Bereichen */}
        <div className="lg:hidden mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Weitere Bereiche</h3>
          <div className="flex flex-wrap gap-2">
            {BEREICHE.filter(b => b.id !== bereich.id).map(b => (
              <button
                key={b.id}
                onClick={() => onSelect(b.id)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <span>{b.icon}</span>
                <span>{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

// --- Hauptkomponente ---

export default function ProtokollePage() {
  const [view, setView] = useState<'grid' | 'detail'>('grid')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setView('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setView('grid')
    setSelectedId(null)
  }

  const selectedBereich = BEREICHE.find(b => b.id === selectedId)

  if (view === 'detail' && selectedBereich) {
    return (
      <DetailView
        bereich={selectedBereich}
        onSelect={handleSelect}
        onBack={handleBack}
      />
    )
  }

  return <GridView onSelect={handleSelect} />
}
