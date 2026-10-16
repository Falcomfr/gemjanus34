"use client";

import type { JSONContent } from "@tiptap/react";
import { Archive, History, Save, Send } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  archivePage,
  createPage,
  publishPage,
  restorePageRevision,
  updatePage,
  type PageActionState,
} from "@/app/admin/pages/actions";
import type { Profile } from "@/lib/auth/require-profile";
import type { Database } from "@/lib/database.types";
import { RichTextEditor } from "./rich-text-editor";

type PageRow = Pick<
  Database["public"]["Tables"]["pages"]["Row"],
  "id" | "slug" | "title" | "summary" | "content" | "status" | "navigation_position" | "parent_id"
>;

type RevisionRow = Pick<
  Database["public"]["Tables"]["page_revisions"]["Row"],
  "id" | "title" | "status" | "created_at"
>;

type ParentOption = Pick<Database["public"]["Tables"]["pages"]["Row"], "id" | "title">;

type PageFormProps = {
  mode: "create" | "edit";
  profile: Profile;
  page?: PageRow;
  parentOptions: ParentOption[];
  parentOptionsError?: boolean;
  revisions?: RevisionRow[];
  revisionsError?: boolean;
};

const emptyContent: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };
const initialPageActionState: PageActionState = {};

function FieldErrors({
  className,
  errors,
  id,
}: {
  className?: string;
  errors?: string[];
  id: string;
}) {
  if (!errors?.length) return null;

  return (
    <div className={className} id={id}>
      {errors.map((error) => <small key={error}>{error}</small>)}
    </div>
  );
}

function SubmitButton({ disabled = false, label }: { disabled?: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button--dark" type="submit" disabled={pending || disabled}>
      <Save aria-hidden="true" size={18} />
      {pending ? "Enregistrement…" : label}
    </button>
  );
}

function LifecycleSubmit({ icon: Icon, label }: { icon: typeof Send; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button--light" type="submit" disabled={pending}>
      <Icon aria-hidden="true" size={18} />
      {pending ? "Traitement…" : label}
    </button>
  );
}

export function PageForm({
  mode,
  profile,
  page,
  parentOptions,
  parentOptionsError = false,
  revisions = [],
  revisionsError = false,
}: PageFormProps) {
  const saveAction = mode === "create" ? createPage : updatePage;
  const [state, formAction] = useActionState(saveAction, initialPageActionState);
  const [publishState, publishAction] = useActionState(publishPage, initialPageActionState);
  const [archiveState, archiveAction] = useActionState(archivePage, initialPageActionState);
  const [restoreState, restoreAction] = useActionState(
    restorePageRevision,
    initialPageActionState,
  );

  const isAdmin = profile.role === "admin";
  const isPublished = page?.status === "published";
  const isEditable = mode === "create" || (!isPublished && (isAdmin || page?.status === "draft"));
  const canEditSlug = mode === "create" || isAdmin;
  const content = (page?.content as JSONContent | undefined) ?? emptyContent;
  const lifecycleState = publishState.formError ?? archiveState.formError ?? restoreState.formError;
  const lifecycleSuccess = publishState.success ?? archiveState.success ?? restoreState.success;
  const structureUnavailable = isAdmin && parentOptionsError;

  return (
    <div className="admin-editor-layout">
      <form className="admin-page-form" action={structureUnavailable ? undefined : formAction}>
        {page ? <input type="hidden" name="pageId" value={page.id} /> : null}
        <input type="hidden" name="status" value={page?.status ?? "draft"} />

        {isPublished ? (
          <p className="admin-notice">Cette page est publiée. Archivez-la avant de modifier son contenu.</p>
        ) : null}
        {state.formError ? (
          <p className="form-status form-status--error" role="alert" aria-live="assertive">
            {state.formError}
          </p>
        ) : null}
        {state.success ? (
          <p className="form-status form-status--success" role="status" aria-live="polite">
            {state.success}
          </p>
        ) : null}

        <section className="admin-form-section" aria-labelledby="page-identity-title">
          <div className="admin-form-section__heading">
            <h2 id="page-identity-title">Informations</h2>
            <p>Le titre et le résumé apparaissent dans les contenus publics.</p>
          </div>
          <div className="admin-form-grid">
            <label className="admin-field admin-field--wide">
              <span id="title-label">Titre</span>
              <input
                name="title"
                defaultValue={page?.title ?? ""}
                disabled={!isEditable}
                required
                maxLength={160}
                aria-labelledby="title-label"
                aria-invalid={Boolean(state.fieldErrors?.title)}
                aria-describedby={state.fieldErrors?.title ? "title-error" : undefined}
              />
              <FieldErrors id="title-error" errors={state.fieldErrors?.title} />
            </label>
            <label className="admin-field admin-field--wide">
              <span id="slug-label">Slug</span>
              <input
                name="slug"
                defaultValue={page?.slug ?? ""}
                disabled={!isEditable || !canEditSlug}
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                aria-labelledby="slug-label"
                aria-invalid={Boolean(state.fieldErrors?.slug)}
                aria-describedby={state.fieldErrors?.slug ? "slug-error" : undefined}
              />
              {!canEditSlug && page ? <input type="hidden" name="slug" value={page.slug} /> : null}
              <FieldErrors id="slug-error" errors={state.fieldErrors?.slug} />
            </label>
            <label className="admin-field admin-field--wide">
              <span id="summary-label">Résumé</span>
              <textarea
                name="summary"
                defaultValue={page?.summary ?? ""}
                disabled={!isEditable}
                rows={3}
                maxLength={500}
                aria-labelledby="summary-label"
                aria-invalid={Boolean(state.fieldErrors?.summary)}
                aria-describedby={state.fieldErrors?.summary ? "summary-error" : undefined}
              />
              <FieldErrors id="summary-error" errors={state.fieldErrors?.summary} />
            </label>
          </div>
        </section>

        <section className="admin-form-section" aria-labelledby="page-content-title">
          <div className="admin-form-section__heading">
            <h2 id="page-content-title">Contenu</h2>
          </div>
          <RichTextEditor
            initialContent={content}
            disabled={!isEditable}
            label="Contenu de la page"
            invalid={Boolean(state.fieldErrors?.content)}
            describedBy={state.fieldErrors?.content ? "content-error" : undefined}
          />
          <FieldErrors
            className="admin-field-error"
            id="content-error"
            errors={state.fieldErrors?.content}
          />
        </section>

        <section className="admin-form-section" aria-labelledby="page-navigation-title">
          <div className="admin-form-section__heading">
            <h2 id="page-navigation-title">Navigation</h2>
            <p>Ces réglages sont réservés aux administrateurs.</p>
          </div>
          {parentOptionsError ? (
            <p className="form-status form-status--error" role="alert" aria-live="assertive">
              Les pages parentes n’ont pas pu être chargées.
            </p>
          ) : null}
          <div className="admin-form-grid">
            <label className="admin-field">
              <span id="position-label">Position</span>
              <input
                type="number"
                min="0"
                name="navigationPosition"
                defaultValue={page?.navigation_position ?? ""}
                disabled={!isEditable || !isAdmin || parentOptionsError}
                aria-labelledby="position-label"
                aria-invalid={Boolean(state.fieldErrors?.navigationPosition)}
                aria-describedby={state.fieldErrors?.navigationPosition ? "position-error" : undefined}
              />
              {!isAdmin ? <input type="hidden" name="navigationPosition" value={page?.navigation_position ?? ""} /> : null}
              <FieldErrors id="position-error" errors={state.fieldErrors?.navigationPosition} />
            </label>
            <label className="admin-field">
              <span id="parent-label">Page parente</span>
              <select
                name="parentId"
                defaultValue={page?.parent_id ?? ""}
                disabled={!isEditable || !isAdmin || parentOptionsError}
                aria-labelledby="parent-label"
                aria-invalid={Boolean(state.fieldErrors?.parentId)}
                aria-describedby={state.fieldErrors?.parentId ? "parent-error" : undefined}
              >
                <option value="">Aucune</option>
                {parentOptions.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}
              </select>
              {!isAdmin ? <input type="hidden" name="parentId" value={page?.parent_id ?? ""} /> : null}
              <FieldErrors id="parent-error" errors={state.fieldErrors?.parentId} />
            </label>
          </div>
        </section>

        {isEditable ? (
          <div className="admin-form-actions">
            <SubmitButton
              disabled={structureUnavailable}
              label={mode === "create" ? "Créer la page" : "Enregistrer"}
            />
          </div>
        ) : null}
      </form>

      {mode === "edit" && page ? (
        <aside className="admin-editor-sidebar" aria-label="Publication et historique">
          <section>
            <h2>Publication</h2>
            <p className={`status-badge status-badge--${page.status}`}>{page.status === "draft" ? "Brouillon" : page.status === "published" ? "Publiée" : "Archivée"}</p>
            {lifecycleState ? (
              <p className="form-status form-status--error" role="alert" aria-live="assertive">
                {lifecycleState}
              </p>
            ) : null}
            {lifecycleSuccess ? (
              <p className="form-status form-status--success" role="status" aria-live="polite">
                {lifecycleSuccess}
              </p>
            ) : null}
            {isAdmin ? (
              <div className="admin-lifecycle-actions">
                {page.status !== "published" ? (
                  <form action={publishAction}>
                    <input type="hidden" name="pageId" value={page.id} />
                    <LifecycleSubmit icon={Send} label="Publier" />
                  </form>
                ) : null}
                {page.status !== "archived" ? (
                  <form action={archiveAction}>
                    <input type="hidden" name="pageId" value={page.id} />
                    <LifecycleSubmit icon={Archive} label="Archiver" />
                  </form>
                ) : null}
              </div>
            ) : <p>Un administrateur gère la publication.</p>}
          </section>

          <section>
            <h2>Révisions</h2>
            {revisionsError ? (
              <p className="form-status form-status--error" role="alert" aria-live="assertive">
                Les révisions n’ont pas pu être chargées.
              </p>
            ) : revisions.length === 0 ? <p>Aucune révision publiée.</p> : (
              <ol className="revision-list">
                {revisions.map((revision) => (
                  <li key={revision.id}>
                    <div>
                      <strong>{revision.title}</strong>
                      <time dateTime={revision.created_at}>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(revision.created_at))}</time>
                    </div>
                    {isAdmin ? (
                      <form action={restoreAction}>
                        <input type="hidden" name="revisionId" value={revision.id} />
                        <button type="submit" title="Restaurer cette révision" aria-label={`Restaurer la révision du ${new Intl.DateTimeFormat("fr-FR").format(new Date(revision.created_at))}`}>
                          <History aria-hidden="true" size={18} />
                        </button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      ) : null}
    </div>
  );
}
