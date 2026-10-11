import { Menu } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

type NavigationItem = {
  href: string;
  label: string;
  prominent?: boolean;
};

const navigation: ReadonlyArray<NavigationItem> = [
  { href: "/", label: "Accueil" },
  { href: "/qui-sommes-nous", label: "Qui sommes-nous ?" },
  { href: "/activites", label: "Activités" },
  { href: "/actualites", label: "Planning et actualités" },
  { href: "/nous-rejoindre", label: "Nous rejoindre", prominent: true },
  { href: "/ressources", label: "Ressources" },
  { href: "/contact", label: "Contact" },
];

function NavigationLinks(): JSX.Element {
  return (
    <ul className="navigation-list">
      {navigation.map((item) => (
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
          <span aria-hidden="true" className="wordmark__mark">J34</span>
          <span>Janus34</span>
        </Link>

        <nav className="desktop-navigation" aria-label="Navigation principale">
          <NavigationLinks />
        </nav>

        <details className="mobile-navigation">
          <summary aria-label="Ouvrir la navigation">
            <Menu aria-hidden="true" size={24} strokeWidth={2} />
            <span>Menu</span>
          </summary>
          <nav aria-label="Navigation mobile">
            <NavigationLinks />
          </nav>
        </details>
      </div>
    </header>
  );
}
