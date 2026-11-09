"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, type JSX } from "react";
import { sendCallbackRequest, type CallbackActionState } from "@/app/contact/actions";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";

const initialState: CallbackActionState = {};

export function CallbackForm(): JSX.Element {
  const [state, formAction, pending] = useActionState(sendCallbackRequest, initialState);
  const form = useRef<HTMLFormElement>(null);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) form.current?.reset();
  }, [state]);

  const error = (field: keyof typeof errors) =>
    errors[field] ? (
      <p className="field__error" id={`callback-${field}-error`}>
        {errors[field]}
      </p>
    ) : null;
  const describedBy = (field: keyof typeof errors) => (errors[field] ? `callback-${field}-error` : undefined);

  return (
    <section className="callback" aria-labelledby="callback-title">
      <h2 id="callback-title">Rappelez-moi</h2>
      <p>Vous hésitez à appeler ? Laissez votre numéro, l’équipe vous rappelle.</p>
      <form className="contact-form" noValidate ref={form} onSubmit={submitWithoutReset(formAction)}>
        {state.success ? <p className="form-status form-status--success" role="status">{state.success}</p> : null}
        {state.formError ? <p className="form-status form-status--error" role="alert">{state.formError}</p> : null}

        <div className="contact-form__grid">
          <div className="field">
            <label htmlFor="callback-name">Votre prénom ou nom</label>
            <input id="callback-name" name="name" type="text" autoComplete="given-name" required aria-invalid={Boolean(errors.name)} aria-describedby={describedBy("name")} />
            {error("name")}
          </div>
          <div className="field">
            <label htmlFor="callback-phone">Votre téléphone</label>
            <input id="callback-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required aria-invalid={Boolean(errors.phone)} aria-describedby={describedBy("phone")} />
            {error("phone")}
          </div>
        </div>

        <div className="field">
          <label htmlFor="callback-time">Quand vous joindre ? (facultatif)</label>
          <input id="callback-time" name="preferredTime" type="text" maxLength={100} placeholder="Par exemple : mardi après-midi" aria-invalid={Boolean(errors.preferredTime)} aria-describedby={describedBy("preferredTime")} />
          {error("preferredTime")}
        </div>

        <div className="contact-form__honeypot" aria-hidden="true">
          <label htmlFor="callback-hp">Ne pas remplir</label>
          <input id="callback-hp" name="website" type="text" autoComplete="new-password" tabIndex={-1} />
        </div>

        <div>
          <label className="consent-field" htmlFor="callback-consent">
            <input id="callback-consent" name="consent" type="checkbox" required aria-invalid={Boolean(errors.consent)} aria-describedby={describedBy("consent")} />
            <span>
              J&apos;accepte que l&apos;équipe de Janus34 me rappelle à ce numéro (voir la{" "}
              <Link href="/confidentialite">politique de confidentialité</Link>).
            </span>
          </label>
          {error("consent")}
        </div>

        <div className="contact-form__submit">
          <button className="button button--primary" type="submit" disabled={pending}>
            {pending ? "Envoi en cours…" : "Être rappelé"}
          </button>
        </div>
      </form>
    </section>
  );
}
