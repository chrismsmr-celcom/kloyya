import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kloyya — Demande l'outcome, pas la réponse",
  description:
    "Kloyya lit les outils dans lesquels votre travail vit déjà et revient avec la décision.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${sans.variable} ${mono.variable}`}
    >
      <body className="bg-paper-soft text-ink font-sans antialiased">
        <Providers>
          <Navbar />

          <main className="mx-auto max-w-5xl px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
