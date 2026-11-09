"use client";

import { Trash2, Upload } from "lucide-react";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { deleteGalleryItem, uploadGalleryItem, type GalleryActionState } from "@/app/admin/galerie/actions";
import { MAX_GALLERY_BYTES } from "@/lib/admin/gallery-input";
import { submitWithoutReset } from "@/lib/forms/submit-without-reset";

const initialState: GalleryActionState = {};

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  return messages ? <small id={id}>{messages.join(" ")}</small> : null;
}

export function GalleryUploadForm() {
  const [state, formAction, pending] = useActionState(uploadGalleryItem, initialState);
  const form = useRef<HTMLFormElement>(null);
  const [tooLarge, setTooLarge] = useState(false);
  const errors = tooLarge ? { ...state.fieldErrors, file: ["La photo dépasse 4 Mo."] } : (state.fieldErrors ?? {});
  const send = submitWithoutReset(formAction);
  // Larger requests are rejected by the host before the action runs, so check here first.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    const file = (event.currentTarget.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
    if (file && file.size > MAX_GALLERY_BYTES) {
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
          Titre de la création
          <input name="title" required maxLength={120} aria-invalid={Boolean(errors.title)} aria-describedby="gallery-title-error" />
          <FieldError id="gallery-title-error" messages={errors.title} />
        </label>
        <label className="admin-field">
          Auteur (prénom ou pseudo, facultatif)
          <input name="author" maxLength={80} aria-invalid={Boolean(errors.author)} aria-describedby="gallery-author-error" />
          <FieldError id="gallery-author-error" messages={errors.author} />
        </label>
        <label className="admin-field">
          Atelier (facultatif)
          <input name="workshop" maxLength={80} placeholder="Linogravure, collage…" aria-invalid={Boolean(errors.workshop)} aria-describedby="gallery-workshop-error" />
          <FieldError id="gallery-workshop-error" messages={errors.workshop} />
        </label>
        <label className="admin-field admin-field--wide">
          Photo JPEG, PNG ou WebP (4 Mo au plus)
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required aria-invalid={Boolean(errors.file)} aria-describedby="gallery-file-error" />
          <FieldError id="gallery-file-error" messages={errors.file} />
        </label>
        <label className="admin-checkbox admin-field--wide">
          <input type="checkbox" name="consent" required aria-invalid={Boolean(errors.consent)} aria-describedby="gallery-consent-error" />
          L’auteur a donné son accord pour que sa création soit publiée sur le site
        </label>
        <FieldError id="gallery-consent-error" messages={errors.consent} />
      </div>
      <div className="admin-form-actions">
        <button className="button button--dark" type="submit" disabled={pending}>
          <Upload aria-hidden="true" size={18} />
          {pending ? "Envoi en cours…" : "Ajouter à la galerie"}
        </button>
      </div>
    </form>
  );
}

export function DeleteGalleryItemButton({ id, title }: { id: string; title: string }) {
  const [state, formAction, pending] = useActionState(deleteGalleryItem, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Retirer « ${title} » de la galerie ?`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="itemId" value={id} />
      <button className="admin-icon-button" type="submit" disabled={pending} aria-label={`Supprimer ${title}`} title="Supprimer">
        <Trash2 aria-hidden="true" size={18} />
      </button>
      {state.formError ? <span className="admin-field-error" role="alert">{state.formError}</span> : null}
    </form>
  );
}
