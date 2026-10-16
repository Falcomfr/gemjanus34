"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, type JSX } from "react";
import { sendContactMessage, type ContactActionState } from "@/app/contact/actions";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";

const initialState: ContactActionState = {};

export function ContactForm(): JSX.Element {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialState);
  const form = useRef<HTMLFormElement>(null);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) form.current?.reset();
  }, [state]);

  const describedBy = (field: keyof typeof errors, hint?: string) =>
    [hint, errors[field] ? `contact-${field}-error` : null].filter(Boolean).join(" ") || undefined;
  const error = (field: keyof typeof errors) =>
    errors[field] ? (
      <p className="field__error" id={`contact-${field}-error`}>
        {errors[field]}
      </p>
    ) : null;

  return (
    <form className="contact-form" noValidate ref={form} onSubmit={submitWithoutReset(formAction)}>
      {state.success ? (
        <p className="form-status form-status--success" role="status">
          {state.success}
        </p>
      ) : null}
      {state.formError ? (
        <p className="form-status form-status--error" role="alert">
          {state.formError}
        </p>
      ) : null}

      <div className="contact-form__grid">
        <div className="field">
          <label htmlFor="contact-name">Nom</label>
          <input id="contact-name" name="name" type="text" autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={describedBy("name")} />
          {error("name")}
        </div>
        <div className="field">
          <label htmlFor="contact-email">Adresse e-mail</label>
          <input id="contact-email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(errors.email)} aria-describedby={describedBy("email")} />
          {error("email")}
        </div>
      </div>

      <div className="field">
        <label htmlFor="contact-subject">Objet</label>
        <input id="contact-subject" name="subject" type="text" required aria-invalid={Boolean(errors.subject)} aria-describedby={describedBy("subject")} />
        {error("subject")}
      </div>

      <div className="field">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          rows={7}
          minLength={20}
          maxLength={5000}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy("message", "contact-message-hint")}
          required
        />
        <p className="field__hint" id="contact-message-hint">
          20 à 5 000 caractères.
        </p>
        {error("message")}
      </div>

      <div className="contact-form__honeypot" aria-hidden="true">
        <label htmlFor="contact-hp">Ne pas remplir</label>
        <input id="contact-hp" name="website" type="text" autoComplete="new-password" tabIndex={-1} />
      </div>

      <div>
        <label className="consent-field" htmlFor="contact-consent">
          <input id="contact-consent" name="consent" type="checkbox" required aria-invalid={Boolean(errors.consent)} aria-describedby={describedBy("consent")} />
          <span>
            J&apos;accepte que Janus34 utilise ces informations pour répondre à ma demande. Elles ne
            sont lues que par l&apos;équipe (voir la <Link href="/confidentialite">politique de confidentialité</Link>).
          </span>
        </label>
        {error("consent")}
      </div>

      <div className="contact-form__submit">
        <button className="button button--primary" type="submit" disabled={pending}>
          {pending ? "Envoi en cours…" : "Envoyer le message"}
        </button>
      </div>
    </form>
  );
}
