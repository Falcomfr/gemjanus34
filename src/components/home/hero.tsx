import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { JSX } from "react";

export function Hero(): JSX.Element {
  return (
    <section className="home-hero" aria-labelledby="home-title">
      <div className="content-container home-hero__inner">
        <div className="home-hero__content">
          <p className="home-hero__label">
            <span>Janus34</span> Groupe d&apos;Entraide Mutuelle · Montpellier
          </p>
          <h1 id="home-title">
            Rompre les solitudes, <span className="home-hero__highlight">créer des liens</span>
          </h1>
          <p className="home-hero__copy">
            Depuis 2006, Janus34 est un lieu convivial porté par ses adhérents, où les personnes
            concernées par des troubles psychiques peuvent se retrouver, s&apos;entraider et
            participer à des activités.
          </p>
          <div className="home-hero__actions">
            <Link className="button button--sun" href="/qui-sommes-nous">
              Découvrir Janus34
              <ArrowRight aria-hidden="true" size={20} />
            </Link>
            <Link className="button button--secondary" href="/nous-rejoindre">
              Préparer une première visite
            </Link>
          </div>
        </div>
        <div className="home-hero__visual">
          <Image
            className="home-hero__painting"
            src="/images/peinture-gem.jpg"
            alt="Peinture aux couleurs vives : un visage aux yeux clos, des oiseaux et des formes rouges, bleues et jaunes"
            width={1280}
            height={960}
            sizes="(min-width: 48rem) 34rem, 100vw"
            priority
          />
          <div className="home-hero__stamp">
            <Image src="/images/janus34-logo.png" alt="Logo de l'association Janus34" width={512} height={512} />
          </div>
        </div>
      </div>
    </section>
  );
}
