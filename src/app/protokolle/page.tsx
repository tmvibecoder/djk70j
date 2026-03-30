'use client'

import { useState } from "react"

interface Thema {
  titel: string
  icon: string
  inhalt: string
  beschluesse?: string[]
  aufgaben?: string[]
}

interface Sitzung {
  id: string
  nummer: number
  datum: string
  titel: string
  zusammenfassung: string
  themen: Thema[]
}

const SITZUNGEN: Sitzung[] = [
  {
    id: "1",
    nummer: 1,
    datum: "10.02.2026",
    titel: "Festausschuss-Sitzung 1",
    zusammenfassung: "Erste Planungssitzung für das 70-Jahr-Jubiläumsfest. Kernthemen: Blaskapelle für Festsonntag gesichert, Security zugesagt (~1.000 €), Eintrittspreise diskutiert (Fr 5 € / Sa 10 €), Sponsorenliste angelegt, Getränkelieferanten verglichen, Zeltaufstellung in Längsrichtung bevorzugt, Sicherheitskonzept und Geländeplan in Arbeit.",
    themen: [
      {
        titel: "Blaskapelle / Musik am Festsonntag",
        icon: "🎺",
        inhalt: "Kontakt zur Stadtkapelle Erding (Ansprechpartner: Christoph Träger) hergestellt. Spielzeit am Festsonntag ca. 11:30–16:00 Uhr. Bezahlung: freies Essen und Getränke, keine finanzielle Vergütung. Ehrungen erst gegen 13:00 Uhr beim Mittagessen. Ablauf mit Pausenzeiten, Kindertanzgruppe (Verena) und Ehrungen wird beim nächsten Treffen finalisiert. DJ Deitinger für Sonntagnachmittag nach der Blaskapelle in Erwägung gezogen.",
        beschluesse: ["Blaskapelle spielt So 11:30–16:00 Uhr", "Ehrungen gegen 13:00 Uhr beim Mittagessen"],
        aufgaben: ["Ablauf Festsonntag beim nächsten Treffen finalisieren"]
      },
      {
        titel: "Security",
        icon: "🛡️",
        inhalt: "Grundlegend zugesagt. Zwei Personen für Freitag und Samstag. Geschätzte Kosten: ca. 1.000 € fürs Wochenende. Bezahlung auf Rechnung (Kleingewerbe § 22 UStG, keine MwSt). Security übernimmt Alterskontrolle: Ausweiskontrolle, unterschiedliche Armbänder, UV-Stempel für Minderjährige. Wichtig: Strenge Kontrolle wegen Bußgeld-Risiko (12.500 € bei den Burschen). Muttizettel für 16-Jährige erforderlich.",
        beschluesse: ["2 Security-Personen für Fr + Sa", "Strikte Alterskontrolle mit UV-Stempeln und Armbändern", "Muttizettel-Pflicht für Minderjährige ab 16"]
      },
      {
        titel: "Eintrittspreise & Kartenvorverkauf",
        icon: "🎫",
        inhalt: "Freitag: 5 € oder frei? Tendenz Freibetrieb (Bude muss voll werden). Samstag: 10 € Konsens, ggf. 8 € Vorverkauf. Kombiticket Fr+Sa: 15 €. Konkurrenz: Hundi-Fest Poing (kostenlos). Vorverkauf über Helferliste.de (Ticket-Modul mit QR-Code-Scan). Physische Vorverkaufsstellen (Schmerberei, Fußball).",
        beschluesse: ["Tendenz: Freitag 5 €, Samstag 10 €", "Kombiticket 15 € als Option"],
        aufgaben: ["Finale Entscheidung auf nächste Sitzung vertagt", "Vorverkauf-Tool (Helferliste.de) einrichten"]
      },
      {
        titel: "Sponsoring & Einladungen",
        icon: "🤝",
        inhalt: "Sponsorenliste angelegt. Firmen per Brief einladen (DJK-Logo-Umschläge, ca. 50 Stück). Vereine per E-Mail/persönlich — als Gäste + Helfer-Hinweis. Ehrengäste: ehemalige Vorstände, Bürgermeisterin, Landrat, Pfarrer, Georg-K.-Verband (500 € Zuschuss), Bayerischer Fußballverband. Gegenleistung: Bauzaun-Banner (Sparkasse 50 €/Banner). BLSV und TS Team Hummel (Trikots) anfragen.",
        beschluesse: ["Firmen per Brief, Vereine per E-Mail einladen", "Bauzaun-Banner als Sponsoring-Gegenleistung"],
        aufgaben: ["Sponsorenliste finalisieren und rumschicken", "Briefe an Sponsoren verschicken", "TS Team Hummel wegen Trikots anfragen"]
      },
      {
        titel: "Getränke & Lieferanten",
        icon: "🍺",
        inhalt: "Drei Lieferanten: Schweiger (Preisliste vorhanden), Kratzer (noch anfragen), Daberger Getränke (Empfehlung der Burschen — Kühlbrücken, Cocktailmaschinen, alles inklusive). Faustformel Schweiger: 1,6 Liter Bier pro Kopf pro Tag. Bei 400 Gästen = ca. 640 Liter/Tag.",
        aufgaben: ["Tommy: Preise bei Schweiger, Kratzer und Daberger anfragen und vergleichen"]
      },
      {
        titel: "DJs für Freitag/Samstag",
        icon: "🎧",
        inhalt: "Freitag: DJ Josh (kostenlos, zugesagt). Samstag nach Live-Band: Völky Killi oder Adrian (100–300 €), Tendenz: Externen bezahlen. Sonntag: Deitinger für leise Hintergrundmusik.",
        beschluesse: ["DJ Josh für Freitag fix", "Externer DJ für Samstag bevorzugt"]
      },
      {
        titel: "Gießkannen-Aktion",
        icon: "🚿",
        inhalt: "Gelbe 3-Liter-Gießkannen als Partygetränk (Rüscher/Kuba). DJK-Logo bedruckt/beklebt. EK ca. 2,95 €, Pfand 10–15 €. Social-Media-Reels zur Bewerbung.",
        aufgaben: ["Bis Anfang April bestellen (6 Wochen Lieferzeit)", "Instagram-Reels mit Gießkannen produzieren"]
      },
      {
        titel: "Zeltaufstellung & Geländeplan",
        icon: "⛺",
        inhalt: "Variante 2 bevorzugt: Zelt in Längsrichtung, Eingang von der Herwergerstraße. Vorteile: beeindruckender Anblick, mehr Platz für Kühlwagen, Biergarten vorne, Grillstation zugänglich. Bar hinten ums Eck, Küche mittig. Klo-Wagen hinterm Zelt. Backstage/Festbüro: Baucontainer gesucht.",
        beschluesse: ["Zelt in Längsrichtung (Variante 2)"],
        aufgaben: ["Uwe wegen Baucontainer in Vorstandssitzung fragen"]
      },
      {
        titel: "Parkplatz",
        icon: "🅿️",
        inhalt: "Wiesen links und rechts des Sportplatzes als Parkfläche. Pächter Vogelräder muss um Erlaubnis gefragt werden.",
        aufgaben: ["Vogelräder wegen Parkplatz-Nutzung anfragen", "Beleuchtung klären"]
      },
      {
        titel: "Sicherheitskonzept & Weiher",
        icon: "🔒",
        inhalt: "Sicherheitskonzept wird fertiggestellt. Landratsamt empfiehlt: Weiher nicht mit Bauzaun (zu teuer), stattdessen 2 Personen Patrouille. Festgelände Richtung Straße mit Bauzaun. Rettungszufahrt und Sammelplätze im Geländeplan.",
        aufgaben: ["Sicherheitskonzept an Gemeinde schicken", "Geländeplan mit Fluchtwegen erstellen"]
      },
      {
        titel: "Sonstiges",
        icon: "📋",
        inhalt: "GEMA: Komplex, Setlisten nötig — Agenda für März. Club-WM 2026: Viertelfinals 9.–12. Juli, ggf. Übertragung im Biergarten. Bauzaun-Banner: 3–5 Stück nachbestellen (ca. 29 €/Stück). Helferliste.de für Helfer-Koordination. Tommy baut Finanzübersicht/Dashboard. Müllcontainer über Gemeinde/Bauhof. Elektroabnahme: Landratsamt kommt vorbei.",
        aufgaben: ["GEMA für März auf Agenda", "Bauzaun-Banner bestellen", "Helferliste.de einrichten", "Finanzübersicht erstellen", "Müllcontainer über Gemeinde organisieren"]
      }
    ]
  },
  {
    id: "2",
    nummer: 2,
    datum: "09.03.2026",
    titel: "Festausschuss-Sitzung 2",
    zusammenfassung: "Zweite Planungssitzung mit zusätzlicher Beratung durch Petra und Miriam (Service Festsonntag). Kernthemen: Klo-Wagen der Burschen nutzen statt teurer Anbieter, GEMA-Gebühren ~200–307 €, Getränkekarte festgelegt, Essensplan für alle 4 Tage, Wertmarken-System für Festsonntag beschlossen, 25+ Servicekräfte nötig, Veranstaltungszeiten für Genehmigung definiert.",
    themen: [
      {
        titel: "Bewirtung Ehrengäste / Gastvereine",
        icon: "🍽️",
        inhalt: "Vereine als Gäste eingeladen, aber keine geschenkten Getränke/Essen. 1–2 reservierte Tische für besondere Gäste (Pfarrer, Bürgermeisterin).",
        beschluesse: ["Keine Gratis-Bewirtung für Gastvereine", "1–2 Ehrentische reservieren"]
      },
      {
        titel: "Sanitäranlagen / Klo-Wagen",
        icon: "🚻",
        inhalt: "Anbieter 1 zu teuer (1.800 €), Anbieter 2 zu klein. Lösung: Klo-Wagen der Burschen (4 Damen, 2 Herren, Pissrinne). IBC-Tanks (1.000 L) als Abwassertanks vom Luftner. Thalheimer Max pumpt bei Bedarf. Verbindung über Gefälle.",
        beschluesse: ["Klo-Wagen der Burschen nutzen", "Teuren Anbieter absagen"],
        aufgaben: ["IBC-Tanks beim Luftner anfragen", "Thalheimer Max für Auspumpen einplanen"]
      },
      {
        titel: "Festbüro / Backstage-Container",
        icon: "🏗️",
        inhalt: "Arbeits-/Bürocontainer hinter dem Zelt gesucht (Tresor, Organisationsmaterial). Muss Fenster haben und abschließbar sein.",
        aufgaben: ["Fischer und Baufirmen anfragen", "Uwe in Vorstandssitzung fragen"]
      },
      {
        titel: "Musik & DJs",
        icon: "🎵",
        inhalt: "Samstag: Live-Band 'Drunter und Drüber' ab 18:00 Uhr (zugesagt), danach DJ. Freitag: DJ Josh (kostenlos). Sonntag: Simon nach Blaskapelle ab ~16:00 Uhr. GEMA bei 500 Gästen und 5 € Eintritt: ca. 200–307 €. Vereine haben 2 Veranstaltungen/Jahr GEMA-frei — wird geprüft.",
        beschluesse: ["Band 'Drunter und Drüber' fix für Samstag"],
        aufgaben: ["Simon für Sonntag offiziell anfragen", "GEMA-Befreiung prüfen"]
      },
      {
        titel: "Sponsorenliste & Banner",
        icon: "📢",
        inhalt: "Liste in der Cloud. Jedes Mitglied soll sie durchsehen und ergänzen. Ab 100 € Spende: Einladung zum Festsonntag mit Essen und Getränk. Spendenquittungen bis 300 € über Verwendungszweck, darüber offiziell. Bisher: 370 € von 3 Spendern.",
        beschluesse: ["Ab 100 € Spende → Einladung Festsonntag"],
        aufgaben: ["Sponsorenliste vervollständigen", "Briefe zeitnah verschicken"]
      },
      {
        titel: "Bauzäune",
        icon: "🚧",
        inhalt: "Wirgens (Baufirma, Jonas) stellt Bauzäune bereit. Geschätzt 50–100 Meter benötigt. Kosten ca. 25 €/Element. Sparkasse zahlt 50 €/beworbenen Bauzaun.",
        aufgaben: ["Jonas organisiert Bauzäune bei Wirgens"]
      },
      {
        titel: "Vereins-Einladungen & Tischplanung",
        icon: "🪑",
        inhalt: "28 Tische im Zelt. Nur die 5 größten Vereine bekommen reservierten Tisch (Feuerwehr, Bayern-Fanclub etc.). Kleinere einladen ohne festen Tisch. Böllerschützen: mind. 2 Tische.",
        beschluesse: ["Top-5-Vereine: reservierter Tisch", "Böllerschützen: 2 Tische"]
      },
      {
        titel: "Eintrittspreise (Fortsetzung)",
        icon: "🎫",
        inhalt: "Freitag: Tendenz kein Eintritt (Konkurrenz Poing). Samstag: VVK 8 €, AK 10 €. Bei 300 verkauften Karten wird VVK gestoppt.",
        beschluesse: ["Samstag: VVK 8 €, AK 10 €"],
        aufgaben: ["Finale Entscheidung auf Vorstandssitzung"]
      },
      {
        titel: "Getränkekarte",
        icon: "🍹",
        inhalt: "Fass (Sa/So): Bier, Radler, Weißbier, Russ. Do/Fr: Flaschenbier. Alkoholfrei: Spezi, Weiße Limo, Apfelschorle, Wasser. Cocktails: Wodka Lemon/Bull, Kuba, Rüscher, Weinschorle, Aperol, Prosecco. Gestrichen: Gelbe Limo, Gin Tonic, offener Wein. Prosecco aus dem Fass für Aperol.",
        beschluesse: ["Getränkekarte festgelegt", "Gin Tonic und offener Wein gestrichen"]
      },
      {
        titel: "Eiswürfel",
        icon: "🧊",
        inhalt: "Keine Eiswürfelmaschine (zu langsam, Hygiene). 300 kg fertiges Eis bestellen (Daniel Meinel). Lagerung in Styroporboxen mit Trockeneis. Notfall: Edeka, Kaufland, Metro.",
        aufgaben: ["300 kg Eis bei Daniel Meinel bestellen"]
      },
      {
        titel: "Essen",
        icon: "🥨",
        inhalt: "Do (Wattturnier): Wurstsalat, Brezen, Obatzda (200–250 Brezen). Fr: Leberkässemmeln (300–350 Stk). Sa: Pommes, Grill, abends Obatzda/Wurstsalat (500–750 Semmeln). So: Schweinebraten mit Kartoffel-/Kraut-/Karottensalat + Käsespätzle (in Gaspfanne). Kaffee & Kuchen am Sonntagnachmittag: 50+ Kuchen über Helferliste. Küchenequipment kostenlos aus Moosburg.",
        aufgaben: ["Bäcker anfragen (Reithof, Kreitmaier, Hasi)", "Kuchenspenden über Helferliste sammeln"]
      },
      {
        titel: "Helferliste & Helfergruppe",
        icon: "💪",
        inhalt: "WhatsApp-Helfergruppe: 100 Mitglieder. Helferliste.de für Koordination (Posten: Aufbau, Zeltaufbau, Deko, Service, Abbau, Kuchenspende, Sachspenden).",
        aufgaben: ["Begrüßungsnachricht in WhatsApp-Gruppe posten", "Posten auf Helferliste.de erstellen"]
      },
      {
        titel: "Landratsamt & Genehmigungen",
        icon: "📄",
        inhalt: "Geländeplan ans Landratsamt (inkl. Rettungszufahrt). Veranstaltungszeiten: Do 16:00–00:00, Fr 19:00–03:00, Sa 07:00–03:00, So 10:00–20:00.",
        beschluesse: ["Veranstaltungszeiten definiert"],
        aufgaben: ["Geländeplan einreichen"]
      },
      {
        titel: "Festprogramm",
        icon: "📅",
        inhalt: "Do: 16:00 Eröffnung, Brotzeit, 19:00 Wattturnier. Fr: 19:00 Discoparty mit DJ Josh. Sa: 09:00 Jugendturnier, 12:00 Stockschützen, 14:00 Fußballturnier & Kindernachmittag, 18:00 Festzeltparty 'Drunter und Drüber'. So: 10:00 Gottesdienst + Böllerschützen, 11:30 Mittagstisch + Blasmusik, 13:00 Ehrungen, 14:30 Kaffee/Kuchen + Kindertanzgruppe.",
        beschluesse: ["Festprogramm für alle 4 Tage festgelegt"]
      },
      {
        titel: "Service-Planung Festsonntag (mit Petra & Miriam)",
        icon: "🍻",
        inhalt: "25+ Servicekräfte + 10 Backup für 5 Tischreihen. Pro Gang 4 Personen: 1 nimmt Bestellung auf/kassiert, 1 holt Essen, 1 holt Getränke, 1 trägt Schlitten. Wertmarken-System: Farbige Chips pro Getränk (z.B. Rot=Bier, Weiß=Weißbier, Orange=Spezi). 250 Stk/Farbe à 10 €, gesamt ~100 €. Bezahlung: Mindestlohn 12,90 €/Std für ~4–5h = ~1.390 € gesamt. Trinkgeld am Sonntag für Bedienungen. Fr/Sa ehrenamtlich. Einweisung 1–2 Wochen vorher durch Petra.",
        beschluesse: ["Wertmarken-System beschlossen", "Mindestlohn für So-Servicekräfte", "Trinkgeld So für Bedienungen, Fr/Sa für Vereinskasse"],
        aufgaben: ["Petra: Bedienungen akquirieren", "Petra: Einweisung 1–2 Wochen vor Fest", "Alex: Steuerliche Abwicklung klären", "Wertmarken bestellen (~100 €)"]
      },
      {
        titel: "Sonstiges",
        icon: "📋",
        inhalt: "Social Media: 800 Mitglieder sollen Flyer teilen, Instagram-Reels. Kartenzahlung: nur Bargeld, Notlösung: Vereins-Kartenterminal. Ministranten (12 Stk) versorgen. Besteck: 500 + 200 Reserve + 1.000 vom Ernst. Nächster Termin: 30.03.2026, ab April alle 2 Wochen, ab Mai wöchentlich.",
        beschluesse: ["Keine Kartenzahlung, nur Bargeld"],
        aufgaben: ["Instagram-Reels produzieren", "Nächste Sitzung: 30.03.2026"]
      }
    ]
  }
]

export default function ProtokollePage() {
  const [selectedId, setSelectedId] = useState<string>("1")
  const selected = SITZUNGEN.find(s => s.id === selectedId)!

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 -mx-4 -mt-16 lg:-mt-6 px-4 pt-16 lg:pt-6 pb-4 mb-6 rounded-b-lg">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
            <h1 className="text-2xl font-bold text-white">Transkripte & Sitzungen</h1>
          </div>
          <div className="text-sm text-gray-400">{SITZUNGEN.length} Sitzungen</div>
        </div>
      </div>

      {/* Sitzungs-Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SITZUNGEN.map(s => (
          <button key={s.id} onClick={() => setSelectedId(s.id)}
            className={`shrink-0 px-4 py-3 rounded-lg border-2 text-left transition-colors ${
              selectedId === s.id ? "border-blue-500 bg-blue-50 shadow" : "border-gray-200 bg-white hover:bg-gray-50"
            }`}>
            <div className="text-xs text-gray-500">{s.datum}</div>
            <div className="font-semibold text-sm text-gray-900">Sitzung {s.nummer}</div>
          </button>
        ))}
      </div>

      {/* Zusammenfassung */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Zusammenfassung</h3>
        <p className="text-sm text-blue-900 leading-relaxed">{selected.zusammenfassung}</p>
      </div>

      {/* Themen */}
      <div className="space-y-4">
        {selected.themen.map((t, i) => (
          <div key={i} className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-900">{t.icon} {t.titel}</h3>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">{t.inhalt}</p>

              {t.beschluesse && t.beschluesse.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-xs font-bold text-green-700 uppercase mb-1">Beschlüsse</div>
                  <ul className="space-y-1">
                    {t.beschluesse.map((b, j) => (
                      <li key={j} className="text-sm text-green-800 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">&#10003;</span>{b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {t.aufgaben && t.aufgaben.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-xs font-bold text-amber-700 uppercase mb-1">Offene Aufgaben</div>
                  <ul className="space-y-1">
                    {t.aufgaben.map((a, j) => (
                      <li key={j} className="text-sm text-amber-800 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">&#9679;</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
