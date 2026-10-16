import { Bus, Clock, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { JSX } from "react";
import { contact } from "@/content/contact";
import { publicNavigation } from "@/content/navigation";

const partners = [
  { src: "/images/partenaires/ars-occitanie.png", alt: "Agence Régionale de Santé Occitanie", width: 231, height: 133 },
  { src: "/images/partenaires/region-occitanie.png", alt: "Région Occitanie", width: 189, height: 189 },
  { src: "/images/partenaires/fnapsy.png", alt: "FNAPSY, les usagers en santé mentale", width: 237, height: 236 },
] as const;

export function SiteFooter(): JSX.Element {
  return (
    <footer className="site-footer">
      <section className="partners" aria-labelledby="partners-title">
        <div className="content-container partners__inner">
          <h2 id="partners-title">Nos partenaires</h2>
          <ul>
            {partners.map((partner) => (
              <li key={partner.src}>
                <Image src={partner.src} alt={partner.alt} width={partner.width} height={partner.height} />
              </li>
            ))}
          </ul>
        </div>
      </section>
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
