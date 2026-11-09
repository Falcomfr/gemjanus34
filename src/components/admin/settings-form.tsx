"use client";

import { Save } from "lucide-react";
import { useActionState, type JSX } from "react";
import { saveSiteSettings, type SettingsActionState } from "@/app/admin/reglages/actions";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";
import type { SiteSettings } from "@/lib/settings/site-settings";

const initialState: SettingsActionState = {};

export function SettingsForm({ settings }: { settings: SiteSettings }): JSX.Element {
  const [state, action, pending] = useActionState(saveSiteSettings, initialState);

  return (
    <form className="account-form" onSubmit={submitWithoutReset(action)}>
      <fieldset className="admin-form-section">
        <legend>Première visite</legend>
        <label className="admin-checkbox">
          <input type="checkbox" name="callbackEnabled" defaultChecked={settings.callbackEnabled} />
          Afficher le formulaire « Rappelez-moi »
        </label>
      </fieldset>
      <fieldset className="admin-form-section">
        <legend>Galerie des créations</legend>
        <label className="admin-checkbox">
          <input type="checkbox" name="galleryEnabled" defaultChecked={settings.galleryEnabled} />
          Afficher la galerie sur le site
        </label>
      </fieldset>
      <fieldset className="admin-form-section">
        <legend>Adhésion et dons</legend>
        <label className="admin-checkbox">
          <input type="checkbox" name="membershipEnabled" defaultChecked={settings.membershipEnabled} />
          Afficher le bouton « Adhérer ou faire un don »
        </label>
        <label className="admin-field admin-field--wide">
          <span>Adresse de la page HelloAsso</span>
          <input
            name="helloassoUrl"
            type="url"
            inputMode="url"
            placeholder="https://www.helloasso.com/associations/..."
            defaultValue={settings.helloassoUrl ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.helloassoUrl)}
            aria-describedby={state.fieldErrors?.helloassoUrl ? "helloasso-error" : "helloasso-hint"}
          />
          <small id="helloasso-hint" className="admin-field__hint">Le bouton reste caché tant que cette adresse est vide.</small>
          {state.fieldErrors?.helloassoUrl ? <small id="helloasso-error" role="alert">{state.fieldErrors.helloassoUrl.join(" ")}</small> : null}
        </label>
      </fieldset>
      <div className="admin-form-actions">
        <button className="button button--dark" type="submit" disabled={pending}>
          <Save aria-hidden="true" size={18} />
          Enregistrer
        </button>
      </div>
      {state.formError ? <p className="form-status form-status--error" role="alert">{state.formError}</p> : null}
      {state.success ? <p className="form-status form-status--success" role="status">{state.success}</p> : null}
    </form>
  );
}
