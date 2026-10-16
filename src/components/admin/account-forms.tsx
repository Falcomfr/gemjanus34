"use client";

import { Copy, KeyRound, Save, Trash2, UserPlus } from "lucide-react";
import { useActionState, useState, type FormEvent, type JSX, type ReactNode } from "react";
import {
  createAccount,
  deleteAccount,
  resetAccountPassword,
  updateAccount,
  type AccountActionState,
} from "@/app/admin/comptes/actions";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";

const initialState: AccountActionState = {};

function Status({ state }: { state: AccountActionState }): JSX.Element | null {
  const [copied, setCopied] = useState(false);
  if (state.formError) return <p className="form-status form-status--error" role="alert">{state.formError}</p>;
  if (!state.success) return null;
  return (
    <div className="form-status form-status--success" role="status">
      <p>{state.success}</p>
      {state.temporaryPassword ? (
        <p className="account-password">
          <code>{state.temporaryPassword}</code>
          <button
            className="button button--light admin-button--outlined"
            type="button"
            onClick={() => navigator.clipboard?.writeText(state.temporaryPassword!).then(() => setCopied(true))}
          >
            <Copy aria-hidden="true" size={16} />
            {copied ? "Copié" : "Copier"}
          </button>
          <small>Il ne sera plus affiché. La personne pourra le changer dans « Mon compte ».</small>
        </p>
      ) : null}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string[]; children: ReactNode }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
      {error ? <small>{error.join(" ")}</small> : null}
    </label>
  );
}

function RoleSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select name="role" defaultValue={defaultValue}>
      <option value="editor">Éditeur (contenus)</option>
      <option value="admin">Administrateur (tout, dont les comptes)</option>
    </select>
  );
}

export function CreateAccountForm(): JSX.Element {
  const [state, action, pending] = useActionState(createAccount, initialState);
  return (
    <form className="account-form" onSubmit={submitWithoutReset(action)}>
      <div className="admin-form-grid">
        <Field label="Adresse e-mail" error={state.fieldErrors?.email}>
          <input name="email" type="email" required autoComplete="off" />
        </Field>
        <Field label="Nom affiché" error={state.fieldErrors?.displayName}>
          <input name="displayName" required minLength={2} maxLength={100} />
        </Field>
        <Field label="Rôle" error={state.fieldErrors?.role}>
          <RoleSelect defaultValue="editor" />
        </Field>
        <input type="hidden" name="active" value="on" />
      </div>
      <div className="admin-form-actions">
        <button className="button button--dark" type="submit" disabled={pending}>
          <UserPlus aria-hidden="true" size={18} />
          {pending ? "Création…" : "Créer le compte"}
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}

type Account = { id: string; email: string; displayName: string; role: string; active: boolean; lastSignInAt: string | null };

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });

export function AccountRow({ account, isMe }: { account: Account; isMe: boolean }): JSX.Element {
  const [state, action, pending] = useActionState(
    async (previous: AccountActionState, formData: FormData) => {
      const intent = formData.get("intent");
      if (intent === "reset") return resetAccountPassword(previous, formData);
      if (intent === "delete") return deleteAccount(previous, formData);
      return updateAccount(previous, formData);
    },
    initialState,
  );
  const submit = submitWithoutReset(action);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const intent = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value;
    const question =
      intent === "reset"
        ? `Générer un nouveau mot de passe pour ${account.displayName} ? L’ancien ne fonctionnera plus.`
        : intent === "delete"
          ? `Supprimer définitivement le compte de ${account.displayName} ?`
          : null;
    if (question && !window.confirm(question)) {
      event.preventDefault();
      return;
    }
    submit(event);
  };

  return (
    <article className={`account-row${account.active ? "" : " account-row--inactive"}`} aria-labelledby={`account-${account.id}`}>
      <header>
        <h3 id={`account-${account.id}`}>{account.displayName}</h3>
        <p>
          {account.email}
          {isMe ? <span className="status-badge status-badge--published">Vous</span> : null}
          {account.active ? null : <span className="status-badge status-badge--archived">Désactivé</span>}
        </p>
        <p className="account-row__last">
          {account.lastSignInAt ? `Dernière connexion : ${dateFormat.format(new Date(account.lastSignInAt))}` : "Jamais connecté"}
        </p>
      </header>
      <form className="account-row__form" onSubmit={onSubmit}>
        <input type="hidden" name="userId" value={account.id} />
        <input type="hidden" name="email" value={account.email} />
        <Field label="Nom affiché" error={state.fieldErrors?.displayName}>
          <input name="displayName" required minLength={2} maxLength={100} defaultValue={account.displayName} />
        </Field>
        <Field label="Rôle">
          <RoleSelect defaultValue={account.role} />
        </Field>
        <label className="admin-checkbox">
          <input type="checkbox" name="active" defaultChecked={account.active} />
          <span>Compte actif</span>
        </label>
        <div className="account-row__actions">
          <button className="button button--dark" type="submit" name="intent" value="save" disabled={pending}>
            <Save aria-hidden="true" size={18} />
            Enregistrer
          </button>
          <button className="button button--light admin-button--outlined" type="submit" name="intent" value="reset" disabled={pending}>
            <KeyRound aria-hidden="true" size={18} />
            Réinitialiser le mot de passe
          </button>
          {isMe ? null : (
            <button className="button admin-button--quiet" type="submit" name="intent" value="delete" disabled={pending}>
              <Trash2 aria-hidden="true" size={18} />
              Supprimer
            </button>
          )}
        </div>
        <Status state={state} />
      </form>
    </article>
  );
}
