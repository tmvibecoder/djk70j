import s from './abschlussbericht.module.css'
import AnmerkungenPanel from './AnmerkungenPanel'

// Protokoll der Abschlussbesprechung zum 70-Jahre-Jubiläumsfest 2026.
// Inhalt 1:1 aus dem gelieferten HTML-Dokument übernommen; einzige inhaltliche
// Änderung: In der Maßnahmenliste (TOP 4) ist die leere Spalte „Verantwortlich"
// entfernt — die Verantwortlichen werden laut Hinweis unter der Tabelle in der
// Vorstandssitzung am 13. August festgelegt.
// Der Anmerkungs-Balken liegt bewusst AUSSERHALB von .va-sheet: dessen
// overflow:hidden würde position:sticky sonst aushebeln.
export default function AbschlussberichtView({ eventId }: { eventId: string }) {
  return (
    <section className={s.va}>
      <AnmerkungenPanel eventId={eventId} />
      <article className={s['va-sheet']}>
        <header className={s['va-head']}>
          <div className={s['va-marke']}>DJK <span>Ottenhofen</span> e.&nbsp;V.</div>
          <div className={s['va-org']}>Festausschuss · 70-Jahre-Jubiläumsfest 2026</div>
        </header>
        <div className={s['va-body']}>
          <div className={s['va-titel']}>
            <h1>Protokoll der <mark>Abschlussbesprechung</mark></h1>
            <div className={s['va-sub']}>Jubiläumsfest „70 Jahre DJK Ottenhofen“ · 9.–12. Juli 2026</div>
          </div>

          <dl className={s['va-meta']}>
            <dt>Anlass</dt><dd>Nachbesprechung des Festwochenendes (Auswertung, Learnings, Beschlüsse)</dd>
            <dt>Festwochenende</dt><dd>Donnerstag, 09. – Sonntag, 12. Juli 2026</dd>
            <dt>Besprechung</dt><dd>Juli 2026 · Festausschuss</dd>
            <dt>Verteiler</dt><dd>Vorstandschaft, Festausschuss, Helferinnen und Helfer</dd>
            <dt>Stand</dt><dd>Finale Fassung · inkl. Endabrechnung per 27. Juli 2026</dd>
          </dl>

          <div className={s['va-top']}>
            <span className={s['va-topnum']}>TOP 1</span>
            <h2>Gesamtfazit</h2>
            <p>Das Jubiläumsfest zum 70-jährigen Bestehen der DJK Ottenhofen war organisatorisch und atmosphärisch ein voller Erfolg und schließt auch wirtschaftlich mit einem positiven Ergebnis ab. Vier Tage bestes Festwetter, ein durchgehend gelobtes Essensangebot, eine starke Helfergemeinschaft und eine gut durchdachte Platzaufteilung haben das Fest getragen. Kleinere Ausfälle und Engpässe wurden im Team souverän aufgefangen.</p>
            <p>Wirtschaftlich steht aus dem Festbetrieb ein Ergebnis von <b>+1.752,16&nbsp;€</b> (Einzelheiten unter TOP&nbsp;5); zusätzlich flossen dem Verein rund 5.000&nbsp;€ an Spenden und Sponsoring zu. Hinter den Erwartungen zurück blieben die Besucherzahlen – insbesondere am Freitag. Daraus ergeben sich die wichtigsten Lehren für kommende Veranstaltungen: breitere und frühere Werbung, ein familienfreundlicheres Freitagskonzept sowie klarere Zuständigkeiten in Einkauf, Kasse und Organisation.</p>
          </div>

          <div className={`${s['va-top']} ${s.pb}`}>
            <span className={s['va-topnum']}>TOP 2</span>
            <h2>Was gut gelaufen ist</h2>
            <ul className={s['va-list']}>
              <li><b>Stimmung &amp; Team:</b> In allen Schichten sowie bei Auf- und Abbau herrschte durchweg gute Stimmung; Ausfälle (Spülmaschine, Grill, kurzfristige Absagen) wurden gut aufgefangen.</li>
              <li><b>Wetter &amp; Gelände:</b> Vier Tage „Kaiserwetter“; die Kombination aus Festzelt und Biergarten hat sich für jedes Wetterszenario bewährt.</li>
              <li><b>Samstag:</b> Sommerfest-Charakter mit Band – voller Erfolg; mit 16.166&nbsp;€ Umsatz (47,7&nbsp;%) der mit Abstand stärkste Festtag. Format beibehalten.</li>
              <li><b>Festsonntag:</b> Gut besuchter Gottesdienst (ca. 200 Personen), vielfach gelobtes Festessen (3.300&nbsp;€ Umsatz), schnelle und entspannte Essensausgabe.</li>
              <li><b>Gastronomie:</b> Das Brotzeit-Angebot im Biergarten wurde sehr gut angenommen; das Essensangebot wurde ab Freitag flexibel erweitert.</li>
              <li><b>Ausschankanhänger:</b> Mit 11.287&nbsp;€ Umsatz (33,3&nbsp;%) der stärkste Einzelstandort des Festes – fester Bestandteil künftiger Feste.</li>
              <li><b>Planung:</b> Schichtplan mit 15 Minuten Übergabezeit, bewährte Helferliste, durchdachte räumliche Anordnung mit sauberem Versorgungsweg über den Zeltboden.</li>
              <li><b>Technik &amp; Atmosphäre:</b> Bühne, Licht, leuchtendes DJK-Logo und Himmelsspots wurden besonders gelobt.</li>
              <li><b>Koordination:</b> Walkie-Talkies und Videoüberwachung (inkl. Zeitraffer) haben sich bewährt.</li>
              <li><b>Improvisation Festsonntag:</b> Die kurzfristige Lösung bei der Essens- und Getränkeausgabe funktionierte hervorragend und wird als Standard übernommen.</li>
            </ul>
          </div>

          <div className={`${s['va-top']} ${s.pb}`}>
            <span className={s['va-topnum']}>TOP 3</span>
            <h2>Verbesserungspotenzial</h2>

            <h3>3.1 · Besucher &amp; Werbung</h3>
            <ul className={s['va-check']}>
              <li>Freitagskonzept neu ausrichten – das klassische Partyformat zieht nicht mehr (ca. 150–220 Gäste statt 600 kalkulierter)</li>
              <li>Alternativen prüfen: ruhiger Biergartenabend mit Musik, Kultur- oder Familienprogramm</li>
              <li>Werbung früher, breiter und familienorientierter aufsetzen</li>
              <li>Flyer an alle Haushalte, Social Media und Plakate fest einplanen</li>
              <li>Terminüberschneidungen mit Veranstaltungen in Nachbarorten frühzeitig prüfen</li>
              <li>Vorverkauf und Jubiläumsartikel (z.&nbsp;B. Shirts) bereits im Winter starten</li>
            </ul>

            <h3>3.2 · Zuständigkeiten &amp; Team</h3>
            <ul className={s['va-check']}>
              <li>Pro Bereich genau eine verantwortliche Ansprechperson (Küche, Bar, Ausschank, Technik, Einkauf)</li>
              <li>Pro Station eine Person für Aufbau und vollständige Ausstattung benennen</li>
              <li>Widersprüchliche Ansagen vermeiden – Entscheidungen laufen über die Bereichsverantwortlichen</li>
              <li>Festausschuss während der Festwoche möglichst vollzählig vor Ort</li>
              <li>Zeltwache fest einplanen</li>
              <li>Vorbereitungstreffen mit allen Bedienungen eine Woche vor dem Fest</li>
            </ul>

            <h3>3.3 · Einkauf, Rechnungen &amp; Kasse</h3>
            <ul className={s['va-check']}>
              <li>Bestellungen und Rechnungen über eine zentrale Stelle mit klarer Freigabe abwickeln</li>
              <li>Alle Belege digital ablegen – inklusive Vermerk, wer was vereinbart hat</li>
              <li>Inventur vor und nach dem Fest durchführen</li>
              <li>Freiessen und Freigetränke (Ehrengäste, Kapelle, Helfer) von vornherein einpreisen</li>
              <li>Wechselgeldkonzept: deutlich mehr Kleingeld, beschriftete Kassen, eigene Bedienungsgeldbeutel</li>
              <li>Spenden und Sponsoring sauber trennen – Werbeleistungen ordnungsgemäß in Rechnung stellen</li>
            </ul>

            <h3>3.4 · Infrastruktur &amp; Abläufe</h3>
            <ul className={s['va-check']}>
              <li>Abstimmungstermin mit Gemeinde/VG bereits 3–4 Monate vor dem Fest – Wasser und Abwasser waren der größte Zeitfresser (ca. 20–50 Arbeitsstunden)</li>
              <li><b>Zwei getrennte Büroräume einplanen</b> – darunter ein eigener, abschließbarer Raum ausschließlich für Geldaufbewahrung und Abrechnung</li>
              <li>Festbüro mit Tresor und Grundausstattung ausstatten (Werkzeug, Kabelbinder, Klebeband)</li>
              <li>Zeltplanung inklusive Windverstrebungen – der geplante Durchgang zum Ausschank war blockiert</li>
              <li>Zapfhahn-Belegung vorab planen und je Schicht kurz einweisen</li>
              <li>Spüllogistik verbessern: mehr Spülkörbe, gegebenenfalls Gläser extern spülen lassen</li>
              <li>Übergaberegel „sauber“ je Schicht – besonders vor dem Festsonntag</li>
            </ul>

            <h3>3.5 · Gäste-Erlebnis</h3>
            <ul className={s['va-check']}>
              <li><b>Aktiver Getränkeservice:</b> Wenn an der Bar wenig los ist, gehen die Barkräfte mit Getränken an die Tische im Biergarten und im Festzelt</li>
              <li>Einlass- und Eintrittskonzept für das gesamte Gelände klären (Übergang Biergarten – Zelt)</li>
              <li>Essenspräsentation verbessern: nicht aus Großgebinden ausgeben, Semmeln nicht durchweichen lassen, mehr Farbe auf dem Teller</li>
              <li>Allergenliste bereitstellen</li>
              <li>Pfand-Handling am Festsonntag klar regeln</li>
              <li>Ton (Gesang) besser abmischen und die Bühne von vorne beleuchten</li>
              <li>Konditionen externer Anbieter (z.&nbsp;B. Kaffee, Eis) vorab festlegen</li>
              <li>Regeln für Helfergetränke einheitlich kommunizieren</li>
              <li>In Festreden alle Helfergruppen gleichermaßen würdigen</li>
            </ul>
          </div>

          <div className={`${s['va-top']} ${s.pb}`}>
            <span className={s['va-topnum']}>TOP 4</span>
            <h2>Maßnahmenliste (Auszug)</h2>
            <div className={s['va-scroll']}>
              <table className={s['va-tbl']}>
                <tbody>
                  <tr><th>Bereich</th><th>Maßnahme</th><th>Zeithorizont</th></tr>
                  <tr><td>Werbung</td><td>Flyer an alle Haushalte, Social-Media-Plan, Vorverkauf ab Weihnachtsmarkt</td><td>ab Winter</td></tr>
                  <tr><td>Gemeinde</td><td>Abstimmungstermin Versorgung (Wasser, Abwasser, Strom)</td><td>3–4 Mon. vor Fest</td></tr>
                  <tr><td>Einkauf</td><td>Zentrale Bestell- und Rechnungsstelle, digitale Belegablage</td><td>ab sofort</td></tr>
                  <tr><td>Kasse</td><td>Wechselgeldkonzept, Bedienungsgeldbeutel anschaffen, Tresor</td><td>vor nächstem Fest</td></tr>
                  <tr><td>Personal</td><td>Bereichsverantwortliche benennen, Treffen mit allen Bedienungen</td><td>1 Woche vor Fest</td></tr>
                  <tr><td>Ausschank</td><td>Zapfhahn-Belegung planen, Einweisung je Schicht</td><td>zum Fest</td></tr>
                  <tr><td>Küche</td><td>Stationsverantwortliche, Allergenliste, Übergaberegel „sauber“</td><td>zum Fest</td></tr>
                  <tr><td>Infrastruktur</td><td>Festbüro mit Tresor und Grundausstattung einrichten</td><td>vor nächstem Fest</td></tr>
                  <tr><td>Programm</td><td>Freitagskonzept neu entwickeln (Familie, Biergartenabend)</td><td>Planungsphase</td></tr>
                  <tr><td>Doku</td><td>Inventur sowie Mengen- und Wetterdokumentation je Veranstaltung</td><td>laufend</td></tr>
                </tbody>
              </table>
            </div>
            <p className={s['va-note']} style={{ marginTop: 8 }}>Die Verantwortlichen werden in der Vorstandssitzung am 13. August festgelegt.</p>
          </div>

          <div className={`${s['va-top']} ${s.pb}`}>
            <span className={s['va-topnum']}>TOP 5</span>
            <h2>Endabrechnung des Jubiläumsfests</h2>
            <p>Sämtliche Rechnungen zum Jubiläumsfest sind eingegangen und erfasst; damit liegt die vollständige Endabrechnung vor (Stand: 27.&nbsp;Juli 2026).</p>

            <h3>5.1 · Rahmendaten</h3>
            <table className={s['va-kpi']}>
              <tbody>
                <tr><td>Festtage</td><td>4 (Do–So)</td></tr>
                <tr><td>Aufbau</td><td>ab Freitag, 03. Juli (7 Tage vor dem Fest)</td></tr>
                <tr><td>Abbau</td><td>Montag und Dienstag nach dem Fest</td></tr>
                <tr><td>Besucherspitzen</td><td>Do ~170 · Fr ~150–220 · Sa ~220 · So ~200</td></tr>
              </tbody>
            </table>

            <h3>5.2 · Finanzübersicht</h3>
            <table className={s['va-kpi']}>
              <tbody>
                <tr><td>Umsatz gesamt (brutto)</td><td>33.875,67&nbsp;€</td></tr>
                <tr><td>darin enthaltene Umsatzsteuer</td><td>3.818,17&nbsp;€</td></tr>
                <tr><td>Umsatz gesamt (netto)</td><td>27.023,82&nbsp;€</td></tr>
                <tr><td>Kosten gesamt (brutto)</td><td>32.123,51&nbsp;€</td></tr>
                <tr className={s.sum}><td>Ergebnis aus dem Festbetrieb</td><td className={s.pos}>+1.752,16&nbsp;€</td></tr>
              </tbody>
            </table>
            <p className={s['va-note']} style={{ marginTop: 10 }}>Zusätzlich – separat erfasst und nicht im Festergebnis enthalten: Spenden „70 Jahre“ ca. 2.500&nbsp;€ sowie Sponsoring/Werbeleistungen ca. 2.500&nbsp;€. Unter Einbezug dieser Mittel liegt der wirtschaftliche Gesamteffekt des Jubiläums bei rund +6.700&nbsp;€.</p>

            <h3>5.3 · Umsätze &amp; Kosten nach Tagen</h3>
            <div className={s['va-scroll']}>
              <table className={s['va-fx']}>
                <tbody>
                  <tr><th>Tag</th><th className={s.r}>Umsatz brutto</th><th className={s.r}>Anteil</th><th className={s.r}>Direkte Kosten</th><th className={s.r}>Saldo</th></tr>
                  <tr><td>Donnerstag, 09.07.</td><td className={s.r}>2.187,20&nbsp;€</td><td className={s.r}>6,5&nbsp;%</td><td className={s.r}>0,00&nbsp;€</td><td className={`${s.r} ${s.pos}`}>+2.187,20&nbsp;€</td></tr>
                  <tr><td>Freitag, 10.07.</td><td className={s.r}>7.818,84&nbsp;€</td><td className={s.r}>23,1&nbsp;%</td><td className={s.r}>1.750,00&nbsp;€</td><td className={`${s.r} ${s.pos}`}>+6.068,84&nbsp;€</td></tr>
                  <tr><td>Samstag, 11.07.</td><td className={s.r}>16.166,13&nbsp;€</td><td className={s.r}>47,7&nbsp;%</td><td className={s.r}>3.475,00&nbsp;€</td><td className={`${s.r} ${s.pos}`}>+12.691,13&nbsp;€</td></tr>
                  <tr><td>Sonntag, 12.07.</td><td className={s.r}>7.703,50&nbsp;€</td><td className={s.r}>22,7&nbsp;%</td><td className={s.r}>4.200,00&nbsp;€</td><td className={`${s.r} ${s.pos}`}>+3.503,50&nbsp;€</td></tr>
                  <tr><td>Allgemeine Kosten (tagesübergreifend)</td><td className={s.r}>—</td><td className={s.r}>—</td><td className={s.r}>22.698,51&nbsp;€</td><td className={`${s.r} ${s.neg}`}>−22.698,51&nbsp;€</td></tr>
                  <tr className={s.tot}><td>Gesamt</td><td className={s.r}>33.875,67&nbsp;€</td><td className={s.r}>100&nbsp;%</td><td className={s.r}>32.123,51&nbsp;€</td><td className={`${s.r} ${s.pos}`}>+1.752,16&nbsp;€</td></tr>
                </tbody>
              </table>
            </div>
            <p className={s['va-note']} style={{ marginTop: 8 }}>Der Samstag trug mit 47,7&nbsp;% knapp die Hälfte des gesamten Festumsatzes bei.</p>

            <h3>5.4 · Umsätze nach Standorten (brutto)</h3>
            <div className={s['va-scroll']}>
              <table className={s['va-fx']}>
                <tbody>
                  <tr><th>Standort</th><th className={s.r}>Umsatz</th><th className={s.r}>Anteil</th></tr>
                  <tr><td>Schankwagen</td><td className={s.r}>11.287,30&nbsp;€</td><td className={s.r}>33,3&nbsp;%</td></tr>
                  <tr><td>Bar</td><td className={s.r}>8.178,49&nbsp;€</td><td className={s.r}>24,1&nbsp;%</td></tr>
                  <tr><td>Essen</td><td className={s.r}>5.950,48&nbsp;€</td><td className={s.r}>17,6&nbsp;%</td></tr>
                  <tr><td>Festessen am Festsonntag</td><td className={s.r}>3.300,50&nbsp;€</td><td className={s.r}>9,7&nbsp;%</td></tr>
                  <tr><td>Eintritt</td><td className={s.r}>2.630,20&nbsp;€</td><td className={s.r}>7,8&nbsp;%</td></tr>
                  <tr><td>Kaffee &amp; Kuchen</td><td className={s.r}>1.597,50&nbsp;€</td><td className={s.r}>4,7&nbsp;%</td></tr>
                  <tr><td>Getränke am Festsonntag (Gottesdienst)</td><td className={s.r}>931,20&nbsp;€</td><td className={s.r}>2,7&nbsp;%</td></tr>
                  <tr className={s.tot}><td>Gesamt</td><td className={s.r}>33.875,67&nbsp;€</td><td className={s.r}>100&nbsp;%</td></tr>
                </tbody>
              </table>
            </div>
            <p className={s['va-note']} style={{ marginTop: 8 }}>Der Schankwagen war der mit Abstand stärkste Einzelstandort – das bestätigt den Beschluss, ihn fest für künftige Feste einzuplanen. Das Essen erzielte über alle Ausgabestellen zusammen 9.250,98&nbsp;€ (27,3&nbsp;%).</p>

            <h3 className={s.pb}>5.5 · Kostenübersicht</h3>
            <div className={s['va-scroll']}>
              <table className={s['va-fx']}>
                <tbody>
                  <tr><th>Position</th><th className={s.r}>Betrag (brutto)</th></tr>
                  <tr className={s.grp}><td colSpan={2}>Freitag, 10.07.</td></tr>
                  <tr><td>Security (Anteil Freitag)</td><td className={s.r}>1.450,00&nbsp;€</td></tr>
                  <tr><td>DJ Freitagabend</td><td className={s.r}>300,00&nbsp;€</td></tr>
                  <tr className={s.sub}><td>Summe Freitag</td><td className={s.r}>1.750,00&nbsp;€</td></tr>
                  <tr className={s.grp}><td colSpan={2}>Samstag, 11.07.</td></tr>
                  <tr><td>Live-Band „Drunter und Drüber“</td><td className={s.r}>1.700,00&nbsp;€</td></tr>
                  <tr><td>Security (Anteil Samstag)</td><td className={s.r}>1.525,00&nbsp;€</td></tr>
                  <tr><td>DJ Samstag (im Anschluss an die Band)</td><td className={s.r}>250,00&nbsp;€</td></tr>
                  <tr className={s.sub}><td>Summe Samstag</td><td className={s.r}>3.475,00&nbsp;€</td></tr>
                  <tr className={s.grp}><td colSpan={2}>Sonntag, 12.07.</td></tr>
                  <tr><td>Festbraten</td><td className={s.r}>2.800,00&nbsp;€</td></tr>
                  <tr><td>Blaskapelle (Festsonntag)</td><td className={s.r}>1.200,00&nbsp;€</td></tr>
                  <tr><td>Servicekräfte Sonntag</td><td className={s.r}>200,00&nbsp;€</td></tr>
                  <tr className={s.sub}><td>Summe Sonntag</td><td className={s.r}>4.200,00&nbsp;€</td></tr>
                  <tr className={s.grp}><td colSpan={2}>Allgemein / tagesübergreifend</td></tr>
                  <tr><td>Getränke Schweiger</td><td className={s.r}>8.044,00&nbsp;€</td></tr>
                  <tr><td>Getränke Daberger</td><td className={s.r}>3.408,24&nbsp;€</td></tr>
                  <tr><td>Zeltmiete</td><td className={s.r}>3.000,00&nbsp;€</td></tr>
                  <tr><td>Essen Holzer</td><td className={s.r}>2.113,27&nbsp;€</td></tr>
                  <tr><td>Lebensmitteleinkauf allgemein</td><td className={s.r}>1.600,00&nbsp;€</td></tr>
                  <tr><td>Kleinmaterial &amp; Sonstiges</td><td className={s.r}>1.190,00&nbsp;€</td></tr>
                  <tr><td>Toiletten &amp; Entsorgung</td><td className={s.r}>800,00&nbsp;€</td></tr>
                  <tr><td>Spülmaschinen</td><td className={s.r}>740,00&nbsp;€</td></tr>
                  <tr><td>Strom</td><td className={s.r}>500,00&nbsp;€</td></tr>
                  <tr><td>Werbung &amp; Flyer</td><td className={s.r}>500,00&nbsp;€</td></tr>
                  <tr><td>GEMA</td><td className={s.r}>400,00&nbsp;€</td></tr>
                  <tr><td>Eiswürfel (300&nbsp;kg)</td><td className={s.r}>175,00&nbsp;€</td></tr>
                  <tr><td>Wertmarken (Chips)</td><td className={s.r}>128,00&nbsp;€</td></tr>
                  <tr><td>Gießkannen &amp; Aufkleber</td><td className={s.r}>100,00&nbsp;€</td></tr>
                  <tr className={s.sub}><td>Summe Allgemein</td><td className={s.r}>22.698,51&nbsp;€</td></tr>
                  <tr className={s.tot}><td>Gesamtkosten</td><td className={s.r}>32.123,51&nbsp;€</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className={s['va-thanks']}>Der Festausschuss dankt allen Helferinnen und Helfern, allen Gästen sowie allen Spendern und Sponsoren herzlich für ihren Einsatz und ihre Unterstützung.</div>
        </div>
        <footer className={s['va-foot']}>
          <span>DJK Ottenhofen e.&nbsp;V. · Herdweger Str. 4 · 85570 Ottenhofen</span>
          <b>djk-ottenhofen.de</b>
        </footer>
      </article>
    </section>
  )
}
