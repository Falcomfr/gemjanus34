"use client";

import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="admin-login" id="admin-contenu">
      <div className="admin-login__panel">
        <p className="eyebrow eyebrow--dark">Espace réservé</p>
        <h1>Connexion à l’administration</h1>
        <p>Utilisez votre compte personnel Janus34.</p>

        <form className="admin-login__form" action={formAction}>
          <div className="field">
            <label htmlFor="email">Adresse e-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state.error ? (
            <p className="admin-login__error" role="alert">
              {state.error}
            </p>
          ) : null}
          <button className="button button--dark" type="submit" disabled={pending}>
            <LogIn aria-hidden="true" size={20} />
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
