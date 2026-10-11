import { Menu } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";
import { publicNavigation } from "@/content/navigation";

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
          <span aria-hidden="true" className="wordmark__mark">J34</span>
          <span>Janus34</span>
        </Link>

        <nav className="desktop-navigation" aria-label="Navigation principale">
          <NavigationLinks />
        </nav>

        <details className="mobile-navigation">
          <summary aria-label="Menu">
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
