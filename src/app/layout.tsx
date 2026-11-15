import type { Metadata } from "next";
import { Nunito_Sans, Source_Serif_4 } from "next/font/google";
import { AnalyticsBeacon } from "@/components/analytics-beacon";
import { SiteEventTracker } from "@/components/site-event-tracker";
import { SiteFooter } from "@/components/site-footer";
import { ThemeStyle } from "@/components/theme-style";
import { SiteHeader } from "@/components/site-header";
import { getExtraPages } from "@/lib/content/extra-pages";
import { getSiteSettings, membershipHref } from "@/lib/settings/site-settings";
import { contact } from "@/content/contact";
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

const siteUrl = "https://gemjanus34.fr";

// The same site also answers on gemjanus34.vercel.app: every page names its gemjanus34.fr address.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "GEM Janus34, Groupe d'Entraide Mutuelle à Montpellier", template: "%s | GEM Janus34" },
  description:
    "Janus34, Groupe d'Entraide Mutuelle à Montpellier depuis 2006 : rompre les solitudes, créer des liens.",
  alternates: { canonical: "./" },
  openGraph: { siteName: "GEM Janus34", locale: "fr_FR", type: "website", url: "./", images: "/icon.png" },
};

const organization = {
  "@context": "https://schema.org",
  "@type": "NGO",
  name: "GEM Janus34",
  alternateName: "Janus34",
  description: "Groupe d'Entraide Mutuelle à Montpellier, fondé en 2006.",
  url: `${siteUrl}/`,
  logo: `${siteUrl}/icon.png`,
  foundingDate: "2006",
  telephone: contact.phoneHref.replace("tel:", ""),
  address: {
    "@type": "PostalAddress",
    streetAddress: contact.street,
    postalCode: contact.city.split(" ")[0],
    addressLocality: contact.city.split(" ").slice(1).join(" "),
    addressCountry: "FR",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [settings, extraPages] = await Promise.all([getSiteSettings(), getExtraPages()]);
  return (
    <html lang="fr" className={`${body.variable} ${display.variable}`}>
      <body>
        <ThemeStyle theme={settings.theme} />
        <a className="skip-link" href="#contenu">Aller au contenu</a>
        <SiteHeader extraPages={extraPages} galleryEnabled={settings.galleryEnabled} />
        <main id="contenu">{children}</main>
        <SiteFooter extraPages={extraPages} membershipHref={membershipHref(settings)} galleryEnabled={settings.galleryEnabled} conferencesEnabled={settings.conferencesEnabled} />
        <AnalyticsBeacon token={process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN} />
        <SiteEventTracker />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      </body>
    </html>
  );
}
