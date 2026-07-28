/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dauerhafte Weiterleitungen der alten Ein-Fest-URLs auf die neue
  // Veranstaltungs-Struktur (permanent: true → HTTP 308, das moderne 301).
  async redirects() {
    return [
      // Live-Bereiche der alten Struktur
      { source: '/finanzen', destination: '/jubilaeum-2026/finanzplanung', permanent: true },
      { source: '/festplanung', destination: '/jubilaeum-2026/festplanung', permanent: true },
      // Warenwirtschaft (Bereich entfernt) → Startseite des Jubiläums
      { source: '/waren', destination: '/jubilaeum-2026', permanent: true },
      { source: '/waren/inventur', destination: '/jubilaeum-2026', permanent: true },
      { source: '/waren/verkauf', destination: '/jubilaeum-2026', permanent: true },
      // Gelöschte Alt-Seiten (Finanz-Themen)
      { source: '/kosten', destination: '/jubilaeum-2026/finanzplanung', permanent: true },
      { source: '/sponsoring', destination: '/jubilaeum-2026/finanzplanung', permanent: true },
      { source: '/uebersicht', destination: '/jubilaeum-2026/finanzplanung', permanent: true },
      { source: '/planer', destination: '/jubilaeum-2026/finanzplanung', permanent: true },
      { source: '/prognose', destination: '/jubilaeum-2026/finanzplanung', permanent: true },
      // Gelöschte Alt-Seiten (Festplanungs-Themen)
      { source: '/teilnehmer', destination: '/jubilaeum-2026/festplanung', permanent: true },
      // Ehemalige Redirect-Stubs
      { source: '/bestand', destination: '/jubilaeum-2026', permanent: true },
      { source: '/inventur', destination: '/jubilaeum-2026', permanent: true },
      { source: '/getraenke', destination: '/jubilaeum-2026', permanent: true },
      { source: '/getraenke/katalog', destination: '/jubilaeum-2026', permanent: true },
      { source: '/produkte', destination: '/jubilaeum-2026', permanent: true },
      { source: '/protokolle', destination: '/jubilaeum-2026', permanent: true },
    ]
  },
};

export default nextConfig;
