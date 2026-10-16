"use client";

import type { JSX } from "react";
import { contact } from "@/content/contact";

export function ContactForm(): JSX.Element {
  return (
    <form className="contact-form" noValidate onSubmit={(event) => event.preventDefault()}>
      <div className="contact-form__grid">
        <div className="field">
          <label htmlFor="contact-name">Nom</label>
          <input id="contact-name" name="name" type="text" autoComplete="name" required />
        </div>
        <div className="field">
          <label htmlFor="contact-email">Adresse e-mail</label>
          <input id="contact-email" name="email" type="email" autoComplete="email" required />
        </div>
      </div>

      <div className="field">
        <label htmlFor="contact-subject">Objet</label>
        <input id="contact-subject" name="subject" type="text" required />
      </div>

      <div className="field">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          rows={7}
          minLength={20}
          maxLength={5000}
          aria-describedby="contact-message-hint"
          required
        />
        <p className="field__hint" id="contact-message-hint">
          20 à 5 000 caractères.
        </p>
      </div>

      <div className="contact-form__honeypot" aria-hidden="true">
        <label htmlFor="contact-company">Entreprise</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          autoComplete="off"
          tabIndex={-1}
        />
      </div>

      <label className="consent-field" htmlFor="contact-consent">
        <input id="contact-consent" name="consent" type="checkbox" required />
        <span>
          J&apos;accepte que Janus34 utilise ces informations pour répondre à ma demande.
        </span>
      </label>

      <div className="contact-form__submit">
        <button className="button button--primary" type="submit" disabled>
          Envoyer le message
        </button>
        <p>
          Le formulaire en ligne n&apos;est pas encore ouvert : aucun message ne peut être envoyé
          depuis cette page. Appelez-nous au <a href={contact.phoneHref}>{contact.phone}</a>.
        </p>
      </div>
    </form>
  );
}
