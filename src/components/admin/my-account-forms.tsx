"use client";

import { KeyRound, Save } from "lucide-react";
import { useActionState, useEffect, useRef, type JSX } from "react";
import { changeMyPassword, updateMyName, type MyAccountState } from "@/app/admin/mon-compte/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/admin/account-input";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";

const initialState: MyAccountState = {};

function Status({ state }: { state: MyAccountState }): JSX.Element | null {
  if (state.formError) return <p className="form-status form-status--error" role="alert">{state.formError}</p>;
  if (state.success) return <p className="form-status form-status--success" role="status">{state.success}</p>;
  return null;
}

export function MyNameForm({ displayName }: { displayName: string }): JSX.Element {
  const [state, action, pending] = useActionState(updateMyName, initialState);
  return (
    <form className="account-form" onSubmit={submitWithoutReset(action)}>
      <label className="admin-field">
        <span>Nom affiché</span>
        <input name="displayName" required minLength={2} maxLength={100} defaultValue={displayName} />
        {state.fieldErrors?.displayName ? <small>{state.fieldErrors.displayName.join(" ")}</small> : null}
      </label>
      <div className="admin-form-actions">
        <button className="button button--dark" type="submit" disabled={pending}>
          <Save aria-hidden="true" size={18} />
          Enregistrer
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}

export function MyPasswordForm(): JSX.Element {
  const [state, action, pending] = useActionState(changeMyPassword, initialState);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) form.current?.reset();
  }, [state]);
  const error = (field: string) => (state.fieldErrors?.[field] ? <small>{state.fieldErrors[field]!.join(" ")}</small> : null);

  return (
    <form className="account-form" ref={form} onSubmit={submitWithoutReset(action)}>
      <div className="admin-form-grid">
        <label className="admin-field admin-field--wide">
          <span>Mot de passe actuel</span>
          <input name="currentPassword" type="password" required autoComplete="current-password" />
          {error("currentPassword")}
        </label>
        <label className="admin-field">
          <span>Nouveau mot de passe</span>
          <input name="newPassword" type="password" required minLength={MIN_PASSWORD_LENGTH} maxLength={72} autoComplete="new-password" />
          {error("newPassword")}
        </label>
        <label className="admin-field">
          <span>Confirmer le nouveau mot de passe</span>
          <input name="confirmPassword" type="password" required autoComplete="new-password" />
          {error("confirmPassword")}
        </label>
      </div>
      <p className="admin-field__hint">Au moins {MIN_PASSWORD_LENGTH} caractères. Une phrase courte et facile à retenir convient très bien.</p>
      <div className="admin-form-actions">
        <button className="button button--dark" type="submit" disabled={pending}>
          <KeyRound aria-hidden="true" size={18} />
          Changer le mot de passe
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}
