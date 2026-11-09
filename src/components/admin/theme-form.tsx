"use client";

import { RotateCcw, Save } from "lucide-react";
import { useActionState, useState, type CSSProperties, type JSX } from "react";
import { resetTheme, saveTheme, type SettingsActionState } from "@/app/admin/reglages/actions";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";
import { defaultTheme, themeLabels, validateTheme, type Theme } from "@/lib/settings/theme";

const initialState: SettingsActionState = {};

function Status({ state }: { state: SettingsActionState }): JSX.Element | null {
  if (state.formError) return <p className="form-status form-status--error" role="alert">{state.formError}</p>;
  if (state.success) return <p className="form-status form-status--success" role="status">{state.success}</p>;
  return null;
}

export function ThemeForm({ theme, custom }: { theme: Theme; custom: boolean }): JSX.Element {
  const [colours, setColours] = useState<Theme>(theme);
  const [saved, save, saving] = useActionState(saveTheme, initialState);
  const [reset, restore, restoring] = useActionState(resetTheme, initialState);
  const check = validateTheme(colours);
  const preview = Object.fromEntries(Object.entries(colours).map(([name, value]) => [`--${name}`, value])) as CSSProperties;

  return (
    <div className="theme-settings">
      <form className="account-form" onSubmit={submitWithoutReset(save)}>
        <div className="theme-settings__colours">
          {(Object.keys(themeLabels) as Array<keyof Theme>).map((name) => (
            <label className="admin-field" key={name}>
              <span>{themeLabels[name]}</span>
              <input
                type="color"
                name={name}
                value={colours[name]}
                onChange={(event) => setColours({ ...colours, [name]: event.target.value })}
              />
            </label>
          ))}
        </div>

        <div className="theme-preview" data-testid="theme-preview" style={preview} aria-label="Aperçu des couleurs">
          <p className="theme-preview__band">Janus34 : rompre les solitudes, créer des liens</p>
          <p>Un paragraphe de texte courant, tel qu’il apparaîtra sur le site.</p>
          <p className="theme-preview__note">Un encadré repère, comme les informations pratiques.</p>
          <span className="button button--primary">Bouton d’action</span>
        </div>

        {check.ok ? null : <p className="form-status form-status--error" role="alert">{check.problems.join(" ")}</p>}
        <div className="admin-form-actions">
          <button className="button button--dark" type="submit" disabled={saving || !check.ok}>
            <Save aria-hidden="true" size={18} />
            Enregistrer les couleurs
          </button>
        </div>
        <Status state={saved} />
      </form>

      {custom ? (
        <form action={restore} onSubmit={() => setColours(defaultTheme)}>
          <button className="button button--light admin-button--outlined" type="submit" disabled={restoring}>
            <RotateCcw aria-hidden="true" size={18} />
            Revenir aux couleurs d’origine
          </button>
          <Status state={reset} />
        </form>
      ) : null}
    </div>
  );
}
