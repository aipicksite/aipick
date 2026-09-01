import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "AIPick — Discover, Vote, and Pick the Best AI Tools",
  description:
    "A community-powered directory to discover, compare, and rank the best AI tools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen bg-base text-ink font-body antialiased">
        <header className="border-b border-line">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="font-display font-bold text-lg">
              AIPick
            </a>
            <nav className="flex gap-6 text-sm">
              <a href="/tools" className="hover:text-violet">Browse</a>
              <a href="/trending" className="hover:text-violet">Trending</a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="border-t border-line mt-20">
          <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-ink/60">
            AIPick — a community-ranked directory of AI tools.
          </div>
        </footer>
      </body>
    </html>
  );
}
