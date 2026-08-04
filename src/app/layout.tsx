import type { Metadata } from "next";
import localFont from "next/font/local";
import { Archivo, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { AppHeader } from "@/components/AppHeader";
import { getSessionUserFromCookies, darf } from "@/lib/session";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
// Schriften des Abschlussberichts — zentral eingebunden, beim Build
// self-hosted (keine Laufzeit-Requests an Google)
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-archivo",
});
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-source-sans",
});

export const metadata: Metadata = {
  title: "DJK Events",
  description: "Veranstaltungs-Planung des DJK SG Ottenhofen e.V.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionUserFromCookies();
  const sichtbarkeit = {
    veranstaltungen: darf(session, "veranstaltungen", "lesen"),
    werbebanden: darf(session, "werbebanden", "lesen"),
    schluessel: darf(session, "schluessel", "lesen"),
    "djk-info": darf(session, "djk-info", "lesen"),
    istAdmin: session?.istAdmin ?? false,
  };

  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${sourceSans.variable} antialiased min-h-screen`}
      >
        <div className="flex min-h-screen">
          <Navigation sichtbarkeit={sichtbarkeit} />
          <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
            <AppHeader />
            {/* Kein overflow-auto: es würde nie greifen (die Seite scrollt im
                Fenster), aber position:sticky im Inhalt (Anmerkungs-Balken)
                unbrauchbar machen. */}
            <main className="flex-1 p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
