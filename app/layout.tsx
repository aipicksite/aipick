import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/settings";
import UserMenu from "@/components/UserMenu";
import Logo from "@/components/Logo";
import MobileNav from "@/components/MobileNav";
import BrowseMenu from "@/components/BrowseMenu";
import Script from "next/script";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const viewport: Viewport = {
  colorScheme: "light",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL("https://aipick.site"),
    title: settings.site_title,
    description: settings.site_description,
    verification: settings.google_site_verification
      ? { google: settings.google_site_verification }
      : undefined,
    openGraph: {
      siteName: "AIPick",
      type: "website",
      locale: "en_US",
      title: settings.site_title,
      description: settings.site_description,
      images: settings.og_image_url ? [{ url: settings.og_image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.site_title,
      description: settings.site_description,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const [
    {
      data: { user },
    },
    settings,
  ] = await Promise.all([supabase.auth.getUser(), getSiteSettings()]);

  let username: string | null = null;
  let isAdmin = false;

  if (user) {
    const [{ data: profile }, { data: adminRow }] = await Promise.all([
      supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
      supabase.from("admin_users").select("id").eq("email", user.email).maybeSingle(),
    ]);
    username = profile?.username ?? null;
    isAdmin = !!adminRow;
  }

  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen bg-base text-ink font-body antialiased">
        {settings.google_analytics_id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.google_analytics_id}');
              `}
            </Script>
          </>
        )}
        <header className="sticky top-0 z-30 backdrop-blur bg-base/85 border-b border-line relative">
          <div className="h-[3px] bg-gradient-to-r from-plum via-gold to-forest" />
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Logo size={32} />
              <span className="font-display font-bold text-lg tracking-tight">
                AIPick
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm">
              <BrowseMenu />
              <Link href="/top/trending-ai-tools" className="px-3 py-2 rounded-md text-ink/70 hover:text-plum hover:bg-plum/5 transition-colors">
                Trending
              </Link>
              <Link href="/top/best-free-ai-tools" className="px-3 py-2 rounded-md text-ink/70 hover:text-plum hover:bg-plum/5 transition-colors">
                Rankings
              </Link>
              <Link href="/compare" className="px-3 py-2 rounded-md text-ink/70 hover:text-plum hover:bg-plum/5 transition-colors">
                Compare
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/submit"
                className="hidden sm:inline-flex text-sm font-medium px-3.5 py-2 rounded-md border border-gold/40 text-gold bg-gold/10 hover:bg-gold/15 hover:border-gold/60 transition-colors"
              >
                Submit a tool
              </Link>
              {user ? (
                <UserMenu email={user.email ?? ""} username={username} isAdmin={isAdmin} />
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium px-3.5 py-2 rounded-md bg-plum text-white hover:bg-plum-deep transition-colors shadow-card"
                >
                  Sign in
                </Link>
              )}
              <MobileNav />
            </div>
          </div>
        </header>

        {children}

        <footer className="border-t border-line mt-24 bg-surface/60">
          <div className="h-[3px] bg-gradient-to-r from-plum via-gold to-forest" />
          <div className="max-w-6xl mx-auto px-4 py-12 grid gap-8 sm:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div>
              <span className="font-display font-bold text-lg flex items-center gap-2">
                <Logo size={22} />
                AIPick
              </span>
              <p className="text-sm text-ink/55 mt-2 max-w-xs leading-relaxed">
                Discover. Vote. Review. Pick. A community-ranked directory of
                AI tools — not a pay-to-rank list.
              </p>
            </div>
            <div className="text-sm">
              <h4 className="font-display font-semibold text-plum mb-3">Explore</h4>
              <ul className="space-y-2 text-ink/55">
                <li><Link href="/tools" className="hover:text-plum transition-colors">Browse tools</Link></li>
                <li><Link href="/top/top-100-ai-tools" className="hover:text-plum transition-colors">Top 100 AI Tools</Link></li>
                <li><Link href="/top/best-free-ai-tools" className="hover:text-plum transition-colors">Free AI Tools</Link></li>
                <li><Link href="/category" className="hover:text-plum transition-colors">Categories</Link></li>
                <li><Link href="/top/trending-ai-tools" className="hover:text-plum transition-colors">Trending</Link></li>
                <li><Link href="/compare" className="hover:text-plum transition-colors">Compare</Link></li>
              </ul>
            </div>
            <div className="text-sm">
              <h4 className="font-display font-semibold text-gold mb-3">Community</h4>
              <ul className="space-y-2 text-ink/55">
                <li><Link href="/submit" className="hover:text-plum transition-colors">Submit a tool</Link></li>
                <li><Link href="/blog" className="hover:text-plum transition-colors">Blog</Link></li>
                <li><Link href="/login" className="hover:text-plum transition-colors">Sign in</Link></li>
              </ul>
            </div>
            <div className="text-sm">
              <h4 className="font-display font-semibold text-forest mb-3">Company</h4>
              <ul className="space-y-2 text-ink/55">
                <li><Link href="/about" className="hover:text-plum transition-colors">About</Link></li>
                <li><Link href="/how-it-works" className="hover:text-plum transition-colors">How ranking works</Link></li>
                <li><Link href="/support" className="hover:text-plum transition-colors">Support</Link></li>
                <li><Link href="/contact" className="hover:text-plum transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-line">
            <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink/45">
              <span>© {new Date().getFullYear()} AIPick.site — a community-ranked directory of AI tools.</span>
              <div className="flex gap-4">
                <Link href="/privacy" className="hover:text-plum transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-plum transition-colors">Terms</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
