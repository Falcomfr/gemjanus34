import type { Metadata } from "next";
import { Nunito_Sans, Source_Serif_4 } from "next/font/google";
import { AnalyticsBeacon } from "@/components/analytics-beacon";
import { SiteFooter } from "@/components/site-footer";
import { ThemeStyle } from "@/components/theme-style";
import { SiteHeader } from "@/components/site-header";
import { getExtraPages } from "@/lib/content/extra-pages";
import { getSiteSettings, membershipHref } from "@/lib/settings/site-settings";
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
  const [settings, extraPages] = await Promise.all([getSiteSettings(), getExtraPages()]);
  return (
    <html lang="fr" className={`${body.variable} ${display.variable}`}>
      <body>
        <ThemeStyle theme={settings.theme} />
        <a className="skip-link" href="#contenu">Aller au contenu</a>
        <SiteHeader extraPages={extraPages} />
        <main id="contenu">{children}</main>
        <SiteFooter extraPages={extraPages} membershipHref={membershipHref(settings)} galleryEnabled={settings.galleryEnabled} conferencesEnabled={settings.conferencesEnabled} />
        <AnalyticsBeacon token={process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN} />
      </body>
    </html>
  );
}
