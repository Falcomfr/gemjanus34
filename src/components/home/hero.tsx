import { ArrowRight, CalendarDays } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { JSX } from "react";

type HeroProps = {
  planningHref: string;
};

export function Hero({ planningHref }: HeroProps): JSX.Element {
  return (
    <section className="home-hero" aria-labelledby="home-title">
      <div className="content-container home-hero__inner">
        <Image
          className="home-hero__logo"
          src="/images/janus34-logo.png"
          alt="Logo de l'association Janus34"
          width={200}
          height={200}
          priority
        />
        <div className="home-hero__content">
          <p className="eyebrow">Groupe d&apos;Entraide Mutuelle à Montpellier</p>
          <h1 id="home-title">Janus34</h1>
          <p className="home-hero__copy">
            Un lieu d&apos;accueil, de partage et d&apos;activités pour créer du lien à son rythme.
          </p>
          <div className="home-hero__actions">
            <Link className="button button--primary" href="/nous-rejoindre">
              Nous rejoindre
              <ArrowRight aria-hidden="true" size={20} />
            </Link>
            <Link className="button button--secondary" href={planningHref}>
              <CalendarDays aria-hidden="true" size={20} />
              Voir le planning
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
