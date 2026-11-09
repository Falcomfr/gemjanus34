"use client";

import { Save } from "lucide-react";
import { useActionState, type JSX } from "react";
import { saveLetterNote, type LetterActionState } from "@/app/admin/lettre/actions";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";

const initialState: LetterActionState = {};

export function LetterForm({ note }: { note: string }): JSX.Element {
  const [state, action, pending] = useActionState(saveLetterNote, initialState);
  return (
    <form className="account-form" onSubmit={submitWithoutReset(action)}>
      <label className="admin-field admin-field--wide">
        <span>Mot de l’équipe (facultatif, 1 500 caractères au plus)</span>
        <textarea name="note" rows={6} maxLength={1500} defaultValue={note} />
      </label>
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
