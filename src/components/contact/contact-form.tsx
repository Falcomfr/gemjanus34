import type { JSX } from "react";

export function ContactForm(): JSX.Element {
  return (
    <form className="contact-form" noValidate>
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
        <textarea id="contact-message" name="message" rows={7} required />
        <p className="field__hint">20 à 5 000 caractères.</p>
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
          L&apos;envoi sécurisé sera activé après la configuration de la messagerie. Pour le
          moment, contactez Janus34 par téléphone.
        </p>
      </div>
    </form>
  );
}
