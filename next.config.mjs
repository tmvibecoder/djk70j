/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dauerhafte Weiterleitungen der alten Ein-Fest-URLs auf die neue
  // Veranstaltungs-Struktur (permanent: true → HTTP 308, das moderne 301).
  async redirects() {
    return [
      { source: '/finanzen', destination: '/jubilaeum-2026/finanzplanung', permanent: true },
    ]
  },
};

export default nextConfig;
