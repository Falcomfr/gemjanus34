import { Bus, Clock, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";
import { contact } from "@/content/contact";
import { publicNavigation } from "@/content/navigation";

export function SiteFooter(): JSX.Element {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__title">Janus34</p>
          <p>Groupe d&apos;Entraide Mutuelle à Montpellier, fondé en 2006.</p>
        </div>

        <address className="site-footer__contact">
          <a href={contact.phoneHref}>
            <Phone aria-hidden="true" size={20} />
            {contact.phone}
          </a>
          <span>
            <MapPin aria-hidden="true" size={20} />
            {contact.street}, {contact.city}
          </span>
          <span>
            <Bus aria-hidden="true" size={20} />
            {contact.transport}
          </span>
          <span>
            <Clock aria-hidden="true" size={20} />
            {contact.openingHours}
          </span>
        </address>

        <nav className="site-footer__links" aria-label="Plan du site">
          {publicNavigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className="site-footer__links" aria-label="Informations légales">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/admin">Administration</Link>
        </nav>
      </div>
    </footer>
  );
}
