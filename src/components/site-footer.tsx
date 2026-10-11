import { MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

export function SiteFooter(): JSX.Element {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__title">Janus34</p>
          <p>Groupe d&apos;Entraide Mutuelle à Montpellier.</p>
        </div>

        <address className="site-footer__contact">
          <span>
            <MapPin aria-hidden="true" size={20} />
            405 rue des Grèzes, Montpellier
          </span>
          <a href="tel:+33467048768">
            <Phone aria-hidden="true" size={20} />
            04 67 04 87 68
          </a>
        </address>

        <nav className="site-footer__links" aria-label="Informations légales">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/admin">Administration</Link>
        </nav>
      </div>
    </footer>
  );
}
