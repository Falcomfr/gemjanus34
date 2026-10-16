import type { Metadata } from "next";
import { Nunito_Sans, Source_Serif_4 } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getExtraPages } from "@/lib/content/extra-pages";
import "./globals.css";

const body = Nunito_Sans({ subsets: ["latin"], variable: "--font-body" });
const display = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

// ponytail: every page renders per request with fresh Supabase data, because the
// incremental page cache kept serving stale pages after admin changes. Fine at this
// traffic; if it grows, reintroduce caching with explicit tags and test invalidation.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Janus34", template: "%s | Janus34" },
  description:
    "Janus34, Groupe d'Entraide Mutuelle à Montpellier depuis 2006 : rompre les solitudes, créer des liens.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${body.variable} ${display.variable}`}>
      <body>
        <a className="skip-link" href="#contenu">Aller au contenu</a>
        <SiteHeader />
        <main id="contenu">{children}</main>
        <SiteFooter extraPages={await getExtraPages()} />
      </body>
    </html>
  );
}
