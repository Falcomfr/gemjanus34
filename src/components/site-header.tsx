import { Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { JSX } from "react";
import { contact } from "@/content/contact";
import type { ExtraPage } from "@/lib/content/extra-pages";
import { MobileNavigation } from "./mobile-navigation";
import { NavigationLinks } from "./navigation-links";
import { StickyHeader } from "./sticky-header";

export function SiteHeader({ extraPages = [] }: { extraPages?: ExtraPage[] }): JSX.Element {
  const menuPages = extraPages.filter((page) => page.parentId === null);
  return (
    <StickyHeader>
      <div className="site-header__inner">
        <Link className="wordmark" href="/" aria-label="Janus34, accueil">
          <Image src="/images/janus34-logo.png" alt="" width={44} height={44} />
          <span>Janus34</span>
        </Link>

        <nav className="desktop-navigation" aria-label="Navigation principale">
          <NavigationLinks extraPages={menuPages} />
        </nav>

        <MobileNavigation>
          <NavigationLinks extraPages={menuPages} />
          <a className="mobile-navigation__phone" href={contact.phoneHref}>
            <Phone aria-hidden="true" size={20} />
            Appeler le <span className="nowrap">{contact.phone}</span>
          </a>
        </MobileNavigation>
      </div>
    </StickyHeader>
  );
}
