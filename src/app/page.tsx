import Link from "next/link";

export default function HomePage() {
  return (
    <section className="home-introduction" aria-labelledby="home-title">
      <div className="content-container">
        <p className="eyebrow">Groupe d&apos;Entraide Mutuelle à Montpellier</p>
        <h1 id="home-title">Janus34</h1>
        <p className="home-introduction__copy">
          Un lieu d&apos;accueil, de partage et d&apos;activités pour créer du lien à son rythme.
        </p>
        <div className="home-introduction__actions">
          <Link className="button button--primary" href="/nous-rejoindre">Nous rejoindre</Link>
          <Link className="button button--secondary" href="/actualites">Voir le planning</Link>
        </div>
      </div>
    </section>
  );
}
