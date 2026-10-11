import { ArrowRight, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

export function VisitPanel(): JSX.Element {
  return (
    <section className="visit-band" aria-labelledby="visit-title">
      <div className="content-container visit-band__inner">
        <div className="visit-band__heading">
          <p className="eyebrow">Venir à Janus34</p>
          <h2 id="visit-title">Faisons connaissance</h2>
        </div>
        <address className="visit-band__details">
          <span>
            <MapPin aria-hidden="true" size={24} />
            405 rue des Grèzes, Montpellier
          </span>
          <a href="tel:+33467048768">
            <Phone aria-hidden="true" size={24} />
            04 67 04 87 68
          </a>
        </address>
        <Link className="button button--light" href="/nous-rejoindre">
          Préparer ma visite
          <ArrowRight aria-hidden="true" size={20} />
        </Link>
      </div>
    </section>
  );
}
