// Seed-Daten für den DJK-Info-Bereich — generiert aus der Excel
// „Abrechnung DJK Info 2025_Blanko_(3) - Stand 17.07.2025" (Sheets Abrechnung
// + Gekündigt) sowie „Übersicht-Austragegebiete.docx" und „Verteiler_202607.docx".
// Nur Daten, keine Logik — die Logik liegt in seed-djk-info.ts.

export interface InfoKundeSeed {
  firma: string
  zusatz?: string
  strasse?: string
  plz?: string
  ort?: string
  telefon?: string
  email?: string
  ansprechpartner?: string // Ansprechpartner DJK Info (Inhaber), aus Vorname/Nachname
  groesse?: string // "1/1" .. "1/4"; fehlt bei Gratis-Anzeigen ohne Preiszeile
  broschuerenversand?: string // 'post' laut Spalte „DJK Info Versand per Post"
  status?: string
  // Anzeigengröße je Ausgabe 2025-1..3 (null = nicht geschaltet)
  schaltungen2025?: (string | null)[]
  // Rechnung aus der Excel (Nummernkreis I): Jahr + laufende Nummer + Netto
  rechnungJahr?: number
  rechnungNr?: number
  rechnungNetto?: number
}

export const INFO_KUNDEN: InfoKundeSeed[] = [
  { firma: 'AXA Versicherung', zusatz: 'Christian Holbinger', strasse: 'Brunnenstraße 19', plz: '85570', ort: 'Ottenhofen', telefon: '08121/1532', email: 'christian.holbinger@axa.de', ansprechpartner: 'Christian Holbinger', groesse: '1/2', schaltungen2025: ['1/2', '1/2', '1/2'], rechnungJahr: 2025, rechnungNr: 1, rechnungNetto: 155.0 },
  { firma: 'B & R Home Entertainment', zusatz: 'Rudolf Rauch', strasse: 'Schellingstrasse 113', plz: '80798', ort: 'München', telefon: '089/57956002', email: 'info@br-homeentertainment.de', ansprechpartner: 'Rudolf Rauch', groesse: '1/1', schaltungen2025: ['1/1', '1/1', '1/1'], rechnungJahr: 2025, rechnungNr: 2, rechnungNetto: 290.0 },
  { firma: 'Bauunternehmung', zusatz: 'Ludwig Mayer GmbH', strasse: 'Breitötting 12', plz: '85457', ort: 'Wörth', telefon: '08121/66 92', email: 'kontakt@ludwig-mayer-bau.de', ansprechpartner: 'Ludwig Mayer', groesse: '1/4', schaltungen2025: ['1/4', '1/4', '1/4'], rechnungJahr: 2025, rechnungNr: 3, rechnungNetto: 90.0 },
  { firma: 'Bio Bauer Knauer', zusatz: 'Josef Knauer', strasse: 'Taing 1', plz: '85669', ort: 'Pastetten', telefon: '08121/5717', email: 'info@biobauerknauer.de', ansprechpartner: 'Josef Knauer', groesse: '1/4', schaltungen2025: ['1/4', '1/4', '1/4'], rechnungJahr: 2025, rechnungNr: 4, rechnungNetto: 90.0 },
  { firma: 'Camillo trattoria | cucina | bar', zusatz: 'Camillo Poerio', strasse: 'Erdinger Str. 22', plz: '85570', ort: 'Ottenhofen', telefon: '08121/48114', email: 'c-poerio@gmx.de', ansprechpartner: 'Camillo Poerio', groesse: '1/2', schaltungen2025: ['1/2', '1/2', '1/2'], rechnungJahr: 2025, rechnungNr: 5, rechnungNetto: 155.0 },
  { firma: 'Fliesenleger Fachbetrieb', zusatz: 'Michael Huber', strasse: 'Goetherring 35', plz: '85570', ort: 'Markt Schwaben', telefon: '08121/81301', email: 'info@fliesenleger-huber.de', ansprechpartner: 'Michael Huber', groesse: '1/2', schaltungen2025: ['1/2', '1/2', '1/2'], rechnungJahr: 2025, rechnungNr: 6, rechnungNetto: 155.0 },
  { firma: 'Forellenzucht "am Vogelherd"', zusatz: 'Christian Kiesle', strasse: 'Am Vogelherd 9', plz: '85570', ort: 'Ottenhofen-Herdweg', telefon: '08121/3372', email: 'info@kiesle.de', ansprechpartner: 'Ludwig Kiesle', groesse: '1/4', schaltungen2025: ['1/4', '1/4', '1/4'], rechnungJahr: 2025, rechnungNr: 7, rechnungNetto: 90.0 },
  { firma: 'Gärtnerei Wiethaus', zusatz: 'Peter Wiethaus', strasse: 'Fichtenstr. 16', plz: '85570', ort: 'Ottenhofen-Herdweg', telefon: '08121/1318', email: 'peter.wiethaus@yahoo.de', ansprechpartner: 'Peter Wiethaus', groesse: '1/3', schaltungen2025: ['1/3', '1/3', null], rechnungJahr: 2025, rechnungNr: 8, rechnungNetto: 73.33 },
  { firma: 'Georg Lippacher GmbH', zusatz: 'Georg Lippacher', strasse: 'Schwillacher Straße 7', plz: '85570', ort: 'Ottenhofen', telefon: '08121/3312', email: 'buero@lippacher.de', ansprechpartner: 'Birgit Furtner-Reiser', groesse: '1/2', schaltungen2025: ['1/2', '1/2', '1/2'], rechnungJahr: 2025, rechnungNr: 9, rechnungNetto: 155.0 },
  { firma: 'GLAM Beauty Shop', zusatz: 'Birgül Görür', strasse: 'Ebersbergerstr.3-5', plz: '85570', ort: 'Markt Schwaben', telefon: '0157/52007797', email: 'info@glam-beauty.studio', ansprechpartner: 'Birgül Görür', groesse: '1/1', schaltungen2025: ['1/1', '1/1', '1/1'], rechnungJahr: 2025, rechnungNr: 10, rechnungNetto: 290.0 },
  { firma: 'Heinrich Schmitt GmbH', zusatz: 'Heinrich S. Schmitt', strasse: 'Finsinger Str. 10', plz: '85570', ort: 'Markt Schwaben', telefon: '08121/9196-0', email: 'info@bauzentrum-schmitt.de', ansprechpartner: 'Heinrich S. Schmitt', groesse: '1/4', schaltungen2025: ['1/4', '1/4', '1/4'], rechnungJahr: 2025, rechnungNr: 11, rechnungNetto: 90.0 },
  { firma: 'Heizung & Sanitär', zusatz: 'Franz Jell jun.', strasse: 'Sonnendorf 14', plz: '85457', ort: 'Wörth', telefon: '08121/259505', ansprechpartner: 'Franz Jell', groesse: '1/2', schaltungen2025: ['1/2', '1/2', '1/2'], rechnungJahr: 2025, rechnungNr: 12, rechnungNetto: 155.0 },
  { firma: 'KFZ - Bauer', zusatz: 'Tobias Bauer', strasse: 'Erdinger Straße 3', plz: '85570', ort: 'Ottenhofen', telefon: '08121/48501', email: 'bauer-oldtimer@web.de', ansprechpartner: 'Tobias Bauer', groesse: '1/4', schaltungen2025: ['1/4', '1/4', '1/4'], rechnungJahr: 2025, rechnungNr: 13, rechnungNetto: 90.0 },
  { firma: 'KFZ-Technik & Service', zusatz: 'Siegfried Heuwieser', strasse: 'Perusastr. 2', plz: '85570', ort: 'Ottenhofen', telefon: '08121/924955', email: 'info@kfz-heuwieser.de', ansprechpartner: 'Siegfried Heuwieser', groesse: '1/4', schaltungen2025: ['1/4', '1/4', '1/4'], rechnungJahr: 2025, rechnungNr: 14, rechnungNetto: 90.0 },
  { firma: 'Kreis- und Stadtsparkasse Erding - Dorfen', zusatz: 'Hermann Seiler', strasse: 'Alois-Schießl-Platz 4', plz: '85435', ort: 'Erding', telefon: '08122/5511-4500', email: 'hermann.seiler@spked.de', ansprechpartner: 'Hermann Seiler', groesse: '1/1', schaltungen2025: ['1/1', '1/1', '1/1'], rechnungJahr: 2025, rechnungNr: 15, rechnungNetto: 290.0 },
  { firma: 'Liegl Mineralöle', zusatz: 'Dieter Dlask', strasse: 'Dieselstr. 8', plz: '85232', ort: 'Günding', telefon: '08121/46130', email: 'info@byenergie.de', ansprechpartner: 'Dieter Dlask', groesse: '1/4', broschuerenversand: 'post', schaltungen2025: ['1/4', '1/4', '1/4'], rechnungJahr: 2025, rechnungNr: 16, rechnungNetto: 90.0 },
  { firma: 'Lippacher + Müller Ingenieur GmbH', zusatz: 'Andreas Lippacher', strasse: 'Freisinger Str. 1', plz: '85435', ort: 'Erding', telefon: '08122/892049-0', email: 'info@statik-erding.de', ansprechpartner: 'Andreas Lippacher', groesse: '1/2', schaltungen2025: ['1/2', '1/2', '1/2'], rechnungJahr: 2025, rechnungNr: 17, rechnungNetto: 155.0 },
  { firma: 'M-Grill-Bar Sportheim', zusatz: 'Marko Dukic', strasse: 'Herdweger Str. 4', plz: '85570', ort: 'Ottenhofen', telefon: '0173/9083986', email: 'mgrillbar85570@gmail.com', ansprechpartner: 'Marko Dukic', schaltungen2025: ['1/3', '1/3', null] },
  { firma: 'Malermeister', zusatz: 'Christian Brunner', strasse: 'Am Ziegelberg 5', plz: '85570', ort: 'Ottenhofen', telefon: '08121/43295', email: 'brunner68@t-online.de', ansprechpartner: 'Christian Brunner', groesse: '1/2', schaltungen2025: ['1/2', '1/2', '1/2'], rechnungJahr: 2025, rechnungNr: 18, rechnungNetto: 155.0 },
  { firma: 'Metzgerei Gantner GmbH', zusatz: 'Rita Gantner', strasse: 'Hauptstraße 47', plz: '85457', ort: 'Wörth-Wifling', telefon: '08121/40085', email: 'info@metzgerei-holzer.de', ansprechpartner: 'Rita Gantner', groesse: '1/3', schaltungen2025: [null, '1/3', '1/3'], rechnungJahr: 2025, rechnungNr: 19, rechnungNetto: 73.33 },
  { firma: 'Physiotherapie in der Mühle', zusatz: 'Michel Kruppert', strasse: 'Hanslmühle 1', plz: '85570', ort: 'Markt Schwaben', telefon: '08121/9027440', email: 'info@physioindermuehle.de', ansprechpartner: 'Michel Kruppert', groesse: '1/2', schaltungen2025: ['1/2', '1/2', '1/2'], rechnungJahr: 2025, rechnungNr: 20, rechnungNetto: 155.0 },
  { firma: 'Privatbrauerei Schweiger', zusatz: 'GmbH & Co KG', strasse: 'Ebersberger Str. 25', plz: '85570', ort: 'Markt Schwaben', telefon: '08121/929-0', email: 'info@schweiger-bier.de', groesse: '1/2', schaltungen2025: ['1/2', '1/2', '1/2'], rechnungJahr: 2025, rechnungNr: 21, rechnungNetto: 155.0 },
  { firma: 'Quellwasserfischerei Christl', zusatz: 'Günther Christl', strasse: 'Fichtenstr. 25', plz: '85570', ort: 'Ottenhofen-Herdweg', telefon: '08121/3773', email: 'info@fischzucht-christl.de', ansprechpartner: 'Günther Christl', groesse: '1/4', schaltungen2025: ['1/4', '1/4', '1/4'], rechnungJahr: 2025, rechnungNr: 22, rechnungNetto: 90.0 },
  { firma: 'Reiser GbR', zusatz: 'Martin Reiser', strasse: 'Am Vogelherd 5', plz: '85570', ort: 'Ottenhofen-Herdweg', telefon: '08121/48386', email: 'martin.reiser@live.de', ansprechpartner: 'Martin Reiser', groesse: '1/3', schaltungen2025: ['1/3', '1/3', '1/3'], rechnungJahr: 2025, rechnungNr: 23, rechnungNetto: 110.0 },
  { firma: 'Schreinerei Heilmaier', zusatz: '& Esposito GmbH & Co.KG', strasse: 'Siegstätt 3', plz: '85661', ort: 'Forstinning', telefon: '08124/8917', email: 'info@schreinerei-heilmaier-esposito.de', ansprechpartner: 'Ludwig Heilmaier', groesse: '3/4', schaltungen2025: ['3/4', '3/4', null], rechnungJahr: 2025, rechnungNr: 24, rechnungNetto: 153.33 },
  { firma: 'Schuh-Forum', zusatz: 'Koppert, Ingerl & Wartner GbR', strasse: 'Unterasbach 5c', plz: '85646', ort: 'Anzing', telefon: '08121/223280', email: 'info@schuh-forum.com', ansprechpartner: 'Josef Ingerl', groesse: '1/2', broschuerenversand: 'post', schaltungen2025: ['1/2', '1/2', '1/2'], rechnungJahr: 2025, rechnungNr: 25, rechnungNetto: 155.0 },
  { firma: 'Traumvelo', zusatz: 'Andreas Seilinger', strasse: 'Schwillacher Str. 2a', plz: '85570', ort: 'Ottttenhofen', telefon: '08121/61629', email: 'andreas@traumvelo.de', ansprechpartner: 'Andreas Seilinger', groesse: '1/2', schaltungen2025: ['1/2', '1/2', '1/2'], rechnungJahr: 2025, rechnungNr: 26, rechnungNetto: 155.0 },
  { firma: 'VR-Bank Erding eG', zusatz: 'Daniela Hüniger', strasse: 'Zollnerstr. 4', plz: '85435', ort: 'Erding', telefon: '08122/200-1213', email: 'daniela.hueniger@vr-bank-erding.de', ansprechpartner: 'Daniela Hüninger', groesse: '1/1', schaltungen2025: ['1/1', '1/1', '1/1'], rechnungJahr: 2025, rechnungNr: 27, rechnungNetto: 290.0 },
  { firma: 'Wenninger + Kugler Metalldecken +', zusatz: 'Schallschutz-Elementbau GmbH', strasse: 'Tratmoos 14', plz: '85467', ort: 'Niederneuching', telefon: '08123/93250', ansprechpartner: 'Philipp Kugler', groesse: '1/2', schaltungen2025: ['1/2', '1/2', '1/2'], rechnungJahr: 2025, rechnungNr: 28, rechnungNetto: 155.0 },
  { firma: 'Flughafen München GmbH', zusatz: 'Petra Rittler', strasse: 'Postfach 23 17 55', plz: '85326', ort: 'München-Flughafen', telefon: '089/975 54074', email: 'petra.rittler@munich-airport.de', broschuerenversand: 'post', status: 'gekuendigt', schaltungen2025: ['1/1', '1/1', null] },
  { firma: 'Unser Kramer', zusatz: 'Brigitte Myckaniuk', strasse: 'Erdinger Str. 5', plz: '85570', ort: 'Ottenhofen', telefon: '08121/2589682', email: 'info@unser-kramer.de', ansprechpartner: 'Brigitte Myckaniuk', groesse: '1/2', status: 'gekuendigt', schaltungen2025: ['1/2', null, null], rechnungJahr: 2024, rechnungNr: 1, rechnungNetto: 51.67 },
  { firma: 'Zehetmair Innen- und Aussenputz GmbH', zusatz: 'Florian Zehetmair', strasse: 'Raiffeisenstr. 7', plz: '85570', ort: 'Ottenhofen', telefon: '08121/46754', ansprechpartner: 'Florian Zehetmair', groesse: '1/3', status: 'gekuendigt', schaltungen2025: ['1/3', '1/3', '1/3'], rechnungJahr: 2024, rechnungNr: 28, rechnungNetto: 110.0 },]

// Ottenhofener Austragegebiete mit Straßenlisten (Hefte editierbar in der App)
export interface GebietSeed {
  name: string
  kategorie: string // 'gebiet' | 'ortsteil' | 'auslage' | 'postversand'
  hefte: number
  beschreibung?: string
  strassen?: { name: string; hefte: number }[]
}

export const INFO_GEBIETE: GebietSeed[] = [
  {
    name: 'Gebiet 1', kategorie: 'gebiet', hefte: 183,
    strassen: [
      { name: 'Am Anger', hefte: 16 },
      { name: 'Am Mitterfeld', hefte: 40 },
      { name: 'Blumenweg', hefte: 10 },
      { name: 'Gartenstraße', hefte: 36 },
      { name: 'Ritterland', hefte: 42 },
      { name: 'Schlehbachweg', hefte: 14 },
      { name: 'Grashauser Straße', hefte: 25 },
    ],
  },
  {
    name: 'Gebiet 2', kategorie: 'gebiet', hefte: 152,
    strassen: [
      { name: 'Eichenweg', hefte: 21 },
      { name: 'Eichenweg (Janku)', hefte: 8 },
      { name: 'Hochstraße', hefte: 4 },
      { name: 'Kirchplatz', hefte: 10 },
      { name: 'Meillerweg', hefte: 34 },
      { name: 'Meillerweg (Brigitte Ertl)', hefte: 10 },
      { name: 'Pfarrweg', hefte: 10 },
      { name: 'Raiffeisenstraße + Lieberharting', hefte: 25 },
      { name: 'Schwillacher Straße bis Kurve', hefte: 18 },
      { name: 'Am Ziegelberg', hefte: 10 },
      { name: 'Herdweger Straße', hefte: 2 },
    ],
  },
  {
    name: 'Gebiet 3 (inkl. Neubaugebiet)', kategorie: 'gebiet', hefte: 159,
    strassen: [
      { name: 'Ahamstraße', hefte: 50 },
      { name: 'Erdinger Straße (inkl. Abzweige)', hefte: 56 },
      { name: 'Brandl / Hof hinter Brandl', hefte: 2 },
      { name: 'Waldstraße', hefte: 15 },
      { name: 'Pferdehof Glaser und Grögler', hefte: 2 },
      { name: 'An der Hofmark (Neubaugebiet)', hefte: 20 },
      { name: 'Keltenweg (Neubaugebiet)', hefte: 6 },
      { name: 'Falkenweg (Neubaugebiet)', hefte: 4 },
      { name: 'Höllgrabenweg (Neubaugebiet)', hefte: 4 },
    ],
  },
  {
    name: 'Gebiet 4', kategorie: 'gebiet', hefte: 121,
    strassen: [
      { name: 'Am Schloßberg', hefte: 22 },
      { name: 'Brunnenstraße', hefte: 22 },
      { name: 'Brunnenstraße (über AXA)', hefte: 2 },
      { name: 'Friedrich-Esswurm-Straße', hefte: 26 },
      { name: 'Perusastraße', hefte: 5 },
      { name: 'Riverastraße', hefte: 13 },
      { name: 'Semptweg', hefte: 15 },
      { name: 'Bäckerei', hefte: 10 },
      { name: 'Hinter Bäckerei', hefte: 6 },
    ],
  },
  { name: 'Herdweg – Siggenhofen', kategorie: 'ortsteil', hefte: 120, beschreibung: 'bis Seiler und Waldstr. · 5 Einheiten à 24' },
  { name: 'Schwillach – Grund – Wimpasing – Taing', kategorie: 'ortsteil', hefte: 85 },
  { name: 'Lieberharting', kategorie: 'ortsteil', hefte: 8 },
  { name: 'Sportheim DJK Ottenhofen', kategorie: 'auslage', hefte: 10, beschreibung: 'Auslage im Clubraum' },
  { name: 'Verkaufshütte', kategorie: 'auslage', hefte: 10, beschreibung: 'Mitglieder außerhalb Ottenhofens' },
  { name: 'VR-Bank Erding eG', kategorie: 'auslage', hefte: 5, beschreibung: 'Auslage in der Filiale' },
  { name: 'Unser Kramer', kategorie: 'auslage', hefte: 10, beschreibung: 'Auslage im Ladenlokal' },
  { name: 'Camillo', kategorie: 'auslage', hefte: 5 },
  { name: 'Postversand', kategorie: 'postversand', hefte: 14, beschreibung: 'Werbekunden + Ehrenmitglieder (z.B. Adolf Fischer, Am Weiher 10, 85567 Grafing)' },
]

// Verteilerliste aus Verteiler_202607.docx (Person "" = noch offen)
export const INFO_VERTEILER: { person: string; zustaendigkeit: string; stueckzahl: number }[] = [
  { person: '', zustaendigkeit: 'Ottenhofen Gebiete 1–4 (inkl. Werbekunden Ottenhofen)', stueckzahl: 598 },
  { person: '', zustaendigkeit: 'Josef Janku — Mitglieder mit Wohnsitz außerhalb von Ottenhofen', stueckzahl: 8 },
  { person: '', zustaendigkeit: 'Brigitte Ertl — Turner mit Wohnsitz außerhalb von Ottenhofen', stueckzahl: 10 },
  { person: '', zustaendigkeit: 'Werbekunden persönlich (Physiotherapie in der Mühle, Markt Schwaben)', stueckzahl: 2 },
  { person: '', zustaendigkeit: 'Trainer Spielgemeinschaft Wörth – Hörlkofen – Walpertskirchen', stueckzahl: 6 },
  { person: 'Johannes Mann', zustaendigkeit: 'Herdweg – Siggenhofen', stueckzahl: 120 },
  { person: 'Margit Greckl', zustaendigkeit: 'Schwillach – Grund – Wimpasing – Taing', stueckzahl: 85 },
  { person: 'Franz Fuchs', zustaendigkeit: 'Werbekunden persönlich + Versand per Post (inkl. Ehrenmitglieder)', stueckzahl: 14 },
  { person: 'Bernhard Greckl', zustaendigkeit: 'Auslagen (Sportheim, Verkaufshütte, VR-Bank, Unser Kramer, Camillo) + Einzelne', stueckzahl: 45 },
  { person: 'Oefele oder Heilmaier', zustaendigkeit: 'Lieberharting', stueckzahl: 8 },
]
