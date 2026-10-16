import { ArrowRight, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";
import { contact } from "@/content/contact";

export function VisitPanel(): JSX.Element {
  return (
    <section className="visit-band" aria-labelledby="visit-title">
      <div className="content-container visit-band__inner">
        <div className="visit-band__heading">
          <p className="eyebrow">Faisons connaissance</p>
          <h2 id="visit-title">Envie de venir nous rencontrer ?</h2>
          <p>
            Appelez l&apos;équipe pour convenir d&apos;un premier accueil. Vous découvrirez le lieu et
            son fonctionnement, sans engagement.
          </p>
        </div>
        <address className="visit-band__details">
          <span>
            <MapPin aria-hidden="true" size={24} />
            {contact.street}, {contact.city}
          </span>
          <a href={contact.phoneHref}>
            <Phone aria-hidden="true" size={24} />
            {contact.phone}
          </a>
        </address>
        <div className="visit-band__actions">
          <Link className="button button--light" href="/nous-rejoindre">
            Préparer une première visite
            <ArrowRight aria-hidden="true" size={20} />
          </Link>
          <Link className="button button--outline-light" href="/contact">
            Écrire à l&apos;équipe
          </Link>
        </div>
      </div>
    </section>
  );
}
