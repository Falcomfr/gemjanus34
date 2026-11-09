"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, type JSX } from "react";
import { createConference, deleteConference, deleteRegistration, type ConferenceActionState } from "@/app/admin/conferences/actions";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";

const initialState: ConferenceActionState = {};

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  return messages ? <small id={id}>{messages.join(" ")}</small> : null;
}

export function ConferenceForm(): JSX.Element {
  const [state, action, pending] = useActionState(createConference, initialState);
  const form = useRef<HTMLFormElement>(null);
  const errors = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.success) form.current?.reset();
  }, [state]);

  return (
    <form className="admin-page-form" ref={form} onSubmit={submitWithoutReset(action)}>
      {state.formError ? <p className="form-status form-status--error" role="alert">{state.formError}</p> : null}
      {state.success ? <p className="form-status form-status--success" role="status">{state.success}</p> : null}
      <div className="admin-form-grid">
        <label className="admin-field admin-field--wide">
          Titre
          <input name="title" required maxLength={160} aria-invalid={Boolean(errors.title)} aria-describedby="conference-title-error" />
          <FieldError id="conference-title-error" messages={errors.title} />
        </label>
        <label className="admin-field">
          Intervenant (facultatif)
          <input name="speaker" maxLength={120} />
        </label>
        <label className="admin-field">
          Date et heure
          <input name="startsAt" type="datetime-local" required aria-invalid={Boolean(errors.startsAt)} aria-describedby="conference-date-error" />
          <FieldError id="conference-date-error" messages={errors.startsAt} />
        </label>
        <label className="admin-field">
          Lieu (vide : au GEM)
          <input name="place" maxLength={160} />
        </label>
        <label className="admin-field">
          Nombre de places (vide : sans limite)
          <input name="capacity" inputMode="numeric" pattern="[0-9]*" aria-invalid={Boolean(errors.capacity)} aria-describedby="conference-capacity-error" />
          <FieldError id="conference-capacity-error" messages={errors.capacity} />
        </label>
        <label className="admin-field admin-field--wide">
          Description (facultative)
          <textarea name="description" rows={3} maxLength={2000} />
        </label>
      </div>
      <div className="admin-form-actions">
        <button className="button button--dark" type="submit" disabled={pending}>
          <Plus aria-hidden="true" size={18} />
          Ajouter au programme
        </button>
      </div>
    </form>
  );
}

function DeleteButton({ kind, id, label, confirm }: { kind: "conference" | "registration"; id: string; label: string; confirm: string }): JSX.Element {
  const [state, action, pending] = useActionState(kind === "conference" ? deleteConference : deleteRegistration, initialState);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirm)) event.preventDefault();
      }}
    >
      <input type="hidden" name={kind === "conference" ? "conferenceId" : "registrationId"} value={id} />
      <button className="admin-icon-button" type="submit" disabled={pending} aria-label={label} title={label}>
        <Trash2 aria-hidden="true" size={18} />
      </button>
      {state.formError ? <span className="admin-field-error" role="alert">{state.formError}</span> : null}
    </form>
  );
}

export function DeleteConferenceButton({ id, title }: { id: string; title: string }): JSX.Element {
  return <DeleteButton kind="conference" id={id} label={`Supprimer ${title}`} confirm={`Supprimer « ${title} » et toutes ses inscriptions ?`} />;
}

export function DeleteRegistrationButton({ id, name }: { id: string; name: string }): JSX.Element {
  return <DeleteButton kind="registration" id={id} label={`Retirer ${name}`} confirm={`Retirer l’inscription de ${name} ?`} />;
}
