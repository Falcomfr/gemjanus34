import { ArrowRight, CalendarDays, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";
import { contact } from "@/content/contact";

export function QuickAccess(): JSX.Element {
  return (
    <nav className="quick-access" aria-label="Accès rapides">
      <ul className="content-container quick-access__list">
        <li>
          <Link className="quick-access__item" href="/actualites#planning">
            <CalendarDays aria-hidden="true" size={28} />
            <strong>Le planning</strong>
            <span>Ateliers, sorties et temps collectifs de la semaine.</span>
            <em>
              Voir le planning <ArrowRight aria-hidden="true" size={16} />
            </em>
          </Link>
        </li>
        <li>
          <Link className="quick-access__item" href="/nous-rejoindre">
            <MapPin aria-hidden="true" size={28} />
            <strong>Venir au GEM</strong>
            <span>
              {contact.street}, Montpellier. {contact.transport}.
            </span>
            <em>
              Préparer ma visite <ArrowRight aria-hidden="true" size={16} />
            </em>
          </Link>
        </li>
        <li>
          <a className="quick-access__item" href={contact.phoneHref}>
            <Phone aria-hidden="true" size={28} />
            <strong>Nous appeler</strong>
            <span>L&apos;équipe répond l&apos;après-midi, à partir de 13 h.</span>
            <em>
              {contact.phone} <ArrowRight aria-hidden="true" size={16} />
            </em>
          </a>
        </li>
      </ul>
    </nav>
  );
}
