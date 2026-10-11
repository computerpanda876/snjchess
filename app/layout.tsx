// The layout wraps every page: it holds the header, the footer, and the font.

import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/hanken-grotesk";
import "./globals.css";
import { league } from "@/data/league";

export const metadata: Metadata = {
  title: {
    default: league.name,
    template: `%s | ${league.name}`,
  },
  description: `${league.name}: team chess on Friday nights. Schedule, standings, pairings, and rosters.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className="flex min-h-screen flex-col font-sans">
        <header className="border-b border-line">
          <div className="mx-auto flex w-full max-w-6xl items-baseline justify-between gap-6 px-5 py-5 sm:px-8">
            <Link href="/" className="font-bold tracking-tight">
              {league.name}
            </Link>
            <nav className="flex gap-5 text-sm whitespace-nowrap">
              <Link href="/" className="hover:text-accent">
                League info
              </Link>
              <Link href="/standings" className="hover:text-accent">
                Standings
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 sm:px-8">{children}</main>

        <footer className="border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-5 py-8 text-sm text-muted sm:px-8">
            {league.name}, {league.seasons[0].name}
          </div>
        </footer>
      </body>
    </html>
  );
}
