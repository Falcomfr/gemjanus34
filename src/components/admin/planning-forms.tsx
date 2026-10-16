"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, type FormEvent, type JSX, type ReactNode } from "react";
import {
  addPlanningException,
  deletePlanningException,
  deletePlanningSlot,
  savePlanningDay,
  savePlanningSettings,
  savePlanningSlot,
  type PlanningActionState,
} from "@/app/admin/planning/actions";
import { dayNames, familyLabels, formatHour, formatRange } from "@/components/planning/planning-format";
import type { PlanningDay, PlanningException, PlanningFamily, PlanningSlot } from "@/content/types";
import { fullDateLabel } from "@/lib/planning/week";
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

const monthWeekChoices: Array<[number, string]> = [[1, "1re"], [2, "2e"], [3, "3e"], [4, "4e"], [5, "5e"], [-1, "Dernière"]];

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
      <Field label="Récurrence" error={errors.recurrence}>
        <select name="recurrence" defaultValue={slot?.recurrence ?? "weekly"}>
          <option value="weekly">Chaque semaine</option>
          <option value="only">Seulement certaines semaines du mois</option>
          <option value="except">Toutes les semaines sauf…</option>
        </select>
      </Field>
      <fieldset className="planning-admin__weeks">
        <legend>Semaines du mois concernées (si ce n’est pas chaque semaine)</legend>
        {monthWeekChoices.map(([value, label]) => (
          <label key={value}>
            <input type="checkbox" name="monthWeeks" value={value} defaultChecked={slot?.monthWeeks.includes(value) ?? false} />
            {label}
          </label>
        ))}
        {errors.monthWeeks ? <small>{errors.monthWeeks.join(" ")}</small> : null}
      </fieldset>
      <Field label="Précision (facultatif)" error={errors.note} wide>
        <input name="note" maxLength={300} defaultValue={slot?.note ?? ""} placeholder="Sur inscription, une fois par mois…" />
      </Field>
      <Field label="Description (fenêtre d’information)" error={errors.description} wide>
        <textarea name="description" maxLength={600} rows={2} defaultValue={slot?.description ?? ""} />
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

const slotLabel = (slot: PlanningSlot) => `${dayNames[slot.day]} · ${formatHour(slot.startsAt)} · ${slot.title}`;

function describeException(exception: PlanningException, slots: PlanningSlot[]): { when: string; what: string; detail: string } {
  if (exception.kind === "closure") {
    const when = exception.endDate === exception.date
      ? fullDateLabel(exception.date)
      : `Du ${fullDateLabel(exception.date).replace(/^\S+ /, "")} au ${fullDateLabel(exception.endDate).replace(/^\S+ /, "")}`;
    return { when, what: "GEM fermé", detail: exception.reason };
  }
  if (exception.kind === "extra") {
    return {
      when: fullDateLabel(exception.date),
      what: `${exception.title} · ${formatRange(exception.startsAt, exception.endsAt)}`,
      detail: "Séance exceptionnelle",
    };
  }
  const slot = slots.find((candidate) => candidate.id === exception.slotId);
  return {
    when: fullDateLabel(exception.date),
    what: slot ? `${slot.title} · ${formatHour(slot.startsAt)}` : "Séance",
    detail: [exception.hidden ? "Annulée, masquée" : "Annulée, barrée", exception.reason].filter(Boolean).join(" · "),
  };
}

function ExceptionItem({ exception, slots }: { exception: PlanningException; slots: PlanningSlot[] }): JSX.Element {
  const [state, action, pending] = useActionState(deletePlanningException, initialState);
  const { when, what, detail } = describeException(exception, slots);
  const submit = submitWithoutReset(action);

  return (
    <li className={`planning-change planning-change--${exception.kind}`}>
      <div>
        <strong>{when}</strong>
        <span>{what}</span>
        {detail ? <small>{detail}</small> : null}
      </div>
      <form
        onSubmit={(event) => {
          if (!window.confirm(`Supprimer ce changement (${when}) ?`)) {
            event.preventDefault();
            return;
          }
          submit(event);
        }}
      >
        <input type="hidden" name="id" value={exception.id} />
        <button className="button admin-button--quiet" type="submit" disabled={pending} aria-label={`Supprimer : ${when}, ${what}`}>
          <Trash2 aria-hidden="true" size={18} />
          Supprimer
        </button>
      </form>
      <Status state={state} />
    </li>
  );
}

export function PlanningExceptionList({ exceptions, slots }: { exceptions: PlanningException[]; slots: PlanningSlot[] }): JSX.Element {
  if (exceptions.length === 0) return <p className="planning-changes__empty">Aucun changement prévu : le planning suit la semaine type.</p>;
  return (
    <ul className="planning-changes__list">
      {exceptions.map((exception) => <ExceptionItem key={exception.id} exception={exception} slots={slots} />)}
    </ul>
  );
}

function ExceptionForm({ kind, slots }: { kind: PlanningException["kind"]; slots: PlanningSlot[] }): JSX.Element {
  const [state, action, pending] = useActionState(addPlanningException, initialState);
  const errors = state.fieldErrors ?? {};
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) form.current?.reset();
  }, [state]);

  const reasonField = (
    <Field label="Motif (facultatif, affiché sur le site)" error={errors.reason} wide>
      <input name="reason" maxLength={200} placeholder={kind === "closure" ? "Toussaint, congés d’été…" : "Animatrice absente…"} />
    </Field>
  );

  return (
    <form className="planning-admin__form planning-changes__form" ref={form} onSubmit={submitWithoutReset(action)}>
      <input type="hidden" name="kind" value={kind} />
      <Status state={state} />
      <div className="admin-form-grid">
        {kind === "cancel" ? (
          <>
            <Field label="Séance" error={errors.slotId} wide>
              <select name="slotId" required defaultValue="">
                <option value="" disabled>Choisir la séance…</option>
                {slots.map((slot) => <option key={slot.id} value={slot.id}>{slotLabel(slot)}</option>)}
              </select>
            </Field>
            <Field label="Date" error={errors.date}>
              <input name="date" type="date" required />
            </Field>
            <fieldset className="planning-admin__display">
              <legend>Sur le site</legend>
              <label><input type="radio" name="display" value="struck" defaultChecked /> Barrée, avec « Annulé »</label>
              <label><input type="radio" name="display" value="hidden" /> Masquée</label>
            </fieldset>
            {reasonField}
          </>
        ) : kind === "closure" ? (
          <>
            <Field label="Du" error={errors.date}>
              <input name="date" type="date" required />
            </Field>
            <Field label="Au (facultatif, sinon un seul jour)" error={errors.endDate}>
              <input name="endDate" type="date" />
            </Field>
            {reasonField}
          </>
        ) : (
          <>
            <Field label="Date" error={errors.date}>
              <input name="date" type="date" required />
            </Field>
            <Field label="Début" error={errors.startsAt}>
              <input name="startsAt" type="time" required />
            </Field>
            <Field label="Fin" error={errors.endsAt}>
              <input name="endsAt" type="time" required />
            </Field>
            <Field label="Activité" error={errors.title} wide>
              <input name="title" required maxLength={120} />
            </Field>
            <Field label="Animé par" error={errors.leader}>
              <input name="leader" maxLength={120} />
            </Field>
            <Field label="Famille" error={errors.family}>
              <select name="family" defaultValue="creer">
                {(Object.keys(familyLabels) as PlanningFamily[]).map((family) => (
                  <option key={family} value={family}>{familyLabels[family]}</option>
                ))}
              </select>
            </Field>
            <Field label="Description (fenêtre d’information)" error={errors.description} wide>
              <textarea name="description" maxLength={600} rows={2} />
            </Field>
          </>
        )}
      </div>
      <div className="admin-form-actions">
        <button className="button button--dark" type="submit" disabled={pending}>
          <Plus aria-hidden="true" size={18} />
          {kind === "cancel" ? "Annuler la séance" : kind === "closure" ? "Enregistrer la fermeture" : "Ajouter la séance"}
        </button>
      </div>
    </form>
  );
}

export function PlanningExceptionForms({ slots }: { slots: PlanningSlot[] }): JSX.Element {
  return (
    <div className="planning-changes__forms">
      <details className="planning-admin__add">
        <summary>Annuler une séance</summary>
        <ExceptionForm kind="cancel" slots={slots} />
      </details>
      <details className="planning-admin__add">
        <summary>Fermer le GEM</summary>
        <ExceptionForm kind="closure" slots={slots} />
      </details>
      <details className="planning-admin__add">
        <summary>Ajouter une séance exceptionnelle</summary>
        <ExceptionForm kind="extra" slots={slots} />
      </details>
    </div>
  );
}
