import { MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter Janus34 et préparer une première visite.",
};

export default function ContactPage() {
  return (
    <>
      <header className="content-page__header">
        <div className="content-container content-page__header-inner">
          <p className="eyebrow eyebrow--light">Échanger avec l&apos;équipe</p>
          <h1>Contact</h1>
          <p>Avant une première visite, téléphonez à Janus34 pour convenir d&apos;un accueil.</p>
        </div>
      </header>

      <div className="content-container contact-layout">
        <section className="contact-details" aria-labelledby="contact-details-title">
          <p className="eyebrow">Informations pratiques</p>
          <h2 id="contact-details-title">Joindre Janus34</h2>
          <address>
            <a href="tel:+33467048768">
              <Phone aria-hidden="true" size={20} />
              04 67 04 87 68
            </a>
            <span>
              <MapPin aria-hidden="true" size={20} />
              405 rue des Grèzes, Montpellier
            </span>
          </address>
          <p>Ligne de bus 11, arrêt La Martelle.</p>
        </section>

        <section className="contact-form-section" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title">Écrire à l&apos;association</h2>
          <ContactForm />
        </section>
      </div>
    </>
  );
}
