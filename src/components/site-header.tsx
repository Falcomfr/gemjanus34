import { Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { JSX } from "react";
import { contact } from "@/content/contact";
import { publicNavigation } from "@/content/navigation";
import { MobileNavigation } from "./mobile-navigation";

function NavigationLinks(): JSX.Element {
  return (
    <ul className="navigation-list">
      {publicNavigation.map((item) => (
        <li key={item.href}>
          <Link
            className={item.prominent ? "navigation-link navigation-link--prominent" : "navigation-link"}
            href={item.href}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteHeader(): JSX.Element {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="wordmark" href="/" aria-label="Janus34, accueil">
          <Image src="/images/janus34-logo.png" alt="" width={44} height={44} />
          <span>Janus34</span>
        </Link>

        <nav className="desktop-navigation" aria-label="Navigation principale">
          <NavigationLinks />
        </nav>

        <MobileNavigation>
          <NavigationLinks />
          <a className="mobile-navigation__phone" href={contact.phoneHref}>
            <Phone aria-hidden="true" size={20} />
            Appeler le {contact.phone}
          </a>
        </MobileNavigation>
      </div>
    </header>
  );
}
