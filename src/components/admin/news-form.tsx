"use client";

import { Temporal } from "@js-temporal/polyfill";
import type { JSONContent } from "@tiptap/react";
import { Archive, RotateCcw, Save, Send } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  archiveNews,
  createNews,
  publishNews,
  restoreNews,
  updateNews,
  type NewsActionState,
} from "@/app/admin/actualites/actions";
import type { Profile } from "@/lib/auth/require-profile";
import type { Database } from "@/lib/database.types";
import { RichTextEditor } from "./rich-text-editor";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";

type NewsRow = Pick<
  Database["public"]["Tables"]["news"]["Row"],
  "id" | "title" | "excerpt" | "content" | "starts_at" | "ends_at" | "featured" | "status"
>;

type NewsFormProps = {
  mode: "create" | "edit";
  profile: Profile;
  news?: NewsRow;
};

const initialState: NewsActionState = {};
const emptyContent: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

function localDateTime(instant: string | null | undefined): string {
  if (!instant) return "";
  return Temporal.Instant.from(instant)
    .toZonedDateTimeISO("Europe/Paris")
    .toPlainDateTime()
    .toString({ smallestUnit: "minute" });
}

function FieldErrors({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;
  return <div id={id}>{errors.map((error) => <small key={error}>{error}</small>)}</div>;
}

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button--dark" type="submit" disabled={pending}>
      <Save aria-hidden="true" size={18} />
      {pending ? "Enregistrement…" : label}
    </button>
  );
}

function LifecycleButton({ icon: Icon, label }: { icon: typeof Send; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button--light" type="submit" disabled={pending}>
      <Icon aria-hidden="true" size={18} />
      {pending ? "Traitement…" : label}
    </button>
  );
}

export function NewsForm({ mode, profile, news }: NewsFormProps) {
  const saveAction = mode === "create" ? createNews : updateNews;
  const [state, formAction] = useActionState(saveAction, initialState);
  const [publishState, publishAction] = useActionState(publishNews, initialState);
  const [archiveState, archiveAction] = useActionState(archiveNews, initialState);
  const [restoreState, restoreAction] = useActionState(restoreNews, initialState);
  const editable = mode === "create" || news?.status === "draft";
  const lifecycleError = publishState.formError ?? archiveState.formError ?? restoreState.formError;
  const lifecycleSuccess = publishState.success ?? archiveState.success ?? restoreState.success;

  return (
    <div className="admin-editor-layout">
      <form className="admin-page-form" onSubmit={submitWithoutReset(formAction)}>
        {news ? <input type="hidden" name="newsId" value={news.id} /> : null}
        {!editable ? (
          <p className="admin-notice">Archivez ou restaurez cette actualité avec les actions dédiées.</p>
        ) : null}
        {state.formError ? <p className="form-status form-status--error" role="alert">{state.formError}</p> : null}
        {state.success ? <p className="form-status form-status--success" role="status">{state.success}</p> : null}

        <section className="admin-form-section" aria-labelledby="news-information-title">
          <div className="admin-form-section__heading">
            <h2 id="news-information-title">Informations</h2>
            <p>Le titre et le résumé apparaissent sur le site public.</p>
          </div>
          <div className="admin-form-grid">
            <label className="admin-field admin-field--wide">
              <span>Titre</span>
              <input name="title" defaultValue={news?.title ?? ""} disabled={!editable} required maxLength={160} aria-invalid={Boolean(state.fieldErrors?.title)} aria-describedby={state.fieldErrors?.title ? "news-title-error" : undefined} />
              <FieldErrors id="news-title-error" errors={state.fieldErrors?.title} />
            </label>
            <label className="admin-field admin-field--wide">
              <span>Résumé</span>
              <textarea name="excerpt" defaultValue={news?.excerpt ?? ""} disabled={!editable} required maxLength={500} rows={3} aria-invalid={Boolean(state.fieldErrors?.excerpt)} aria-describedby={state.fieldErrors?.excerpt ? "news-excerpt-error" : undefined} />
              <FieldErrors id="news-excerpt-error" errors={state.fieldErrors?.excerpt} />
            </label>
          </div>
        </section>

        <section className="admin-form-section" aria-labelledby="news-dates-title">
          <div className="admin-form-section__heading"><h2 id="news-dates-title">Dates</h2></div>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Date et heure de début</span>
              <input type="datetime-local" name="startsAt" defaultValue={localDateTime(news?.starts_at)} disabled={!editable} required aria-invalid={Boolean(state.fieldErrors?.startsAt)} aria-describedby={state.fieldErrors?.startsAt ? "news-start-error" : undefined} />
              <FieldErrors id="news-start-error" errors={state.fieldErrors?.startsAt} />
            </label>
            <label className="admin-field">
              <span>Date et heure de fin</span>
              <input type="datetime-local" name="endsAt" defaultValue={localDateTime(news?.ends_at)} disabled={!editable} aria-invalid={Boolean(state.fieldErrors?.endsAt)} aria-describedby={state.fieldErrors?.endsAt ? "news-end-error" : undefined} />
              <FieldErrors id="news-end-error" errors={state.fieldErrors?.endsAt} />
            </label>
            <label className="admin-checkbox admin-field--wide">
              <input type="checkbox" name="featured" defaultChecked={news?.featured ?? false} disabled={!editable} />
              <span>Mettre cette actualité en avant</span>
            </label>
          </div>
        </section>

        <section className="admin-form-section" aria-labelledby="news-content-title">
          <div className="admin-form-section__heading"><h2 id="news-content-title">Contenu</h2></div>
          <RichTextEditor initialContent={(news?.content as JSONContent | undefined) ?? emptyContent} disabled={!editable} label="Contenu de l’actualité" invalid={Boolean(state.fieldErrors?.content)} describedBy={state.fieldErrors?.content ? "news-content-error" : undefined} />
          <FieldErrors id="news-content-error" errors={state.fieldErrors?.content} />
        </section>

        {editable ? <div className="admin-form-actions"><SaveButton label={mode === "create" ? "Créer le brouillon" : "Enregistrer"} /></div> : null}
      </form>

      <aside className="admin-editor-sidebar" aria-label="Publication">
        <h2>Publication</h2>
        <p className={`status-badge status-badge--${news?.status ?? "draft"}`}>
          {news?.status === "published" ? "Publiée" : news?.status === "archived" ? "Archivée" : "Brouillon"}
        </p>
        {lifecycleError ? <p className="form-status form-status--error" role="alert">{lifecycleError}</p> : null}
        {lifecycleSuccess ? <p className="form-status form-status--success" role="status">{lifecycleSuccess}</p> : null}
        {news?.status === "draft" ? (
          <form action={publishAction} className="admin-lifecycle-actions">
            <input type="hidden" name="newsId" value={news.id} />
            <LifecycleButton icon={Send} label="Publier" />
          </form>
        ) : null}
        {news?.status === "published" && profile.role === "admin" ? (
          <form action={archiveAction} className="admin-lifecycle-actions">
            <input type="hidden" name="newsId" value={news.id} />
            <LifecycleButton icon={Archive} label="Archiver" />
          </form>
        ) : null}
        {news?.status === "archived" && profile.role === "admin" ? (
          <form action={restoreAction} className="admin-lifecycle-actions">
            <input type="hidden" name="newsId" value={news.id} />
            <LifecycleButton icon={RotateCcw} label="Restaurer" />
          </form>
        ) : null}
      </aside>
    </div>
  );
}
