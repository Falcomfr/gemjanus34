import { Bus, Clock, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { ClickToLoad } from "@/components/content/click-to-load";
import { contact } from "@/content/contact";
import { fr } from "@/lib/text/french";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter Janus34 et préparer une première visite.",
};

export default function ContactPage() {
  return (
    <>
      <header className="content-page__header">
        <div className="content-container content-page__header-inner">
          <p className="eyebrow">Échanger avec l&apos;équipe</p>
          <h1>Contact</h1>
          <p>
            Une première visite se prépare de préférence par téléphone : l&apos;équipe convient avec
            vous d&apos;un entretien d&apos;accueil.
          </p>
        </div>
      </header>

      <div className="content-container contact-layout">
        <section className="contact-details" aria-labelledby="contact-details-title">
          <p className="eyebrow eyebrow--dark">Informations pratiques</p>
          <h2 id="contact-details-title">Joindre Janus34</h2>
          <address>
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
          <p>
            L&apos;équipe répond l&apos;après-midi. Si personne ne décroche, laissez un message avec
            vos coordonnées : nous vous rappellerons.
          </p>
          <ClickToLoad
            variant="map"
            title="Janus34, 405 rue des Grèzes à Montpellier"
            src={contact.mapEmbedSrc}
            actionLabel="Afficher la carte"
            notice={fr("Carte fournie par Google Maps : l’afficher charge leur service.")}
            linkHref={contact.mapHref}
            linkLabel="Ouvrir dans Google Maps"
          />
        </section>

        <section className="contact-form-section" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title">Écrire à l&apos;association</h2>
          <ContactForm />
        </section>
      </div>
    </>
  );
}
