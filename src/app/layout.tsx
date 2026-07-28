import type { Metadata } from "next";
import localFont from "next/font/local";
import { Archivo, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { AppHeader } from "@/components/AppHeader";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${sourceSans.variable} antialiased min-h-screen`}
      >
        <div className="flex min-h-screen">
          <Navigation />
          <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
            <AppHeader />
            <main className="flex-1 overflow-auto p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
