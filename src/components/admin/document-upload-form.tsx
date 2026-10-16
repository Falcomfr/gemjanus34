"use client";

import { Upload } from "lucide-react";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { uploadDocument, type DocumentActionState } from "@/app/admin/documents/actions";
import { documentCategories, MAX_DOCUMENT_BYTES } from "@/lib/admin/document-input";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";

const initialState: DocumentActionState = {};

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  return messages ? <small id={id}>{messages.join(" ")}</small> : null;
}

export function DocumentUploadForm() {
  const [state, formAction, pending] = useActionState(uploadDocument, initialState);
  const form = useRef<HTMLFormElement>(null);
  const [tooLarge, setTooLarge] = useState(false);
  const errors = tooLarge ? { ...state.fieldErrors, file: ["Le fichier dépasse 4 Mo."] } : (state.fieldErrors ?? {});
  const send = submitWithoutReset(formAction);
  // Larger requests are rejected by the host before the action runs, so check here first.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    const file = (event.currentTarget.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
    if (file && file.size > MAX_DOCUMENT_BYTES) {
      event.preventDefault();
      setTooLarge(true);
      return;
    }
    setTooLarge(false);
    send(event);
  };

  useEffect(() => {
    if (state.success) form.current?.reset();
  }, [state]);

  return (
    <form className="admin-page-form" ref={form} onSubmit={submit}>
      {state.formError ? <p className="form-status form-status--error" role="alert">{state.formError}</p> : null}
      {state.success ? <p className="form-status form-status--success" role="status">{state.success}</p> : null}
      <div className="admin-form-grid">
        <label className="admin-field admin-field--wide">
          Titre
          <input name="title" required maxLength={160} aria-invalid={Boolean(errors.title)} aria-describedby="document-title-error" />
          <FieldError id="document-title-error" messages={errors.title} />
        </label>
        <label className="admin-field admin-field--wide">
          Description
          <input name="description" required maxLength={300} aria-invalid={Boolean(errors.description)} aria-describedby="document-description-error" />
          <FieldError id="document-description-error" messages={errors.description} />
        </label>
        <label className="admin-field">
          Catégorie
          <select name="category" required defaultValue="institutional" aria-invalid={Boolean(errors.category)} aria-describedby="document-category-error">
            {/* The planning is edited in the Planning section, not uploaded as a PDF. */}
            {Object.entries(documentCategories).filter(([value]) => value !== "planning").map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <FieldError id="document-category-error" messages={errors.category} />
        </label>
        <label className="admin-field">
          Date du document
          <input name="documentDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} aria-invalid={Boolean(errors.documentDate)} aria-describedby="document-date-error" />
          <FieldError id="document-date-error" messages={errors.documentDate} />
        </label>
        <label className="admin-field admin-field--wide">
          Fichier PDF (4 Mo au plus)
          <input name="file" type="file" accept="application/pdf,.pdf" required aria-invalid={Boolean(errors.file)} aria-describedby="document-file-error" />
          <FieldError id="document-file-error" messages={errors.file} />
        </label>
      </div>
      <div className="admin-form-actions">
        <button className="button button--dark" type="submit" disabled={pending}>
          <Upload aria-hidden="true" size={18} />
          {pending ? "Envoi en cours…" : "Mettre en ligne"}
        </button>
      </div>
    </form>
  );
}
