"use client";

import Link from "next/link";
import { useActionState, type JSX } from "react";
import { registerForConference, type RegistrationActionState } from "@/app/conferences/actions";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";

const initialState: RegistrationActionState = {};

export function RegistrationForm({ conferenceId, maxSeats }: { conferenceId: string; maxSeats: number }): JSX.Element {
  const [state, action, pending] = useActionState(registerForConference, initialState);
  const errors = state.fieldErrors ?? {};
  const field = (name: string) => `registration-${conferenceId}-${name}`;
  const error = (name: keyof typeof errors) =>
    errors[name] ? <p className="field__error" id={field(`${name}-error`)}>{errors[name]}</p> : null;

  if (state.success) return <p className="form-status form-status--success" role="status">{state.success}</p>;

  return (
    <form className="contact-form registration-form" noValidate onSubmit={submitWithoutReset(action)}>
      {state.formError ? <p className="form-status form-status--error" role="alert">{state.formError}</p> : null}
      <input type="hidden" name="conferenceId" value={conferenceId} />
      <div className="contact-form__grid">
        <div className="field">
          <label htmlFor={field("name")}>Votre prénom ou nom</label>
          <input id={field("name")} name="name" autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? field("name-error") : undefined} />
          {error("name")}
        </div>
        <div className="field">
          <label htmlFor={field("contact")}>Téléphone ou e-mail</label>
          <input id={field("contact")} name="contact" required aria-invalid={Boolean(errors.contact)} aria-describedby={errors.contact ? field("contact-error") : undefined} />
          {error("contact")}
        </div>
        <div className="field">
          <label htmlFor={field("seats")}>Nombre de places</label>
          <select id={field("seats")} name="seats" defaultValue="1" aria-invalid={Boolean(errors.seats)} aria-describedby={errors.seats ? field("seats-error") : undefined}>
            {Array.from({ length: Math.max(1, Math.min(4, maxSeats)) }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
          {error("seats")}
        </div>
      </div>
      <div className="contact-form__honeypot" aria-hidden="true">
        <label htmlFor={field("hp")}>Ne pas remplir</label>
        <input id={field("hp")} name="website" type="text" autoComplete="new-password" tabIndex={-1} />
      </div>
      <div>
        <label className="consent-field" htmlFor={field("consent")}>
          <input id={field("consent")} name="consent" type="checkbox" required aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? field("consent-error") : undefined} />
          <span>
            J&apos;accepte que l&apos;équipe de Janus34 garde mon inscription jusqu&apos;à la conférence (voir la{" "}
            <Link href="/confidentialite">politique de confidentialité</Link>).
          </span>
        </label>
        {error("consent")}
      </div>
      <div className="contact-form__submit">
        <button className="button button--primary" type="submit" disabled={pending}>
          {pending ? "Envoi en cours…" : "M’inscrire"}
        </button>
      </div>
    </form>
  );
}
