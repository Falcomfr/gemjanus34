import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";
import { contact } from "@/content/contact";

export default function NotFound() {
  return (
    <article className="content-page">
      <header className="content-page__header">
        <div className="content-container content-page__header-inner">
          <div>
            <p className="eyebrow">Erreur 404</p>
            <h1>Page introuvable</h1>
            <p>Cette page n’existe pas ou a été déplacée. Les informations du GEM restent à portée de clic.</p>
          </div>
        </div>
      </header>
      <div className="content-container content-page__body not-found__actions">
        <Link className="button button--dark" href="/">
          Retour à l’accueil
          <ArrowRight aria-hidden="true" size={20} />
        </Link>
        <a className="button button--light admin-button--outlined" href={contact.phoneHref}>
          <Phone aria-hidden="true" size={20} />
          {contact.phone}
        </a>
      </div>
    </article>
  );
}
