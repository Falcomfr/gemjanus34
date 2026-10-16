"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, type FormEvent, type JSX, type ReactNode } from "react";
import {
  deletePlanningSlot,
  savePlanningDay,
  savePlanningSettings,
  savePlanningSlot,
  type PlanningActionState,
} from "@/app/admin/planning/actions";
import { familyLabels } from "@/components/planning/planning-format";
import type { PlanningDay, PlanningFamily, PlanningSlot } from "@/content/types";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";

const initialState: PlanningActionState = {};

function Status({ state }: { state: PlanningActionState }): JSX.Element | null {
  if (state.formError) return <p className="form-status form-status--error" role="alert">{state.formError}</p>;
  if (state.success) return <p className="form-status form-status--success" role="status">{state.success}</p>;
  return null;
}

function Field({ label, error, wide = false, children }: { label: string; error?: string[]; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`admin-field${wide ? " admin-field--wide" : ""}`}>
      <span>{label}</span>
      {children}
      {error ? <small>{error.join(" ")}</small> : null}
    </label>
  );
}

export function PlanningSettingsForm({ effectiveFrom, note }: { effectiveFrom: string; note: string }): JSX.Element {
  const [state, action, pending] = useActionState(savePlanningSettings, initialState);
  return (
    <form className="planning-admin__form" onSubmit={submitWithoutReset(action)}>
      <Status state={state} />
      <div className="admin-form-grid">
        <Field label="En vigueur à partir du" error={state.fieldErrors?.effectiveFrom}>
          <input name="effectiveFrom" type="date" required defaultValue={effectiveFrom} />
        </Field>
        <Field label="Note affichée sous le titre" error={state.fieldErrors?.note}>
          <input name="note" maxLength={300} defaultValue={note} />
        </Field>
      </div>
      <div className="admin-form-actions">
        <button className="button button--dark" type="submit" disabled={pending}>
          <Save aria-hidden="true" size={18} />
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

export function PlanningDayForm({ day }: { day: PlanningDay }): JSX.Element {
  const [state, action, pending] = useActionState(savePlanningDay, initialState);
  return (
    <form className="planning-admin__day-form" onSubmit={submitWithoutReset(action)}>
      <input type="hidden" name="day" value={day.day} />
      <Field label="Ouverture" error={state.fieldErrors?.opensAt}>
        <input name="opensAt" type="time" defaultValue={day.opensAt ?? ""} />
      </Field>
      <Field label="Fermeture" error={state.fieldErrors?.closesAt}>
        <input name="closesAt" type="time" defaultValue={day.closesAt ?? ""} />
      </Field>
      <Field label="Équipe présente" error={state.fieldErrors?.team}>
        <input name="team" maxLength={120} defaultValue={day.team} />
      </Field>
      <button className="button button--light admin-button--outlined" type="submit" disabled={pending}>
        <Save aria-hidden="true" size={18} />
        Enregistrer
      </button>
      <Status state={state} />
    </form>
  );
}

export function PlanningSlotForm({ day, slot }: { day: number; slot?: PlanningSlot }): JSX.Element {
  const [state, action, pending] = useActionState(
    async (previous: PlanningActionState, formData: FormData) =>
      formData.get("intent") === "delete" ? deletePlanningSlot(previous, formData) : savePlanningSlot(previous, formData),
    initialState,
  );
  const errors = state.fieldErrors ?? {};
  const form = useRef<HTMLFormElement>(null);
  const submit = submitWithoutReset(action);

  // The add form empties after a success so the same slot is not added twice.
  useEffect(() => {
    if (!slot && state.success) form.current?.reset();
  }, [slot, state]);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.value === "delete" && !window.confirm(`Supprimer « ${slot?.title} » du planning ?`)) {
      event.preventDefault();
      return;
    }
    submit(event);
  };

  return (
    <form className={`planning-admin__slot planning-slot--${slot?.family ?? "creer"}`} ref={form} onSubmit={onSubmit}>
      {slot ? <input type="hidden" name="id" value={slot.id} /> : null}
      <input type="hidden" name="day" value={day} />
      <Field label="Début" error={errors.startsAt}>
        <input name="startsAt" type="time" required defaultValue={slot?.startsAt ?? ""} />
      </Field>
      <Field label="Fin" error={errors.endsAt}>
        <input name="endsAt" type="time" required defaultValue={slot?.endsAt ?? ""} />
      </Field>
      <Field label="Activité" error={errors.title} wide>
        <input name="title" required maxLength={120} defaultValue={slot?.title ?? ""} />
      </Field>
      <Field label="Animé par" error={errors.leader}>
        <input name="leader" maxLength={120} defaultValue={slot?.leader ?? ""} />
      </Field>
      <Field label="Famille" error={errors.family}>
        <select name="family" defaultValue={slot?.family ?? "creer"}>
          {(Object.keys(familyLabels) as PlanningFamily[]).map((family) => (
            <option key={family} value={family}>{familyLabels[family]}</option>
          ))}
        </select>
      </Field>
      <Field label="Précision (facultatif)" error={errors.note} wide>
        <input name="note" maxLength={300} defaultValue={slot?.note ?? ""} placeholder="Sur inscription, une fois par mois…" />
      </Field>
      <div className="planning-admin__slot-actions">
        <button className="button button--dark" type="submit" name="intent" value="save" disabled={pending}>
          {slot ? <Save aria-hidden="true" size={18} /> : <Plus aria-hidden="true" size={18} />}
          {slot ? "Enregistrer" : "Ajouter le créneau"}
        </button>
        {slot ? (
          <button className="button admin-button--quiet" type="submit" name="intent" value="delete" disabled={pending} aria-label={`Supprimer ${slot.title}`}>
            <Trash2 aria-hidden="true" size={18} />
            Supprimer
          </button>
        ) : null}
      </div>
      <Status state={state} />
    </form>
  );
}
